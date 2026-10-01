/**
 * Combo packs.
 *
 * A combo is an ordinary product - its own MRP, discount and Pricelist 2 rate -
 * that also carries `contents`: the crackers that go into the box. Staying an
 * ordinary product is the point. The cart, checkout, counter bill and invoice
 * price it exactly like anything else, and only the shop window and the packing
 * list need to know it is a box of other things.
 *
 * Imports only util/pricing, deliberately: the stores normalise through this on
 * the server, and util/cart is a client module.
 */
import { lineAmount, sumAmounts } from "@/util/pricing";

export const COMBO_CATEGORY = "Combo";

/** Coerces a contents list to [{ id, name, count }], merging repeats and dropping junk. */
export function normaliseContents(list) {
  if (!Array.isArray(list)) return [];
  const merged = new Map();
  for (const c of list) {
    const id = Number(c?.id);
    const count = Math.round(Number(c?.count));
    if (!Number.isFinite(id) || !(count > 0)) continue;
    const prev = merged.get(id);
    merged.set(id, {
      id,
      name: String(c.name || prev?.name || "").trim(),
      count: (prev?.count || 0) + count,
    });
  }
  return [...merged.values()];
}

export const isCombo = (p) => Array.isArray(p?.contents) && p.contents.length > 0;

/** Pieces in the box, counting every packet. */
export const comboUnits = (p) => (p?.contents || []).reduce((n, c) => n + (c.count || 0), 0);

/**
 * What the contents would cost bought one by one, at the shop's current prices.
 *
 * Null when any item is missing from `products` - hidden from the shop or
 * deleted - because a total that silently leaves something out would overstate
 * the saving.
 */
export function separatePrice(p, products) {
  const byId = new Map((products || []).map((x) => [x.id, x]));
  const lines = (p?.contents || []).map((c) => ({ item: byId.get(c.id), count: c.count }));
  if (lines.some((l) => !l.item)) return null;
  return sumAmounts(lines, (l) => lineAmount(l.item.price, l.item.discount, l.count));
}
