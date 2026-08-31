import { getOrder } from "@/util/ordersStore";
import { requireAdmin } from "@/util/admin/auth";
import { sendCustomerMail } from "@/util/sendMail";

export const dynamic = "force-dynamic";

/**
 * Emails the customer about this order, with their invoice attached.
 *
 * The PDF arrives as base64 from the admin panel rather than being rendered
 * here: the invoice template is a "use client" component, so importing it into
 * a server route yields a client reference object rather than a component
 * (React error #130). The browser already renders it correctly for checkout.
 */
export async function POST(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const order = await getOrder(params.id);
    if (!order) return Response.json({ error: "Not found" }, { status: 404 });

    if (!order.customer?.email) {
      return Response.json({ error: "This order has no customer email" }, { status: 400 });
    }

    const { kind = "invoice", invoice } = await request.json().catch(() => ({}));

    await sendCustomerMail({ order, invoice, kind });

    return Response.json({ ok: true, sentTo: order.customer.email });
  } catch (err) {
    console.error("order email failed:", err);
    return Response.json(
      { error: err?.message || "Could not send the email" },
      { status: 500 }
    );
  }
}
