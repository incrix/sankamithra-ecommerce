import { SITE_URL, productSlug } from "@/util/site";
import { getProducts } from "@/util/products.server";

/** Every indexable URL, products included, so all 145 can be crawled. */
export default async function sitemap() {
  const now = new Date();

  const pages = [
    { path: "/", priority: 1.0, changeFrequency: "daily" },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" },
    { path: "/factory", priority: 0.7, changeFrequency: "monthly" },
    { path: "/safety", priority: 0.7, changeFrequency: "monthly" },
    { path: "/wholesale", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  ].map((p) => ({ url: `${SITE_URL}${p.path}`, lastModified: now, ...p, url: `${SITE_URL}${p.path}` }));

  const products = (await getProducts()).map((p) => ({
    url: `${SITE_URL}/product/${productSlug(p)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...pages, ...products];
}
