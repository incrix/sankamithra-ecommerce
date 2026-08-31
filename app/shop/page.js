import { redirect } from "next/navigation";

/** The shop is the front page now. Kept so old links and adverts still land. */
export default function ShopRedirect({ searchParams }) {
  const c = searchParams?.category;
  redirect(c ? `/?category=${encodeURIComponent(c)}` : "/");
}
