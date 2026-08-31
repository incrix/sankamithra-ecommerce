import { updateProduct, deleteProduct } from "@/util/productsStore";
import { requireAdmin } from "@/util/admin/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const product = await updateProduct(params.id, await request.json());
    if (!product) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true, product });
  } catch (err) {
    return Response.json({ error: err.message || "Could not save" }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const gone = await deleteProduct(params.id);
  if (!gone) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
