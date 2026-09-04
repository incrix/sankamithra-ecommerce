/**
 * Where product media lives.
 *
 * Assets are hosted on Hostinger at thunder.sankamithra.com/database — images,
 * the price list PDF and the catalogue seed. Serving them from there keeps the
 * 58 MB of artwork out of the application deployment entirely.
 *
 * Override per environment with NEXT_PUBLIC_ASSET_BASE (no trailing slash).
 * Point it at "/database" to serve from a local public/database folder instead.
 */
export const ASSET_BASE = (
  process.env.NEXT_PUBLIC_ASSET_BASE || "https://thunder.sankamithra.com/database"
).replace(/\/$/, "");

/** The catalogue seed, read once by the product store to populate itself. */
export const PRODUCT_SEED_URL = `${ASSET_BASE}/SortedJSON/productData.json`;

/** Live catalogue for the storefront: the editable store, not the seed file. */
export const PRODUCT_DATA_URL = "/api/products";

/** Used until the admin uploads one - the copy that shipped with the site. */
export const PRICE_LIST_FALLBACK = `${ASSET_BASE}/${encodeURIComponent(
  "SANKAMITHRA THUNDER WORLD PRICE LIST 2025.pdf"
)}`;

/**
 * Every "Download price list" link points here. The route redirects to
 * whichever PDF the admin last uploaded, so the links never need updating.
 */
export const PRICE_LIST_URL = "/api/price-list";

/**
 * Resolves a stored image path to a URL.
 *
 * Handles three shapes: images added through the admin (public/uploads),
 * absolute URLs, and catalogue paths — some of which carry a leading slash
 * ("/sankamithraspecial's/luckymoney/1.png") that would otherwise produce a
 * double slash. Path segments are encoded so apostrophes and spaces survive.
 */
export function assetUrl(path) {
  if (!path) return "";
  const clean = String(path).replace(/^\/+/, "");
  // Images the admin uploaded: from the database, or from public/uploads when
  // running without one.
  if (clean.startsWith("media/")) return `/api/${clean}`;
  if (clean.startsWith("uploads/")) return `/${clean}`;
  if (/^https?:\/\//.test(clean)) return clean;
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${ASSET_BASE}/${encoded}`;
}

/** Shown in the top strip until the admin edits it. */
export const DEFAULT_BANNER = {
  text: "Diwali 2025 Sale LIVE — Up to 80% OFF!",
  href: "",
  enabled: true,
};
