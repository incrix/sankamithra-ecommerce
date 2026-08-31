import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * File-backed order store — the local-development fallback.
 *
 * Used when MONGODB_URI is unset. See ordersStore.js for the database-backed
 * implementation that production uses.
 *
 * Original notes:
 *
 * The shop has no database, and until now an order existed only as an email -
 * if the mail send failed the order was simply lost. Persisting here means the
 * admin panel is the source of truth and a mail outage costs nothing.
 *
 * Swap the read/write pair for a real database later; nothing else needs to
 * change.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "orders.json");

export const STATUSES = ["new", "packing", "packed", "dispatched", "cancelled"];

export const STATUS_LABEL = {
  new: "New",
  packing: "Packing",
  packed: "Packed",
  dispatched: "Dispatched",
  cancelled: "Cancelled",
};

/** Serialises writes so two requests can't clobber each other's changes. */
let queue = Promise.resolve();
const serialise = (fn) => {
  const run = queue.then(fn, fn);
  queue = run.then(() => {}, () => {});
  return run;
};

async function readAll() {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(orders) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // Write to a temp file then rename, so a crash mid-write cannot leave a
  // truncated orders.json behind.
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(orders, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

const unit = (i) => Math.round(i.price - (i.price * (i.discount || 0)) / 100);
const lineTotal = (i) =>
  Math.round((i.price - (i.price * (i.discount || 0)) / 100) * (i.count || 0));

const REF_PREFIX = "STW-";

/**
 * Sequential, human-speakable reference: STW-0001, STW-0002, ...
 *
 * Derived from the highest number already stored rather than a counter file,
 * so it cannot drift out of step with the orders themselves. Safe against
 * concurrent orders because every caller runs inside serialise() below.
 */
const nextRef = (orders) => {
  const highest = orders.reduce((max, o) => {
    const n = parseInt(String(o.ref || "").replace(REF_PREFIX, ""), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return REF_PREFIX + String(highest + 1).padStart(4, "0");
};


/**
 * What a line is actually worth once the packer has been through it.
 *
 * A substituted line is priced on the replacement; a line marked unavailable
 * with no replacement drops to zero. Everything downstream (order total, the
 * difference shown to the shop) reads from here.
 */
export const effectiveLineTotal = (item) => {
  if (item.substitute) {
    return Math.round((item.substitute.unitPrice || 0) * (item.substitute.count || 0));
  }
  if (item.unavailable) return 0;
  return item.total || 0;
};

/** Recomputes the order aggregates from its items. */
function recomputeTotals(order) {
  const items = order.items || [];
  return {
    ...order,
    total: items.reduce((a, i) => a + effectiveLineTotal(i), 0),
    itemCount: items.reduce(
      (a, i) => a + (i.substitute ? i.substitute.count : i.unavailable ? 0 : i.count),
      0
    ),
    // What the customer originally agreed to, kept so the shop can see the delta.
    originalTotal: order.originalTotal ?? items.reduce((a, i) => a + (i.total || 0), 0),
  };
}

export async function listOrders() {
  const orders = await readAll();
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getOrder(id) {
  return (await readAll()).find((o) => o.id === id) || null;
}

export async function createOrder({ billingDetails, productList, emailSent, source = "online", note = "" }) {
  return serialise(async () => {
    const orders = await readAll();

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
      packed: false,      // per-item packing checklist
      unavailable: false, // packer found the shelf empty
      substitute: null,   // { id, name, image, unitPrice, count }
    }));

    const order = {
      id: crypto.randomUUID(),
      ref: nextRef(orders),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "new",
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
      itemCount: items.reduce((a, i) => a + i.count, 0),
      total: items.reduce((a, i) => a + i.total, 0),
      mrp: items.reduce((a, i) => a + Math.round(i.mrp * i.count), 0),
      note: note || "",
      history: [{ at: new Date().toISOString(), event: source === "pos" ? "Billed at the counter" : "Order received" }],
    };

    orders.push(order);
    await writeAll(orders);
    return order;
  });
}

export async function updateOrder(id, patch) {
  return serialise(async () => {
    const orders = await readAll();
    const i = orders.findIndex((o) => o.id === id);
    if (i === -1) return null;

    const prev = orders[i];
    const next = { ...prev, updatedAt: new Date().toISOString() };

    if (patch.status && STATUSES.includes(patch.status) && patch.status !== prev.status) {
      next.status = patch.status;
      next.history = [
        ...(prev.history || []),
        { at: next.updatedAt, event: `Marked ${STATUS_LABEL[patch.status]}` },
      ];
      // Moving to Packed implies everything is in the box.
      if (patch.status === "packed") {
        // Lines with nothing to pack (out of stock, no replacement) stay unticked.
        next.items = prev.items.map((it) => ({
          ...it,
          packed: it.unavailable && !it.substitute ? false : true,
        }));
      }
    }

    if (typeof patch.note === "string") next.note = patch.note;
    if (typeof patch.emailSent === "boolean") next.emailSent = patch.emailSent;

    // Per-line packer actions. Auto-advance New -> Packing on the first one so
    // the owner never has to set the status by hand.
    if (patch.itemId !== undefined) {
      const events = [];

      next.items = (next.items || prev.items).map((it) => {
        if (it.id !== patch.itemId) return it;

        if (patch.packed !== undefined) {
          return { ...it, packed: Boolean(patch.packed) };
        }

        // Shelf is empty: park the line until it's substituted or dropped.
        if (patch.unavailable !== undefined) {
          const off = Boolean(patch.unavailable);
          events.push(
            off
              ? `${it.name} marked out of stock`
              : `${it.name} back in stock`
          );
          return off
            ? { ...it, unavailable: true, packed: false, substitute: null }
            : { ...it, unavailable: false, substitute: null };
        }

        // Replace with another product. Passing null clears the replacement.
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

        // Short-fill: the packer found fewer than ordered.
        if (patch.count !== undefined) {
          const n = Math.max(0, Number(patch.count) || 0);
          events.push(`${it.name} quantity changed ${it.count} -> ${n}`);
          return {
            ...it,
            count: n,
            total: Math.round(it.unitPrice * n),
            unavailable: n === 0,
          };
        }

        return it;
      });

      if (events.length) {
        next.history = [
          ...(next.history || []),
          ...events.map((event) => ({ at: next.updatedAt, event })),
        ];
      }

      if (next.status === "new" && next.items.some((it) => it.packed || it.unavailable)) {
        next.status = "packing";
        next.history = [
          ...(next.history || []),
          { at: next.updatedAt, event: "Packing started" },
        ];
      }
    }

    orders[i] = recomputeTotals(next);
    await writeAll(orders);
    return orders[i];
  });
}

export async function orderStats() {
  const orders = await readAll();
  const by = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  let revenue = 0;
  for (const o of orders) {
    by[o.status] = (by[o.status] || 0) + 1;
    if (o.status !== "cancelled") revenue += o.total || 0;
  }
  return { total: orders.length, by, revenue };
}
