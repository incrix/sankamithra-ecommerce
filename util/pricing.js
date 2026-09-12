/**
 * Counter pricing, shared.
 *
 * Pricelist 1 is the website list: an MRP with the product's own discount.
 * Pricelist 2 is a separate, lower set of MRPs carrying no product discount -
 * the biller gives away margin themselves through ExtraDiscount instead.
 *
 * Both lists resolve to a single effective discount off a single MRP, because
 * that is the only shape an order is stored in.
 *
 * These lived inside Pos.jsx, private to the counter screen. Every other place
 * that had to price a product against an existing bill - adding a line to an
 * order, choosing a replacement - reached for `unitPrice()` from util/cart
 * instead, which only ever knows Pricelist 1. A bill written on Pricelist 2
 * with an ExtraDiscount therefore gained lines at the full website rate.
 * One definition, so those callers cannot drift again.
 */

/** Which MRP the bill is written against. */
export const basisMrp = (p, list2) => (list2 ? (p?.mrp2 ?? p?.price) : p?.price);

/**
 * Product discount and ExtraDiscount as one percentage.
 *
 * Compounded, not added: ExtraDiscount comes off what is already discounted.
 * Pricelist 2 carries no product discount, so only the extra applies.
 */
export const effDiscount = (p, list2, extra) => {
  const base = list2 ? 0 : Number(p?.discount) || 0;
  const e = Math.min(95, Math.max(0, Number(extra) || 0));
  return Math.round((1 - (1 - base / 100) * (1 - e / 100)) * 10000) / 100;
};

/** Unit price on the given list, rounded the same way the server rounds it. */
export const unitOf = (p, list2, extra) => {
  const m = basisMrp(p, list2);
  return Math.round(m - (m * effDiscount(p, list2, extra)) / 100);
};

/**
 * The pricing basis an order was billed on.
 *
 * Orders written before the basis was recorded have neither field. They are
 * reported as `recorded: false` rather than silently defaulted to Pricelist 1,
 * because guessing is what caused the mispricing in the first place - the
 * admin is asked which list applies instead.
 */
export function orderBasis(order) {
  const recorded = order?.priceList === 1 || order?.priceList === 2;
  return {
    recorded,
    list2: order?.priceList === 2,
    extra: Number(order?.extraDiscount) || 0,
  };
}

/** How the basis reads on screen: "Pricelist 2 · 10% extra". */
export function basisLabel({ recorded, inferred, list2, extra }) {
  if (!recorded && !inferred) return "Pricelist not recorded";
  return `${inferred ? "Looks like " : ""}Pricelist ${list2 ? 2 : 1}${extra > 0 ? ` · ${extra}% extra` : ""}`;
}

/** The extra discount implied by a line, given the list it was billed on. */
function impliedExtra(line, product, list2) {
  const eff = Number(line.discount) || 0;
  const base = list2 ? 0 : Number(product.discount) || 0;
  if (base >= 100) return 0;
  // eff = 1 - (1 - base)(1 - e)  ->  e = 1 - (1 - eff)/(1 - base)
  const e = (1 - (1 - eff / 100) / (1 - base / 100)) * 100;
  return Math.round(Math.min(95, Math.max(0, e)) * 100) / 100;
}

/**
 * Best guess at the list an old bill was written on.
 *
 * Bills written before the basis was recorded still carry, on every line, the
 * MRP they were charged at. Comparing that against the product's two MRPs
 * usually identifies the list outright: a line at 600 against a product priced
 * 1000 with an mrp2 of 600 can only have come off Pricelist 2.
 *
 * Every line votes and the majority wins, so one product repriced since the
 * bill cannot flip the answer on its own. Lines where both lists give the same
 * MRP abstain rather than vote - they are genuinely uninformative, not evidence
 * for Pricelist 1.
 *
 * This is a guess and is labelled as one. It is wrong if prices moved after the
 * bill was written, which is exactly why the biller can override it.
 */
export function inferBasis(order, products) {
  const items = order?.items || [];
  if (!items.length || !products?.length) return null;

  const byId = new Map(products.map((p) => [p.id, p]));
  let one = 0, two = 0;
  const extras = [];

  for (const line of items) {
    const p = byId.get(line.id);
    if (!p) continue;
    const hasTwo = p.mrp2 != null;
    const fitsOne = Number(line.mrp) === Number(p.price);
    const fitsTwo = hasTwo && Number(line.mrp) === Number(p.mrp2);

    // Both fit: the two lists price this product identically, so it says
    // nothing about which one was used.
    if (fitsOne && fitsTwo) continue;
    if (fitsTwo) { two++; extras.push(impliedExtra(line, p, true)); }
    else if (fitsOne) { one++; extras.push(impliedExtra(line, p, false)); }
  }

  if (!one && !two) return null;
  const list2 = two > one;

  // The commonest implied extra, not the mean: one repriced product should not
  // drag the figure to something that was never actually keyed in.
  const counts = new Map();
  for (const e of extras) counts.set(e, (counts.get(e) || 0) + 1);
  const extra = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

  return {
    recorded: false,
    inferred: true,
    list2,
    extra,
    // How much of the bill actually agreed, so the UI can stay quiet when the
    // evidence is thin.
    confidence: (list2 ? two : one) / (one + two),
  };
}
