/**
 * How a parcel left the shop: the transport it went with and its LR number.
 *
 * The customer's first question once an order is dispatched is "with whom, and
 * what do I quote to collect it". Recorded when the order is marked
 * dispatched, so the dispatch email can answer it instead of a phone call.
 */
export function normaliseDispatch(input) {
  const text = (v, max) => String(v ?? "").trim().slice(0, max);
  const d = { transport: text(input?.transport, 60), lr: text(input?.lr, 40), note: text(input?.note, 160) };
  return d.transport || d.lr || d.note ? d : null;
}

/** "Sent by KPN Parcel, LR 48213" for the history line. */
export const dispatchEvent = (d) =>
  [d.transport && `Sent by ${d.transport}`, d.lr && `LR ${d.lr}`].filter(Boolean).join(", ") || "Dispatch note added";
