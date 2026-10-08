import { requireAdmin } from "@/util/admin/auth";
import { getAdmins, setSetting, normaliseAdmins, ADMINS_KEY } from "@/util/settingsStore";
import { isDbConfigured } from "@/util/db/dynamo";

export const dynamic = "force-dynamic";

/** The team names offered in each order's "Taken by" dropdown. Admin only. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return Response.json({ admins: await getAdmins() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    if (!isDbConfigured()) {
      return Response.json({ error: "No database configured" }, { status: 503 });
    }
    const { admins } = await request.json().catch(() => ({}));
    const list = normaliseAdmins(admins);
    await setSetting(ADMINS_KEY, list);
    return Response.json({ ok: true, admins: list });
  } catch (err) {
    console.error("admins save failed:", err);
    return Response.json({ error: "Save failed" }, { status: 500 });
  }
}
