"use client";
import { usePathname } from "next/navigation";

/**
 * Hides the customer-facing shop chrome (announcement bar, navs, search,
 * footer, floating buttons) on /admin and on the wholesale dealer list.
 *
 * The admin panel is a work tool, not a storefront - the shop header, product
 * search and cart FAB are noise there, and the FABs sit on top of the order
 * detail. Children are passed straight through, so the server components inside
 * stay server components.
 */
export default function ShopChrome({ children }) {
  const pathname = usePathname();
  // The dealer list is not the shop either - it carries no navigation, no
  // cart and no branding beyond its own title, because it is a price list
  // handed to a trade buyer, not a page to browse the store from.
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/wholesale-list")) return null;
  return <>{children}</>;
}
