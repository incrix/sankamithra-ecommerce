/**
 * Who on the team is dealing with an order, and who confirmed it with the customer.
 *
 * Several people work the same queue on their own phones, and without this two
 * of them ring the same customer to confirm the same order. Taking an order is
 * first-come: once someone has it, anyone else is refused until they release it
 * or deliberately take it over - and because the store applies this inside its
 * revision-guarded write, two people tapping at once cannot both win.
 *
 * Everyone signs in with the one shop password, so the name comes from the
 * device (remembered in the browser), not from the session.
 */

const cleanName = (v) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
const same = (a, b) => cleanName(a).toLowerCase() === cleanName(b).toLowerCase();

/** Raised when someone else already has the order. The route answers 409. */
export class OrderTakenError extends Error {
  constructor(by) {
    super(`${by.name} is already handling this order`);
    this.code = "TAKEN";
    this.by = by;
  }
}

/**
 * Applies `{ action, name }` to an order.
 *
 * - take:    claim it. Refused if someone else has it, unless `takeOver` is set.
 * - release: give it back to the queue (only its holder, or with `takeOver`).
 * - confirm: the customer has confirmed. Also takes the order if nobody had it.
 * - unconfirm: undo a confirmation tapped by mistake.
 *
 * Returns the fields to write and the history line, or null if nothing changed.
 */
export function applyHandler(order, input) {
  const name = cleanName(input?.name);
  const action = input?.action;
  const at = new Date().toISOString();
  const holder = order?.handledBy || null;
  const mine = holder && same(holder.name, name);

  if (action === "take" || action === "confirm") {
    if (!name) return null;
    if (holder && !mine && !input?.takeOver) throw new OrderTakenError(holder);
  }

  if (action === "take") {
    if (mine) return null;
    return {
      handledBy: { name, at },
      event: holder ? `${name} took over from ${holder.name}` : `Taken by ${name}`,
    };
  }

  if (action === "release") {
    if (!holder) return null;
    if (!mine && !input?.takeOver) throw new OrderTakenError(holder);
    return { handledBy: null, confirmedBy: null, event: `Released by ${holder.name}` };
  }

  if (action === "confirm") {
    if (order?.confirmedBy) return null;
    return {
      handledBy: mine ? holder : { name, at },
      confirmedBy: { name, at },
      event: `Confirmed with the customer by ${name}`,
    };
  }

  if (action === "unconfirm") {
    if (!order?.confirmedBy) return null;
    return { confirmedBy: null, event: `Confirmation by ${order.confirmedBy.name} undone${name ? ` by ${name}` : ""}` };
  }

  return null;
}
