import { requireAdmin } from "@/util/admin/auth";
import { dbDiagnostics } from "@/util/db/mongo";
import { mailDiagnostics } from "@/util/sendMail";
import { PRODUCT_SEED_URL, ASSET_BASE } from "@/util/config";

export const dynamic = "force-dynamic";

/** One call that says whether a deployment is actually wired up correctly. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [db, mail, assets] = await Promise.all([
    dbDiagnostics(),
    mailDiagnostics(),
    fetch(PRODUCT_SEED_URL, { method: "HEAD", cache: "no-store" })
      .then((r) => ({ ok: r.ok, status: r.status, base: ASSET_BASE }))
      .catch((e) => ({ ok: false, error: e.message, base: ASSET_BASE })),
  ]);

  return Response.json({
    ok: db.ok && mail.ok && assets.ok,
    // Storage is the one that decides whether a serverless deploy can work at all.
    storage: db.configured ? "mongodb" : "filesystem (will fail on serverless)",
    db,
    mail: { ok: mail.ok, stage: mail.stage, host: mail.config?.host, user: mail.config?.user, error: mail.error },
    assets,
    site: process.env.NEXT_PUBLIC_SITE_URL || "(NEXT_PUBLIC_SITE_URL not set — canonicals default to thunder.sankamithra.com)",
  });
}
