/**
 * The online order minimum, which depends on where the parcel goes.
 *
 * Inside Tamil Nadu a parcel goes by local transport from Sivakasi; outside
 * it crosses state lines, and the licensed transport and paperwork that takes
 * only make sense on a larger order. So the minimum is higher for those.
 *
 * Kept free of imports: checkout reads it in the browser and the order route
 * enforces it on the server, and the two must agree exactly.
 */

export const MIN_ORDER_TN = 3000;
export const MIN_ORDER_OUTSIDE_TN = 10000;

/**
 * Whether a typed-in state is Tamil Nadu.
 *
 * The state is a free-text field, and customers write it every way there is:
 * "Tamil Nadu", "Tamilnadu", "TAMIL NADU", "TN", "T.N.", "Tamizh Nadu". Only
 * letters are compared, so spacing, case and dots do not matter.
 */
export function isTamilNadu(state) {
  const s = String(state || "").toLowerCase().replace(/[^a-z]/g, "");
  return ["tamilnadu", "tamilnad", "tamizhnadu", "tamilnaadu", "tn"].includes(s);
}

/** The minimum for a delivery state. A blank state gets the Tamil Nadu figure until it is filled in. */
export const minimumFor = (state) =>
  !String(state || "").trim() || isTamilNadu(state) ? MIN_ORDER_TN : MIN_ORDER_OUTSIDE_TN;

/**
 * Whether a total clears the minimum for that state.
 *
 * "Above", not "at least": the shop has always asked for an order above the
 * minimum, and the cart and checkout already gate that way.
 */
export const meetsMinimumFor = (total, state) => Number(total) > minimumFor(state);
