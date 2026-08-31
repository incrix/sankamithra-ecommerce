import { getPublicProducts } from "@/util/productsStore";

/**
 * Server-side product access, for metadata, structured data and sitemaps.
 *
 * The catalogue is fetched in the browser for the interactive shop, but search
 * engines need it rendered into the HTML - so pages read it here at request
 * time instead, straight from the same store the admin edits.
 */

export async function getProducts() {
  try {
    return await getPublicProducts();
  } catch (err) {
    console.error("product data unavailable:", err.message);
    return [];
  }
}

export async function getProduct(id) {
  return (await getProducts()).find((p) => String(p.id) === String(id)) || null;
}

export async function getCategories() {
  const counts = new Map();
  (await getProducts()).forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}
