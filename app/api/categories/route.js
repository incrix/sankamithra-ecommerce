import { getCatalogue, addCategory, renameCategory, deleteCategory, reorderCategories } from "@/util/productsStore";
import { requireAdmin } from "@/util/admin/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { categories, products } = await getCatalogue();
  return Response.json({
    categories: categories.map((name) => ({
      name,
      count: products.filter((p) => p.category === name).length,
    })),
  });
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();

    // Reordering is a different job from renaming, so it comes in explicitly.
    if (body.action === "reorder") {
      const categories = await reorderCategories(body.values);
      return Response.json({ ok: true, categories });
    }

    const { name, from } = body;
    const categories = from ? await renameCategory(from, name) : await addCategory(name);
    return Response.json({ ok: true, categories });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const name = new URL(request.url).searchParams.get("name");
    return Response.json({ ok: true, categories: await deleteCategory(name) });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
