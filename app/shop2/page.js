import { redirect } from "next/navigation";

/**
 * /shop2 was the preview URL while the new shop was being built. It is now the
 * shop, served from /shop. Kept as a redirect so old links and bookmarks still
 * land in the right place.
 */
export default function ShopV2Redirect() {
  redirect("/shop");
}
