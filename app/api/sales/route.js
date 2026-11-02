import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/util/admin/auth";
import { getSalesCached, setSetting, SALES_KEY, SALES_TAG } from "@/util/settingsStore";
import { normaliseSales, activePoints } from "@/util/minimumOrder";
import { isDbConfigured } from "@/util/db/dynamo";

export const dynamic = "force-dynamic";

/**
 * Whether online sales are on, and the delivery points.
 *
 * Readable by anyone: the storefront and checkout show these to every customer.
 * Only the admin can change them, and the POST revalidates the cached read so
 * a save shows up straight away.
 */
export async function GET() {
  try {
    return Response.json(await getSalesCached(), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("sales settings unavailable:", err.message);
    return Response.json({ error: "Unavailable" }, { status: 503 });
  }
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    if (!isDbConfigured()) {
      return Response.json({ error: "No database configured" }, { status: 503 });
    }
    const sales = normaliseSales(await request.json());
    if (sales.open && !activePoints(sales).length) {
      return Response.json({ error: "Tick at least one delivery city, or turn sales off" }, { status: 400 });
    }
    await setSetting(SALES_KEY, sales);
    revalidateTag(SALES_TAG);
    return Response.json({ ok: true, sales });
  } catch (err) {
    console.error("sales settings save failed:", err);
    return Response.json({ error: "Save failed" }, { status: 500 });
  }
}
