import { paise } from "@/util/pricing";

/**
 * What has actually been collected against an order.
 *
 * Money arrives before the parcel leaves and rarely in one piece: an advance on
 * GPay to confirm the booking, the rest deposited into the account the morning
 * the lorry goes. The shop needs to know, while the order is still being
 * packed, how much of it is in hand - so payments are recorded against the
 * order as they come in, and what is left to collect is worked out from them.
 *
 * Receipts are never edited in place. A wrong one is removed and entered
 * again, so the history always reads as a sequence of real events rather than
 * a figure that silently changed.
 */

/** How the money came in. `key` is stored; the labels are what staff read. */
export const PAYMENT_METHODS = [
  { key: "gpay", label: "GPay / UPI", short: "GPay" },
  { key: "bank", label: "Bank deposit", short: "Bank" },
  { key: "cash", label: "Cash", short: "Cash" },
  { key: "other", label: "Other", short: "Other" },
];

export const methodLabel = (key) =>
  PAYMENT_METHODS.find((m) => m.key === key)?.label || "Other";

/** A single receipt, however many rupees it was worth. */
const MAX_PAYMENT = 10000000;

export const paymentsOf = (order) => (Array.isArray(order?.payments) ? order.payments : []);

/** Everything collected so far, rounded the way every other figure here is. */
export const paidAmount = (order) =>
  paise(paymentsOf(order).reduce((a, p) => a + (Number(p.amount) || 0), 0));

/**
 * What the order owes, as the panel and the list both read it.
 *
 * `state` drives the colour and the wording in one place, so a row in the list
 * can never disagree with the open order about whether a bill is settled.
 * Cancelled orders are not "owed" - nothing is going to be collected on them.
 */
export function paymentState(order) {
  const total = paise(Number(order?.total) || 0);
  const paid = paidAmount(order);
  const balance = paise(total - paid);
  const count = paymentsOf(order).length;

  if (order?.status === "cancelled") {
    return { total, paid, balance, count, state: "cancelled", label: paid > 0 ? "Refund due" : "Cancelled" };
  }
  if (paid <= 0) return { total, paid, balance, count, state: "unpaid", label: "Unpaid" };
  if (balance > 0) return { total, paid, balance, count, state: "part", label: "Part paid" };
  if (balance < 0) return { total, paid, balance, count, state: "over", label: "Overpaid" };
  return { total, paid, balance, count, state: "paid", label: "Paid" };
}

/** Short enough for a list row: "Unpaid", "₹1,200 due", "Paid". */
export function paymentChip(order) {
  const s = paymentState(order);
  if (s.state === "part") return { ...s, text: `${fmt(s.balance)} due` };
  if (s.state === "over") return { ...s, text: `${fmt(-s.balance)} extra` };
  return { ...s, text: s.label };
}

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const newId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * Records a receipt against the order.
 *
 * Returns null for anything that is not a real payment - a blank box, a zero,
 * a stray minus - rather than writing a row that would quietly skew what the
 * order is owed. The history line carries the balance as it stood after the
 * receipt, because that is the number the shop argues about later.
 */
export function applyPayment(order, entry) {
  const amount = paise(Number(entry?.amount));
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_PAYMENT) return null;

  const method = PAYMENT_METHODS.some((m) => m.key === entry?.method) ? entry.method : "other";
  const note = String(entry?.note || "").trim().slice(0, 80);

  const payment = {
    id: newId(),
    at: new Date().toISOString(),
    amount,
    method,
    ...(note ? { note } : {}),
  };

  const payments = [...paymentsOf(order), payment];
  const balance = paise(paise(Number(order?.total) || 0) - paise(payments.reduce((a, p) => a + p.amount, 0)));
  const event = `Payment ${fmt(amount)} by ${methodLabel(method)}${note ? ` (${note})` : ""} — `
    + (balance > 0 ? `${fmt(balance)} still due` : balance < 0 ? `${fmt(-balance)} overpaid` : "bill settled");

  return { payments, payment, event };
}

/** Takes a receipt back off the order - a mistyped figure, a bounced transfer. */
export function removePayment(order, id) {
  const payments = paymentsOf(order);
  const gone = payments.find((p) => p.id === id);
  if (!gone) return null;

  const left = payments.filter((p) => p.id !== id);
  const balance = paise(paise(Number(order?.total) || 0) - paise(left.reduce((a, p) => a + p.amount, 0)));
  const event = `Payment ${fmt(gone.amount)} by ${methodLabel(gone.method)} removed — `
    + (balance > 0 ? `${fmt(balance)} due` : "bill settled");

  return { payments: left, event };
}
