import { requireAdmin } from "@/util/admin/auth";
import { mailDiagnostics, sendTestMail } from "@/util/sendMail";

export const dynamic = "force-dynamic";

/** Connects and authenticates without sending anything. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return Response.json(await mailDiagnostics());
}

/** Sends a real test message, to prove delivery end to end. */
export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { to } = await request.json().catch(() => ({}));
  try {
    const info = await sendTestMail(to);
    return Response.json({ ok: true, ...info });
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message, code: err.code, responseCode: err.responseCode, command: err.command },
      { status: 502 }
    );
  }
}
