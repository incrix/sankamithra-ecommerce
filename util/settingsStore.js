import { unstable_cache } from "next/cache";
import { TABLE, getItem, putItem, isDbConfigured } from "@/util/db/dynamo";
import { DEFAULT_BANNER } from "@/util/config";

/**
 * A tiny key/value store for site settings the admin can change - currently
 * just the price list PDF.
 *
 * Deliberately not the filesystem: on Vercel that is read-only, so a setting
 * written at runtime would vanish. Without a database configured the getters
 * return null and callers fall back to their compiled-in default.
 */

export async function getSetting(key) {
  if (!isDbConfigured()) return null;
  const doc = await getItem(TABLE.settings, key);
  return doc?.value ?? null;
}

/** Swallows a read failure. Use only where a missing value is survivable. */
export async function getSettingSafe(key) {
  try {
    return await getSetting(key);
  } catch (err) {
    console.error("getSetting failed:", err);
    return null;
  }
}

export async function setSetting(key, value) {
  if (!isDbConfigured()) throw new Error("No database configured");
  // A whole-item write, not a field patch: these rows are one value each, so
  // there is nothing beside it that a replace could clobber.
  await putItem(TABLE.settings, { key, value, updatedAt: new Date().toISOString() });
  return value;
}

export const BANNER_KEY = "banner";
export const BANNER_TAG = "site-banner";

/**
 * The top announcement strip, read by the root layout.
 *
 * Cached and tagged rather than read directly: an uncached database call in the
 * root layout would opt every page out of static rendering. The admin's save
 * calls revalidateTag(BANNER_TAG), so an edit still appears immediately.
 */
const readBanner = unstable_cache(
  async () => (await getSetting(BANNER_KEY)) || DEFAULT_BANNER,
  ["site-banner"],
  { tags: [BANNER_TAG], revalidate: 3600 }
);

/**
 * A failed read must not be cached.
 *
 * The cached function used to swallow database errors and return the built-in
 * default, so one momentary blip on a free-tier cluster got stored as though it
 * were the truth - and the site then advertised last year's sale for an hour.
 * The error now escapes the cache and is handled out here, where returning the
 * default costs nothing beyond this one request.
 */
export async function getBanner() {
  try {
    return await readBanner();
  } catch (err) {
    console.error("banner unavailable, using the default:", err.message);
    return DEFAULT_BANNER;
  }
}

export const WHOLESALE_KEY = "wholesaleSlug";

/**
 * The one unguessable path the dealer list lives behind.
 *
 * Generated once and then left alone - the shop shares this link with dealers
 * and a changing address would break every copy of it already sent out. It is
 * kept in the database rather than the source so it never reaches the repo.
 */
export async function getWholesaleSlug({ create = false } = {}) {
  const existing = await getSettingSafe(WHOLESALE_KEY);
  if (existing?.slug) return existing.slug;
  if (!create) return null;

  const slug = [...crypto.getRandomValues(new Uint8Array(12))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  await setSetting(WHOLESALE_KEY, { slug, createdAt: new Date().toISOString() });
  return slug;
}

export const PAYMENT_DETAILS_KEY = "paymentDetails";

/**
 * Where customers send their money, as the admin last saved it.
 *
 * Falls back to the built-in PhonePe number rather than nothing: an
 * order-received email with no way to pay is worse than one with the shop's
 * long-standing number on it.
 */
export async function getPaymentDetails() {
  const { DEFAULT_PAYMENT_DETAILS, normalisePaymentDetails } = await import("@/util/paymentDetails");
  const saved = await getSettingSafe(PAYMENT_DETAILS_KEY);
  return normalisePaymentDetails(saved || DEFAULT_PAYMENT_DETAILS);
}

export const ADMINS_KEY = "admins";

/**
 * The people who work the orders, as the dashboard lists them. Each order's
 * "Taken by" dropdown offers these names, so two people do not both ring the
 * same customer to confirm the same order.
 */
export const normaliseAdmins = (list) => {
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .map((n) => String(n ?? "").replace(/\s+/g, " ").trim().slice(0, 40))
    .filter((n) => n && !seen.has(n.toLowerCase()) && seen.add(n.toLowerCase()))
    .slice(0, 30);
};

export async function getAdmins() {
  return normaliseAdmins(await getSettingSafe(ADMINS_KEY));
}
