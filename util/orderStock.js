/**
 * How orders move the stock count.
 *
 * Rather than every kind of order edit adjusting stock by hand, an order is
 * read as "the units it is holding", and stock moves by the difference between
 * an order before and after a change. Placing an order takes its units; adding
 * a line, raising a count or choosing a replacement takes more; removing a line
 * or cancelling the order gives them back, and reopening takes them again.
 *
 * A line the packer marks out of stock keeps holding its units: the shelf did
 * not have them, so giving them back would put a phantom count on the website.
 */

/** product id -> units this order holds. A cancelled order holds nothing. */
export function stockHeld(order) {
  const held = new Map();
  if (!order || order.status === "cancelled") return held;

  const take = (id, n) => {
    const key = Number(id);
    const units = Math.max(0, Math.round(Number(n) || 0));
    if (!Number.isFinite(key) || !units) return;
    held.set(key, (held.get(key) || 0) + units);
  };

  for (const it of order.items || []) {
    take(it.id, it.count);
    if (it.substitute) take(it.substitute.id, it.substitute.count);
  }
  return held;
}

/**
 * What to add to each product's stock to go from `prev` to `next`.
 * Negative means units are taken out. Products that do not move are left out.
 */
export function stockChange(prev, next) {
  const before = stockHeld(prev);
  const after = stockHeld(next);
  const change = new Map();
  for (const id of new Set([...before.keys(), ...after.keys()])) {
    const d = (before.get(id) || 0) - (after.get(id) || 0);
    if (d) change.set(id, d);
  }
  return change;
}

/** Raised when an order asks for more than the shelf holds. The route answers 409. */
export class OutOfStockError extends Error {
  constructor(short, items) {
    const nameOf = (id) => (items || []).find((i) => Number(i.id) === Number(id))?.name || `Item ${id}`;
    const lines = short.map((s) => ({ ...s, name: nameOf(s.id) }));
    const said = lines.map((s) => (s.left > 0 ? `only ${s.left} left of ${s.name}` : `${s.name} is out of stock`));
    const text = said.join("; ");
    super(text.charAt(0).toUpperCase() + text.slice(1));
    this.code = "OUT_OF_STOCK";
    this.short = lines;
  }
}
