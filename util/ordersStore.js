import crypto from "crypto";
import { collection, isDbConfigured } from "@/util/db/mongo";
import * as fileStore from "./ordersStore.file";

/**
 * Order storage.
 *
 * MongoDB when MONGODB_URI is set, otherwise the original JSON file store so
 * local development works without a cluster. The database exists because a
 * serverless host has a read-only, ephemeral filesystem - writing orders to
 * disk there fails outright.
 */

const useDb = () => isDbConfigured();
const orders = () => collection("orders");
const counters = () => collection("counters");

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
 * A findOneAndUpdate with $inc is atomic in MongoDB, so two customers checking
 * out at the same instant cannot be handed the same number - which scanning for
 * the highest existing ref would allow.
 */
async function nextRef() {
  const res = await (await counters()).findOneAndUpdate(
    { _id: "orderRef" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  const seq = res?.seq ?? res?.value?.seq ?? 1;
  return "STW-" + String(seq).padStart(4, "0");
}

/** Mongo's own _id never leaves the store. */
const strip = ({ _id, ...rest }) => rest;

export async function listOrders() {
  if (!useDb()) return fileStore.listOrders();
  const docs = await (await orders()).find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(strip);
}

export async function getOrder(id) {
  if (!useDb()) return fileStore.getOrder(id);
  const doc = await (await orders()).findOne({ id });
  return doc ? strip(doc) : null;
}

export async function createOrder({ billingDetails, productList, emailSent, source = "online", note = "" }) {
  if (!useDb()) return fileStore.createOrder({ billingDetails, productList, emailSent, source, note });

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
    history: [{ at: now, event: source === "pos" ? "Billed at the counter" : "Order received" }],
  });

  await (await orders()).insertOne({ ...order });
  return order;
}

export async function updateOrder(id, patch) {
  if (!useDb()) return fileStore.updateOrder(id, patch);

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
  await (await orders()).replaceOne({ id }, { ...saved });
  return saved;
}

export async function orderStats() {
  if (!useDb()) return fileStore.orderStats();

  const all = await (await orders()).find({}, { projection: { status: 1, total: 1 } }).toArray();
  const by = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  let revenue = 0;
  for (const o of all) {
    by[o.status] = (by[o.status] || 0) + 1;
    if (o.status !== "cancelled") revenue += o.total || 0;
  }
  return { total: all.length, by, revenue };
}
