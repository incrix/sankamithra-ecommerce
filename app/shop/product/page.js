import { redirect } from "next/navigation";
import { getProduct } from "@/util/products.server";
import { productSlug } from "@/util/site";

/** /shop/product?id=1 -> /product/lucky-money-1, so old links keep their value. */
export default async function LegacyProductRedirect({ searchParams }) {
  const product = await getProduct(searchParams?.id);
  redirect(product ? `/product/${productSlug(product)}` : "/");
}
