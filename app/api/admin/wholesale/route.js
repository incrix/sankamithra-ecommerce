import { requireAdmin } from "@/util/admin/auth";
import { getWholesaleSlug } from "@/util/settingsStore";
import { SITE_URL } from "@/util/site";

export const dynamic = "force-dynamic";

/**
 * The dealer link.
 *
 * Issued on first request and then fixed: the shop sends this address to
 * dealers, so it must keep working. It lives in the database rather than the
 * source, which keeps it out of the repository.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const slug = await getWholesaleSlug({ create: true });
  return Response.json({ slug, path: `/wholesale-list/${slug}`, url: `${SITE_URL}/wholesale-list/${slug}` });
}
