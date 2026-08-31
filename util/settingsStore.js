import { unstable_cache } from "next/cache";
import { collection, isDbConfigured } from "@/util/db/mongo";
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
  try {
    const doc = await (await collection("settings")).findOne({ key });
    return doc?.value ?? null;
  } catch (err) {
    console.error("getSetting failed:", err);
    return null;
  }
}

export async function setSetting(key, value) {
  if (!isDbConfigured()) throw new Error("No database configured");
  await (await collection("settings")).updateOne(
    { key },
    { $set: { key, value, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
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
export const getBanner = unstable_cache(
  async () => (await getSetting(BANNER_KEY)) || DEFAULT_BANNER,
  ["site-banner"],
  { tags: [BANNER_TAG], revalidate: 3600 }
);
