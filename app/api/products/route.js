import { getPublicProducts, getCatalogue, createProduct, applyBulkDiscount } from "@/util/productsStore";
import { requireAdmin } from "@/util/admin/auth";

export const dynamic = "force-dynamic";

/**
 * The list the shop renders from.
 *
 * description and shortDescription are 76% of this payload and are only ever
 * read on a product's own page - which is server-rendered and already has
 * them. Every visitor was downloading ~120 KB of prose the list never shows.
 */
async function getStorefrontList() {
  const products = await getPublicProducts();
  return products.map(({ description, shortDescription, ...rest }) => rest);
}

/** Public catalogue for the storefront; ?all=1 returns everything for the admin. */
export async function GET(request) {
  const wantsAll = new URL(request.url).searchParams.get("all") === "1";
  if (wantsAll) {
    const denied = await requireAdmin();
    if (denied) return denied;
    // Never cached: this is an authenticated response, and it includes hidden
    // products. A shared cache must not be able to hand it to anyone else.
    return Response.json(await getCatalogue(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  // Every visitor's browser fetches this on page load, so without a cache the
  // catalogue is queried once per page view. Cached at the CDN it is queried
  // about twice a minute no matter how much traffic arrives - which is what
  // keeps a free-tier cluster inside its 500 connection limit during a rush.
  // The cost is that an admin price or stock edit takes up to 30s to reach the
  // shop list.
  return Response.json(await getStorefrontList(), {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    // A bulk sale comes through the same endpoint with an explicit action.
    if (body?.action === "bulkDiscount") {
      const changed = await applyBulkDiscount(body);
      return Response.json({ ok: true, changed });
    }
    return Response.json({ ok: true, product: await createProduct(body) });
  } catch (err) {
    return Response.json({ error: err.message || "Could not save" }, { status: 400 });
  }
}
