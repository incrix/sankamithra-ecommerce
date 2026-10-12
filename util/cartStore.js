"use client";

/**
 * Where the cart is kept, so it survives the customer leaving the page.
 *
 * Customers build carts of 70-80 lines on a phone, switch to WhatsApp or
 * GPay, and come back. Phones and in-app browsers (WhatsApp, Instagram) reload
 * the page when they reclaim memory, and some of them start it again with its
 * localStorage empty - which looked to the customer like the cart vanishing.
 *
 * So the cart is kept in three places:
 *  1. localStorage["cart"]: the full lines, as before. The main copy.
 *  2. A cookie holding only "id:count" pairs - about 1 KB for 80 lines. Cookies
 *     survive in browsers that drop localStorage, and if the main copy is gone
 *     the cart is rebuilt from it with the live catalogue (see restoreCart).
 *  3. Memory, for the rest of this page's life if storage refuses a write
 *     (private browsing, a full disk) - an add must never silently do nothing.
 */

const KEY = "cart";
const COOKIE = "cart_backup";
export const CART_EVENT = "cart:updated";
const KEEP_DAYS = 30;

let memory = null;

const valid = (l) => Number.isFinite(l.id) && Number.isFinite(l.count) && l.count > 0;

/** The id:count pairs from the backup cookie. */
function readBackup() {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
    if (!m) return [];
    return decodeURIComponent(m[1]).split(",").map((pair) => {
      const [id, count] = pair.split(":");
      return { id: Number(id), count: Math.round(Number(count)) };
    }).filter(valid);
  } catch {
    return [];
  }
}

function writeBackup(cart) {
  try {
    const value = cart.filter((l) => l.count > 0).map((l) => `${l.id}:${l.count}`).join(",");
    const secure = location.protocol === "https:" ? "; Secure" : "";
    // A browser drops a cookie over 4 KB rather than truncating it; that is
    // ~300 lines, far past any real cart, so the backup is simply skipped there.
    if (!value || value.length > 3800) {
      document.cookie = `${COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
      return;
    }
    document.cookie = `${COOKIE}=${encodeURIComponent(value)}; Max-Age=${KEEP_DAYS * 86400}; Path=/; SameSite=Lax${secure}`;
  } catch { /* cookies blocked: the other two copies still stand */ }
}

/** The cart's full lines, as best this page can find them. */
export const readCart = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(raw) && raw.length) return raw;
  } catch { /* storage unavailable; fall through */ }
  return memory || [];
};

export const writeCart = (cart) => {
  memory = cart;
  try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* memory and cookie still hold it */ }
  writeBackup(cart);
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: cart }));
};

/** After an order is placed: every copy goes, not just the main one. */
export const clearSavedCart = () => writeCart([]);

/**
 * Rebuilds the cart from the backup cookie when the main copy has gone.
 *
 * Prices and names come from the live catalogue rather than the cookie, which
 * only holds ids. A product no longer sold is left out. Anything added to the
 * cart while this ran is kept, and wins over the backup for the same product.
 */
export async function restoreCart() {
  const current = readCart();
  const backup = readBackup();
  const missing = backup.filter((b) => !current.some((c) => c.id === b.id));
  if (!missing.length) return current;

  try {
    const res = await fetch("/api/products", { cache: "no-store" });
    const products = await res.json();
    if (!Array.isArray(products)) return current;
    const byId = new Map(products.map((p) => [Number(p.id), p]));
    const rebuilt = missing
      .filter((b) => byId.has(b.id))
      .map((b) => ({ ...byId.get(b.id), count: b.count }));
    if (!rebuilt.length) return current;

    // Re-read: the customer may have added something while the catalogue loaded.
    const now = readCart();
    const merged = [...rebuilt.filter((r) => !now.some((c) => c.id === r.id)), ...now];
    writeCart(merged);
    return merged;
  } catch {
    return current;
  }
}
