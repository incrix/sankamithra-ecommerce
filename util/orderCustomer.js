/**
 * Editing the customer block on an order that already exists.
 *
 * Details arrive misheard over the phone, mistyped at the counter, or changed
 * by the customer ringing back - a different delivery address, a second phone
 * number. All of it is what the invoice, the notification email and every
 * search in the admin panel go by, so all of it has to be fixable afterwards.
 *
 * Shared by both stores so the database and the local file store can never
 * drift on what an edit means. Every change is recorded in the order's history
 * with the old value beside the new one: a bill whose address quietly changed
 * is a parcel nobody can trace.
 */

/**
 * What may be edited, in the order the panel shows it, with its own cap.
 * `label` heads the field in the form; `noun` is how the history line says it.
 */
export const CUSTOMER_FIELDS = [
  { key: "name", label: "Name", noun: "name", max: 80, required: true },
  { key: "phone", label: "Phone", noun: "phone number", max: 20 },
  { key: "email", label: "Email", noun: "email", max: 120 },
  { key: "address", label: "Address", noun: "address", max: 200 },
  { key: "city", label: "City", noun: "city", max: 60 },
  { key: "state", label: "State", noun: "state", max: 60 },
  { key: "zip", label: "PIN code", noun: "PIN code", max: 10 },
];

/** Shown in the history instead of an empty gap, so the line still reads. */
const shown = (v) => (String(v || "").trim() ? String(v).trim() : "(blank)");

/**
 * Works out the new customer block and the history lines that go with it.
 *
 * Only fields actually present in the patch are touched, so the panel can send
 * one field or all seven. An empty value clears a field - except the name,
 * which the invoice cannot do without, so a blank one is ignored rather than
 * wiping what is there.
 *
 * Returns null when nothing would change, which keeps a no-op save from
 * writing a revision and adding a history line saying nothing happened.
 */
export function applyCustomerEdit(prev, edit) {
  if (!edit || typeof edit !== "object") return null;

  const customer = { ...(prev || {}) };
  const events = [];

  for (const { key, noun, max, required } of CUSTOMER_FIELDS) {
    if (typeof edit[key] !== "string") continue;
    const value = edit[key].trim().slice(0, max);
    const was = String(customer[key] || "");
    if (required && !value) continue;
    if (value === was) continue;
    customer[key] = value;
    events.push(`Customer ${noun} changed ${shown(was)} -> ${shown(value)}`);
  }

  return events.length ? { customer, events } : null;
}
