import crypto from "crypto";
import { TABLE, getItem, putItem, putIfAbsent, putIfRev, scanAll, bumpCounter, isDbConfigured } from "@/util/db/dynamo";
import * as fileStore from "./ordersStore.file";
import { getCatalogue } from "@/util/productsStore";
import { basisMrp, effDiscount, unitOf } from "@/util/pricing";

/**
 * Order storage.
 *
 * DynamoDB when AWS credentials are set, otherwise the original JSON file store so
 * local development works without a cluster. The database exists because a
 * serverless host has a read-only, ephemeral filesystem - writing orders to
 * disk there fails outright.
 */

const useDb = () => isDbConfigured();
/**
 * Duplicate-guard rows share the orders table under a reserved id.
 *
 * DynamoDB has no unique secondary index, so the till's clientRef cannot simply
 * be declared unique. Instead the first writer claims `claim#<clientRef>` with
 * a conditional write, which the service evaluates atomically - a second device
 * racing on the same bill loses the claim rather than writing a second order.
 * They expire, because they only matter for as long as a till might retry.
 */
const claimId = (key) => `claim#${key}`;
const isClaim = (row) => String(row?.id || "").startsWith("claim#");
const CLAIM_TTL_DAYS = 7;

/** Every real order. Claim rows are an implementation detail and never leak. */
async function allOrders() {
  return (await scanAll(TABLE.orders)).filter((o) => !isClaim(o));
}

export const STATUSES = ["new", "packing", "packed", "dispatched", "cancelled"];

export const STATUS_LABEL = {
  new: "New", packing: "Packing", packed: "Packed",
  dispatched: "Dispatched", cancelled: "Cancelled",
};

const unit = (i) => Math.round(i.price - (i.price * (i.discount || 0)) / 100);
const lineTotal = (i) =>
  Math.round((i.price - (i.price * (i.discount || 0)) / 100) * (i.count || 0));

/**
 * What a line is actually worth once the packer has been through it: a
 * substituted line is priced on the replacement, an unfillable one drops to zero.
 */
export const effectiveLineTotal = (item) => {
  if (item.substitute) {
    return Math.round((item.substitute.unitPrice || 0) * (item.substitute.count || 0));
  }
  if (item.unavailable) return 0;
  return item.total || 0;
};

function recomputeTotals(order) {
  const items = order.items || [];
  return {
    ...order,
    total: items.reduce((a, i) => a + effectiveLineTotal(i), 0),
    itemCount: items.reduce(
      (a, i) => a + (i.substitute ? i.substitute.count : i.unavailable ? 0 : i.count),
      0
    ),
    originalTotal: order.originalTotal ?? items.reduce((a, i) => a + (i.total || 0), 0),
  };
}

/**
 * Next sequential reference: STW-0001, STW-0002, ...
 *
 * ADD is applied by DynamoDB itself and returns the value it settled on, so two
 * customers checking out at the same instant cannot be handed the same number -
 * which scanning for the highest existing ref would allow.
 */
async function nextRef() {
  const seq = await bumpCounter("orderRef", 1);
  return "STW-" + String(seq).padStart(4, "0");
}

/** Mongo's own _id never leaves the store. */
const strip = ({ _id, ...rest }) => rest;

export async function listOrders() {
  if (!useDb()) return fileStore.listOrders();
  // Sorted here: a Scan comes back in no particular order.
  const docs = (await allOrders()).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return docs.map(strip);
}

export async function getOrder(id) {
  if (!useDb()) return fileStore.getOrder(id);
  const doc = await getItem(TABLE.orders, id);
  return doc ? strip(doc) : null;
}

/**
 * Creates an order.
 *
 * `clientRef` makes this safe to retry. Several people bill on their own
 * devices at the same counter, and a slow response invites a second tap - so
 * the same key is only ever written once, and a repeat returns the order that
 * already exists rather than a second bill with a second reference number.
 */
export async function createOrder({ billingDetails, productList, emailSent, source = "online", note = "", clientRef = "", priceList = 1, extraDiscount = 0 }) {
  if (!useDb()) return fileStore.createOrder({ billingDetails, productList, emailSent, source, note, priceList, extraDiscount });

  const key = String(clientRef || "").slice(0, 80);
  if (key) {
    const claimed = await getItem(TABLE.orders, claimId(key));
    if (claimed?.orderId) {
      const existing = await getItem(TABLE.orders, claimed.orderId);
      if (existing) return { ...strip(existing), duplicate: true };
    }
  }

  const items = (productList || []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    image: p.image?.[0] || null,
    unitPrice: unit(p),
    mrp: p.price,
    discount: p.discount || 0,
    count: p.count || 0,
    total: lineTotal(p),
    packed: false,
    unavailable: false,
    substitute: null,
  }));

  const now = new Date().toISOString();
  const order = recomputeTotals({
    id: crypto.randomUUID(),
    ref: await nextRef(),
    createdAt: now,
    updatedAt: now,
    status: "new",
    // "online" = built by the customer at checkout, "pos" = billed at the
    // counter by staff. Both run the same packing and dispatch pipeline.
    source: source === "pos" ? "pos" : "online",
    // Which price list this bill was written on, so a line added to it later is
    // priced the same way the rest of it was. See util/pricing.js.
    priceList: priceList === 2 ? 2 : 1,
    extraDiscount: Math.min(95, Math.max(0, Number(extraDiscount) || 0)),
    emailSent: Boolean(emailSent),
    customer: {
      name: billingDetails?.name || "",
      email: billingDetails?.email || "",
      phone: billingDetails?.phone || "",
      address: billingDetails?.address || "",
      city: billingDetails?.city || "",
      state: billingDetails?.state || "",
      zip: billingDetails?.zip || "",
    },
    items,
    mrp: items.reduce((a, i) => a + Math.round(i.mrp * i.count), 0),
    note: note || "",
    ...(key ? { clientRef: key } : {}),
    history: [{ at: now, event: source === "pos" ? "Billed at the counter" : "Order received" }],
  });

  // Claim the bill BEFORE writing it. Losing the claim means another device
  // already wrote this same bill, so hand back theirs rather than surfacing an
  // error to the biller - or writing a second order with a second reference.
  if (key) {
    const won = await putIfAbsent(TABLE.orders, {
      id: claimId(key),
      orderId: order.id,
      createdAt: now,
      expiresAt: Math.floor(Date.now() / 1000) + CLAIM_TTL_DAYS * 86400,
    });
    if (!won) {
      const claimed = await getItem(TABLE.orders, claimId(key));
      const winner = claimed?.orderId ? await getItem(TABLE.orders, claimed.orderId) : null;
      if (winner) return { ...strip(winner), duplicate: true };
      // The claim exists but its order does not - the winner died between the
      // two writes. Take it over rather than leaving the till unable to bill.
    }
  }

  await putItem(TABLE.orders, { ...order });
  return order;
}

/**
 * Applies a patch to an order.
 *
 * Read-modify-write, guarded by a revision number. A packer ticking several
 * lines in quick succession fires overlapping requests; each used to read the
 * same document and then replaceOne() the whole thing, so the last write won
 * and the other ticks were silently lost. The write now only lands if the
 * document still carries the revision we read, and a losing writer re-reads
 * and reapplies its own change rather than clobbering someone else's.
 */
export async function updateOrder(id, patch) {
  if (!useDb()) return fileStore.updateOrder(id, patch);

  for (let attempt = 0; attempt < 6; attempt++) {
    const saved = await applyOnce(id, patch);
    if (saved !== CONFLICT) return saved;
    // Someone else wrote between our read and our write; back off a moment and
    // build the change again on top of theirs.
    await new Promise((r) => setTimeout(r, 25 * (attempt + 1)));
  }
  throw new Error("That order is being changed elsewhere - try again");
}

const CONFLICT = Symbol("conflict");

async function applyOnce(id, patch) {
  const prev = await getOrder(id);
  if (!prev) return null;

  const next = { ...prev, updatedAt: new Date().toISOString() };

  if (patch.status && STATUSES.includes(patch.status) && patch.status !== prev.status) {
    next.status = patch.status;
    next.history = [...(prev.history || []), { at: next.updatedAt, event: `Marked ${STATUS_LABEL[patch.status]}` }];
    if (patch.status === "packed") {
      // Lines with nothing to pack stay unticked.
      next.items = prev.items.map((it) => ({ ...it, packed: it.unavailable && !it.substitute ? false : true }));
    }
  }

  if (typeof patch.note === "string") next.note = patch.note;
  if (typeof patch.emailSent === "boolean") next.emailSent = patch.emailSent;

  /**
   * Adding and removing whole lines, which the packing patches above cannot do.
   *
   * A different intent from marking something unavailable: that records what
   * the shop could not fill, this is the shop correcting the bill itself -
   * a customer ringing back to add two more boxes, or a line keyed twice.
   * Both are recorded in the history so the change is never silent.
   */
  /**
   * Moves the whole bill onto a different price list.
   *
   * Distinct from adding a line on a different list: this restates what the
   * customer is being charged for everything already on the order, so it is
   * only ever reached through an explicit confirmation in the admin. Lines are
   * repriced from the catalogue rather than scaled from their stored figures -
   * scaling would compound the rounding already baked into them.
   *
   * A line whose product has since left the catalogue is left exactly as it is
   * and reported, rather than being guessed at or silently dropped.
   */
  if (patch.reprice) {
    const list2 = Number(patch.reprice.priceList) === 2;
    const extra = Math.min(95, Math.max(0, Number(patch.reprice.extraDiscount) || 0));
    const { products: catalogue } = await getCatalogue();
    const byId = new Map(catalogue.map((p) => [Number(p.id), p]));

    const missing = [];
    next.items = (next.items || prev.items || []).map((line) => {
      const product = byId.get(Number(line.id));
      if (!product) { missing.push(line.name); return line; }
      const mrp = basisMrp(product, list2);
      const discount = effDiscount(product, list2, extra);
      const unitPrice = Math.round(mrp - (mrp * discount) / 100);
      return { ...line, mrp, discount, unitPrice, total: Math.round(unitPrice * (line.count || 0)) };
    });

    next.priceList = list2 ? 2 : 1;
    next.extraDiscount = extra;
    next.history = [...(next.history || []), {
      at: next.updatedAt,
      event: `Repriced on Pricelist ${list2 ? 2 : 1}${extra > 0 ? ` with ${extra}% ExtraDiscount` : ""}`
        + (missing.length ? ` (left unchanged: ${missing.join(", ")})` : ""),
    }];
  }

  if (patch.addItem) {
    const a = patch.addItem;
    const id = Number(a.id);
    const count = Math.max(1, Math.round(Number(a.count) || 1));
    const mrp = Math.max(0, Number(a.price) || 0);
    const discount = Math.min(95, Math.max(0, Number(a.discount) || 0));
    const unitPrice = Math.round(mrp - (mrp * discount) / 100);

    const items = [...(next.items || prev.items)];
    const at = items.findIndex((i) => i.id === id);

    if (at >= 0) {
      // Already on the bill: top it up rather than repeat the line.
      const was = items[at].count;
      const now = was + count;
      items[at] = { ...items[at], count: now, total: Math.round(items[at].unitPrice * now), unavailable: false };
      next.history = [...(next.history || []),
        { at: next.updatedAt, event: `${items[at].name} quantity ${was} -> ${now}` }];
    } else {
      items.push({
        id,
        name: String(a.name || "").trim(),
        category: a.category || "",
        image: a.image || null,
        unitPrice,
        mrp,
        discount,
        count,
        total: Math.round(unitPrice * count),
        packed: false,
        unavailable: false,
        substitute: null,
      });
      next.history = [...(next.history || []),
        { at: next.updatedAt, event: `Added ${a.name} x${count}` }];
    }
    next.items = items;
  }

  if (patch.removeItem !== undefined) {
    const id = Number(patch.removeItem);
    const gone = (next.items || prev.items).find((i) => i.id === id);
    next.items = (next.items || prev.items).filter((i) => i.id !== id);
    if (gone) {
      next.history = [...(next.history || []),
        { at: next.updatedAt, event: `Removed ${gone.name}` }];
    }
  }

  if (patch.itemId !== undefined) {
    const events = [];
    next.items = (next.items || prev.items).map((it) => {
      if (it.id !== patch.itemId) return it;

      if (patch.packed !== undefined) return { ...it, packed: Boolean(patch.packed) };

      if (patch.unavailable !== undefined) {
        const off = Boolean(patch.unavailable);
        events.push(off ? `${it.name} marked out of stock` : `${it.name} back in stock`);
        return off
          ? { ...it, unavailable: true, packed: false, substitute: null }
          : { ...it, unavailable: false, substitute: null };
      }

      if (patch.substitute !== undefined) {
        if (!patch.substitute) {
          events.push(`Replacement for ${it.name} removed`);
          return { ...it, substitute: null, packed: false };
        }
        const sub = {
          id: patch.substitute.id,
          name: patch.substitute.name,
          image: patch.substitute.image || null,
          unitPrice: Number(patch.substitute.unitPrice) || 0,
          mrp: Number(patch.substitute.mrp) || 0,
          count: Math.max(1, Number(patch.substitute.count) || 1),
        };
        events.push(`${it.name} replaced with ${sub.name} x${sub.count}`);
        return { ...it, unavailable: true, substitute: sub, packed: false };
      }

      if (patch.count !== undefined) {
        const n = Math.max(0, Number(patch.count) || 0);
        events.push(`${it.name} quantity changed ${it.count} -> ${n}`);
        return { ...it, count: n, total: Math.round(it.unitPrice * n), unavailable: n === 0 };
      }

      return it;
    });

    if (events.length) {
      next.history = [...(next.history || []), ...events.map((event) => ({ at: next.updatedAt, event }))];
    }
    if (next.status === "new" && next.items.some((it) => it.packed || it.unavailable)) {
      next.status = "packing";
      next.history = [...(next.history || []), { at: next.updatedAt, event: "Packing started" }];
    }
  }

  const saved = recomputeTotals(next);
  saved.rev = Number(prev.rev || 0) + 1;

  // Orders written before revisions existed have no rev field, which matches
  // null in a query - so those are accepted on their first guarded write.
  const won = await putIfRev(TABLE.orders, { ...saved }, prev.rev == null ? null : prev.rev);
  return won ? saved : CONFLICT;
}

export async function orderStats() {
  if (!useDb()) return fileStore.orderStats();

  // No projection: DynamoDB charges for the item it reads, not the fields
  // returned, so asking for two attributes would cost exactly the same.
  const all = await allOrders();
  const by = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  let revenue = 0;
  for (const o of all) {
    by[o.status] = (by[o.status] || 0) + 1;
    if (o.status !== "cancelled") revenue += o.total || 0;
  }
  return { total: all.length, by, revenue };
}
