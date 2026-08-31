import { getPublicProducts, getCatalogue, createProduct, applyBulkDiscount } from "@/util/productsStore";
import { requireAdmin } from "@/util/admin/auth";

export const dynamic = "force-dynamic";

/** Public catalogue for the storefront; ?all=1 returns everything for the admin. */
export async function GET(request) {
  const wantsAll = new URL(request.url).searchParams.get("all") === "1";
  if (wantsAll) {
    const denied = await requireAdmin();
    if (denied) return denied;
    return Response.json(await getCatalogue());
  }
  return Response.json(await getPublicProducts());
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
