import { requireAdmin } from "@/util/admin/auth";
import { getWholesaleSlug } from "@/util/settingsStore";
import { getWholesaleItems, updateWholesaleItem, matchImages } from "@/util/wholesaleStore";
import { getCatalogue } from "@/util/productsStore";
import { SITE_URL } from "@/util/site";

export const dynamic = "force-dynamic";

/** The dealer link and the whole list, for the admin screen. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [slug, items] = await Promise.all([getWholesaleSlug({ create: true }), getWholesaleItems()]);
  return Response.json({
    slug, path: `/wholesale-list/${slug}`, url: `${SITE_URL}/wholesale-list/${slug}`,
    items,
  });
}

export async function PATCH(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));

  // One-off: borrow photographs from the retail catalogue for the lines the
  // shop also sells. Kept behind an explicit action rather than run on every
  // read, since it walks the whole catalogue.
  if (body.action === "matchImages") {
    const { products } = await getCatalogue();
    return Response.json({ ok: true, ...(await matchImages(products)) });
  }

  if (!body.code) return Response.json({ error: "No item given" }, { status: 400 });
  const item = await updateWholesaleItem(body.code, body);
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true, item });
}
