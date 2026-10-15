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
 * The neighbouring states where most of the shop's out-of-state customers
 * are. Close enough by road, and ordered from often enough, to warrant a
 * lower minimum than the rest of India.
 */
export const MIN_ORDER_NEARBY = 7000;
export const NEARBY_STATES = "Karnataka, Kerala, Andhra Pradesh and Puducherry";

const NEARBY = [
  "karnataka", "karnatak", "karnatakam", "ka",
  "kerala", "keralam", "kl",
  "andhrapradesh", "andrapradesh", "andhra", "andra", "ap",
  "puducherry", "pondicherry", "pondichery", "puduchery", "puducheri", "pondy", "py",
];

/** Whether a typed-in state is one of the nearby states. Same matching as isTamilNadu. */
export function isNearbyState(state) {
  return NEARBY.includes(String(state || "").toLowerCase().replace(/[^a-z]/g, ""));
}

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
export const minimumFor = (state) => {
  if (!String(state || "").trim() || isTamilNadu(state)) return MIN_ORDER_TN;
  return isNearbyState(state) ? MIN_ORDER_NEARBY : MIN_ORDER_OUTSIDE_TN;
};

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

/** "Minimum order for Karnataka is ₹7,000" - shown under the state field. */
export const minimumNote = (state) =>
  `Minimum order for ${String(state || "").trim()} is ${rupees(minimumFor(state))}`;

/** Why a total was refused, worded for the delivery state. Checkout and the order route share it. */
export const belowMinimumMessage = (state) => {
  const min = minimumFor(state);
  return min > MIN_ORDER_TN
    ? `Orders delivered to ${String(state).trim()} must be above ${rupees(min)}.`
    : `Order total must be above ${rupees(min)} to place an order.`;
};

/**
 * Whether a total clears the minimum for that state.
 *
 * "Above", not "at least": the shop has always asked for an order above the
 * minimum, and the cart and checkout already gate that way.
 */
export const meetsMinimumFor = (total, state) => Number(total) > minimumFor(state);

/**
 * Whether a typed-in state is Puducherry. Same matching as isTamilNadu.
 */
export function isPuducherry(state) {
  const s = String(state || "").toLowerCase().replace(/[^a-z]/g, "");
  return ["puducherry", "pondicherry", "pondichery", "puduchery", "puducheri", "pondy", "py"].includes(s);
}

/**
 * Whether the customer must call the shop before paying.
 *
 * Outside Tamil Nadu and Puducherry, transport is not always available and may
 * need to be paid for up front, so the shop confirms by phone first.
 */
export const needsCallBeforePayment = (state) =>
  Boolean(String(state || "").trim()) && !isTamilNadu(state) && !isPuducherry(state);

/**
 * The call-before-paying notice, shown at checkout and repeated in the order
 * email. Takes the phone number so this file stays free of imports.
 */
export const callBeforePaymentNotice = (state, phone) =>
  `As your order is for delivery to ${String(state || "").trim()} (outside Tamil Nadu & Puducherry), `
  + `please call Sankamithra Thunder World on ${phone} to confirm before making any payment. `
  + `Transport outside Tamil Nadu & Puducherry depends on availability and may require pre-payment. `
  + `Once we confirm by phone, complete the necessary steps to receive your crackers and enjoy this Diwali 2026!`;
