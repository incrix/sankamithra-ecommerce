import { getWholesaleItems } from "@/util/wholesaleStore";

/**
 * The dealer catalogue as the public page sees it.
 *
 * Stock is the switch: an explicit zero means the item is gone from the list
 * entirely - not greyed out - because a dealer working down a page should only
 * see what can be shipped today. Stock left blank means the shop is not
 * counting that line, and it stays listed.
 */
export async function getWholesaleCatalogue() {
  const all = await getWholesaleItems();
  const listed = all.filter((i) => i.active !== false && i.stock !== 0);

  const bySection = new Map();
  for (const i of listed) {
    if (!bySection.has(i.section)) bySection.set(i.section, []);
    bySection.get(i.section).push(i);
  }

  return {
    categories: [...bySection.entries()].map(([name, items]) => ({ name, items })),
    count: listed.length,
  };
}
