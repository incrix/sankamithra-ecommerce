import { listOrders, createOrder, orderStats, updateOrder, getOrder } from "@/util/ordersStore";
import { requireAdmin } from "@/util/admin/auth";
import { sendOrderMails } from "@/util/sendMail";
import { lineAmount, sumAmounts, inr } from "@/util/pricing";
import { meetsMinimumFor, belowMinimumMessage, acceptsDeliveryTo, deliveryClosedMessage, onlineSalesOpen, SALES_CLOSED_MESSAGE } from "@/util/minimumOrder";

export const dynamic = "force-dynamic";
// Saving the order plus two emails; the default 10s can be tight on a slow
// mail server. Vercel Pro honours this, Hobby caps at 10s regardless.
export const maxDuration = 30;

/** Admin only - the order list carries customer contact details. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [orders, stats] = await Promise.all([listOrders(), orderStats()]);
  return Response.json({ orders, stats });
}

/**
 * Public: called by checkout when a customer places an order.
 *
 * Records the order first, then emails both copies - the customer's receipt and
 * the shop's packing notice. The order is saved either way: a mail outage must
 * never cost the shop an order, and both emails carry the reference (STW-0001)
 * that is only known once the order exists.
 *
 * `invoice` is base64 PDF rendered in the browser. The invoice template is a
 * "use client" component, so rendering it on the server yields a client
 * reference rather than a component (React error #130).
 *
 * The proforma prints the reference as its Est No, which the browser cannot
 * know before the order exists. So checkout and the counter send `deferMail`:
 * the order is saved and its reference returned without mailing, then the
 * browser renders the proforma with that reference and posts it back here as
 * `{ mailFor: id, invoice }` to send both emails. That second step lives on
 * this public route because every /api/orders/* sub-path is admin only.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    if (body.mailFor) return mailPlacedOrder(body.mailFor, body.invoice);

    const { billingDetails, productList, invoice, source, note, clientRef, priceList, extraDiscount, deferMail } = body;

    // A counter sale is staff-created, so it requires an admin session. Without
    // this check anyone could post orders that look like they came from the shop.
    const isPos = source === "pos";
    if (isPos) {
      const denied = await requireAdmin();
      if (denied) return denied;
    }

    if (!billingDetails?.name || !Array.isArray(productList) || !productList.length) {
      return Response.json({ error: "Invalid order payload" }, { status: 400 });
    }

    // The website minimum, checked here as well as at checkout so it holds no
    // matter what the browser sends. Counter bills are exempt - see Pos.jsx.
    if (!isPos) {
      // Website orders are closed for the season once the cut-off passes.
      if (!onlineSalesOpen()) {
        return Response.json({ error: SALES_CLOSED_MESSAGE }, { status: 400 });
      }
      // Out-of-state website orders are closed this season.
      if (!acceptsDeliveryTo(billingDetails.state)) {
        return Response.json({ error: deliveryClosedMessage(billingDetails.state) }, { status: 400 });
      }
      const total = sumAmounts(productList, (p) => lineAmount(p.price, p.discount, p.count));
      if (!meetsMinimumFor(total, billingDetails.state)) {
        return Response.json({ error: belowMinimumMessage(billingDetails.state) }, { status: 400 });
      }
    }

    // The pricing basis is only meaningful for a counter bill, and only staff
    // can write one. A website order is always Pricelist 1 with no extra, so
    // taking these from a public caller would let it relabel its own pricing.
    const order = await createOrder({
      billingDetails, productList, emailSent: false,
      source: isPos ? "pos" : "online", note, clientRef,
      priceList: isPos ? priceList : 1,
      extraDiscount: isPos ? extraDiscount : 0,
    });

    // A retry of a bill that already landed: return it without billing again
    // and without sending the confirmation emails a second time.
    if (order.duplicate) {
      return Response.json({ ok: true, ref: order.ref, id: order.id, duplicate: true });
    }

    if (deferMail) return Response.json({ ok: true, ref: order.ref, id: order.id });

    const mail = await mailOrder(order, invoice);
    return Response.json({ ok: true, ref: order.ref, id: order.id, mail });
  } catch (err) {
    // Not a fault: the shelf is short. Say which lines, so the customer (or
    // the counter) can lower the quantity and try again.
    if (err?.code === "OUT_OF_STOCK") {
      return Response.json({ error: err.message, outOfStock: err.short }, { status: 409 });
    }
    console.error("order create failed:", err);
    return Response.json({ error: "Could not save order" }, { status: 500 });
  }
}

/**
 * How long after placing an order its browser may ask for the emails. Public,
 * so it is kept short: the id is an unguessable UUID that only the placing
 * browser holds, and this bounds what anyone holding one could do with it.
 */
const MAIL_WINDOW_MS = 15 * 60 * 1000;

/** The second half of a `deferMail` order - see POST above. */
async function mailPlacedOrder(id, invoice) {
  const order = await getOrder(String(id));
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  if (order.emailSent) return Response.json({ ok: true, ref: order.ref, mail: { customer: true, shop: true } });
  if (Date.now() - new Date(order.createdAt).getTime() > MAIL_WINDOW_MS) {
    return Response.json({ error: "Too late to request these emails" }, { status: 410 });
  }
  const mail = await mailOrder(order, invoice);
  return Response.json({ ok: true, ref: order.ref, mail });
}

/** Sends both copies of a new order. Never throws: the order is already saved. */
async function mailOrder(order, invoice) {
  let mail = { customer: false, shop: false, errors: {} };
  try {
    mail = await sendOrderMails({ order, invoice });
  } catch (err) {
    console.error("order mail failed:", err);
    mail.errors.general = err?.message;
  }

  // The panel flags orders the shop was never told about.
  if (mail.shop) await updateOrder(order.id, { emailSent: true });

  // A counter bill with no customer email skips that mail on purpose.
  if ((!mail.customer && !mail.customerSkipped) || !mail.shop) {
    console.error(`order ${order.ref} mail issues:`, mail.errors);
  }
  return mail;
}
