import { notFound } from "next/navigation";
import { getWholesaleSlug } from "@/util/settingsStore";
import { getWholesaleCatalogue } from "@/util/wholesale.server";
import WholesaleList from "@/app/components/wholesale/WholesaleList";

// Always fresh: a dealer must never be shown a case count that has since sold.
export const dynamic = "force-dynamic";

/** Unlisted, and told so explicitly - this must never reach an index. */
export const metadata = {
  title: "Wholesale price list",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default async function WholesaleListPage({ params }) {
  const slug = await getWholesaleSlug();
  // No slug issued yet, or the wrong one: indistinguishable from a page that
  // does not exist, which is the point.
  if (!slug || params.slug !== slug) notFound();

  const { categories, count } = await getWholesaleCatalogue();
  return <WholesaleList categories={categories} count={count} />;
}
