import { getCatalogue } from "@/util/productsStore";

/**
 * The dealer catalogue.
 *
 * Deliberately built from its own three fields rather than the shop's: a
 * product appears here only once it has a box rate and stock of its own, so
 * the wholesale list can never accidentally inherit retail pricing or show an
 * item the shop has not decided to trade in cases.
 *
 * Out of stock means gone, not greyed out - a dealer working down a list
 * should only ever see what can actually be shipped today.
 *
 * Restricted to Sankamithra's own brand: the shop wholesales what it makes
 * its name on, not the bought-in lines it retails alongside them.
 */
export const OWN_BRAND = /^Sankamithra\s*/i;

export async function getWholesaleCatalogue() {
  const { products } = await getCatalogue();

  const listed = products
    .filter((p) => OWN_BRAND.test(p.plSection || ""))
    .filter((p) => p.wsBoxRate > 0 && p.wsStock > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      // Grouped by the section it sits in on the printed list - "Glitz",
      // "Peacocks" - which is how the shop and its dealers already talk about
      // these, rather than the broad shop categories.
      category: (p.plSection || p.category || "Others").replace(OWN_BRAND, "").trim() || "Others",
      image: p.image?.[0] || null,
      boxRate: p.wsBoxRate,
      caseContents: p.wsCase || null,
      stock: p.wsStock,
      caseRate: p.wsCase ? Math.round(p.wsBoxRate * p.wsCase) : null,
      sortOrder: p.sortOrder ?? 9999,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const byCategory = new Map();
  for (const item of listed) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push(item);
  }

  return {
    categories: [...byCategory.entries()].map(([name, items]) => ({ name, items })),
    count: listed.length,
  };
}
