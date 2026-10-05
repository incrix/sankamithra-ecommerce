import { requireAdmin } from "@/util/admin/auth";
import { getPaymentDetails, setSetting, PAYMENT_DETAILS_KEY } from "@/util/settingsStore";
import { normalisePaymentDetails, paymentDetailsProblem } from "@/util/paymentDetails";
import { isDbConfigured } from "@/util/db/dynamo";

export const dynamic = "force-dynamic";

/**
 * How customers pay.
 *
 * Readable by anyone: the order-placed screen shows these details to every
 * customer, and so does the email they receive - there is nothing here that is
 * not printed for them anyway. Only the admin can change them.
 */
export async function GET() {
  return Response.json(await getPaymentDetails(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    if (!isDbConfigured()) {
      return Response.json({ error: "No database configured" }, { status: 503 });
    }
    const details = normalisePaymentDetails(await request.json());
    const problem = paymentDetailsProblem(details);
    if (problem) return Response.json({ error: problem }, { status: 400 });

    await setSetting(PAYMENT_DETAILS_KEY, details);
    return Response.json({ ok: true, details });
  } catch (err) {
    console.error("payment details save failed:", err);
    return Response.json({ error: "Save failed" }, { status: 500 });
  }
}
