import { updateOrder, getOrder } from "@/util/ordersStore";
import { requireAdmin } from "@/util/admin/auth";
import { withRetry } from "@/util/db/mongo";
import { sendCustomerMail } from "@/util/sendMail";

export const dynamic = "force-dynamic";

/**
 * Status changes the customer should hear about, and the template each uses.
 * "packing" is left out on purpose: starting to pack is an internal step, and
 * mailing about it is noise.
 */
const NOTIFY_ON = { packed: "packed", dispatched: "dispatch", cancelled: "cancelled" };

export async function GET(_request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const order = await getOrder(params.id);
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ order });
}

export async function PATCH(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const patch = await request.json().catch(() => ({}));

  // Retried: a packer ticking through a list should not lose a change because
  // the cluster shed load for a moment.
  const before = await withRetry(() => getOrder(params.id));
  const order = await withRetry(() => updateOrder(params.id, patch));
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  // Tell the customer when the status genuinely moved, so the shop never has to
  // remember to. A mail failure must not fail the status change itself.
  let mail = null;
  const kind = NOTIFY_ON[order.status];
  const changed = before && before.status !== order.status;

  if (changed && kind && order.customer?.email && patch.notify !== false) {
    try {
      // `invoice` is the re-issued proforma from the panel, reflecting any
      // substitutions made while packing.
      await sendCustomerMail({ order, kind, invoice: patch.invoice });
      mail = { sent: true, kind };
    } catch (err) {
      console.error(`status mail for ${order.ref} failed:`, err.message);
      mail = { sent: false, kind, error: err.message };
    }
  }

  return Response.json({ order, mail });
}
