import { listOrders, createOrder, orderStats, updateOrder } from "@/util/ordersStore";
import { requireAdmin } from "@/util/admin/auth";
import { sendOrderMails } from "@/util/sendMail";

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
 */
export async function POST(request) {
  try {
    const { billingDetails, productList, invoice, source, note, clientRef } = await request.json();

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

    const order = await createOrder({ billingDetails, productList, emailSent: false, source: isPos ? "pos" : "online", note, clientRef });

    // A retry of a bill that already landed: return it without billing again
    // and without sending the confirmation emails a second time.
    if (order.duplicate) {
      return Response.json({ ok: true, ref: order.ref, id: order.id, duplicate: true });
    }

    let mail = { customer: false, shop: false, errors: {} };
    try {
      mail = await sendOrderMails({ order, invoice });
    } catch (err) {
      console.error("order mail failed:", err);
      mail.errors.general = err?.message;
    }

    // The panel flags orders the shop was never told about.
    if (mail.shop) await updateOrder(order.id, { emailSent: true });

    if (!mail.customer || !mail.shop) {
      console.error(`order ${order.ref} mail issues:`, mail.errors);
    }

    return Response.json({ ok: true, ref: order.ref, id: order.id, mail });
  } catch (err) {
    console.error("order create failed:", err);
    return Response.json({ error: "Could not save order" }, { status: 500 });
  }
}
