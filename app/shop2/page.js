import { redirect } from "next/navigation";

/**
 * /shop2 was the preview URL while the new shop was being built. The shop is now
 * the front page. Kept as a redirect so old links still land somewhere useful,
 * and pointed straight at "/" rather than bouncing through /shop.
 */
export default function ShopV2Redirect() {
  redirect("/");
}
