/**
 * Dashboard analytics, derived from the order list the panel already loads.
 *
 * Pure functions, no endpoint: the admin fetches orders once and everything
 * here is computed from that array, so a metric can never disagree with the
 * order it was derived from.
 */

/** Cancelled orders are excluded from every money figure. */
const isLive = (o) => o.status !== "cancelled";

/**
 * Local calendar day, not UTC.
 *
 * toISOString() shifts to UTC, so in IST (+5:30) an order placed in the evening
 * keys to the next day while the loop below keys from local midnight - the two
 * never met and every bucket read zero.
 */
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export function revenue(orders) {
  return orders.filter(isLive).reduce((a, o) => a + (o.total || 0), 0);
}

export function countsByStatus(orders) {
  const by = { new: 0, packing: 0, packed: 0, dispatched: 0, cancelled: 0 };
  orders.forEach((o) => { by[o.status] = (by[o.status] || 0) + 1; });
  return by;
}

/** Revenue and order count per day for the last `days` days, oldest first. */
export function dailySeries(orders, days = 14) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = new Map();
  orders.filter(isLive).forEach((o) => {
    const k = dayKey(o.createdAt);
    const b = buckets.get(k) || { revenue: 0, orders: 0 };
    b.revenue += o.total || 0;
    b.orders += 1;
    buckets.set(k, b);
  });

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    const b = buckets.get(k) || { revenue: 0, orders: 0 };
    out.push({ date: k, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), ...b });
  }
  return out;
}

/** Units actually going out of the door, replacements included. */
export function topProducts(orders, limit = 6) {
  const m = new Map();
  orders.filter(isLive).forEach((o) => {
    (o.items || []).forEach((i) => {
      const line = i.substitute
        ? { name: i.substitute.name, units: i.substitute.count, value: Math.round(i.substitute.unitPrice * i.substitute.count) }
        : i.unavailable
        ? null
        : { name: i.name, units: i.count, value: i.total || 0 };
      if (!line) return;
      const cur = m.get(line.name) || { name: line.name, units: 0, value: 0 };
      cur.units += line.units;
      cur.value += line.value;
      m.set(line.name, cur);
    });
  });
  return [...m.values()].sort((a, b) => b.units - a.units).slice(0, limit);
}

export function summary(orders) {
  const live = orders.filter(isLive);
  const rev = revenue(orders);
  const by = countsByStatus(orders);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);

  const todays = live.filter((o) => new Date(o.createdAt) >= today);
  const week = live.filter((o) => new Date(o.createdAt) >= weekAgo);

  return {
    revenue: rev,
    orders: orders.length,
    liveOrders: live.length,
    avgOrder: live.length ? Math.round(rev / live.length) : 0,
    toPack: (by.new || 0) + (by.packing || 0),
    readyToSend: by.packed || 0,
    dispatched: by.dispatched || 0,
    cancelled: by.cancelled || 0,
    todayCount: todays.length,
    todayRevenue: todays.reduce((a, o) => a + (o.total || 0), 0),
    weekCount: week.length,
    weekRevenue: week.reduce((a, o) => a + (o.total || 0), 0),
    units: live.reduce((a, o) => a + (o.itemCount || 0), 0),
    // Orders whose value moved because the packer substituted or dropped a line
    adjusted: live.filter((o) => o.originalTotal != null && o.originalTotal !== o.total).length,
    unnotified: orders.filter((o) => !o.emailSent && o.status !== "cancelled").length,
    by,
  };
}

/**
 * Sales split by where the money came from.
 *
 * "pos" is a bill written at the counter, "online" is an order the customer
 * placed on the website. They run the same pipeline afterwards, so nothing
 * else distinguishes them - but they are different businesses to the owner and
 * the one question the dashboard could not answer was which is which.
 *
 * Gross is what the goods list at (MRP); net is what was actually charged.
 * The gap between them is the discount given away, which on an 80%-off list is
 * the number that decides whether a season worked.
 */
export function channelBreakdown(orders) {
  const blank = () => ({ orders: 0, net: 0, gross: 0, units: 0, cancelled: 0, cancelledValue: 0 });
  const out = { pos: blank(), online: blank() };

  orders.forEach((o) => {
    const k = o.source === "pos" ? "pos" : "online";
    const b = out[k];
    if (o.status === "cancelled") {
      b.cancelled += 1;
      b.cancelledValue += o.total || 0;
      return;
    }
    b.orders += 1;
    b.net += o.total || 0;
    b.gross += o.mrp || 0;
    b.units += o.itemCount || 0;
  });

  for (const k of ["pos", "online"]) {
    const b = out[k];
    b.discount = Math.max(0, b.gross - b.net);
    b.avg = b.orders ? Math.round(b.net / b.orders) : 0;
  }

  const net = out.pos.net + out.online.net;
  out.total = {
    orders: out.pos.orders + out.online.orders,
    net,
    gross: out.pos.gross + out.online.gross,
    units: out.pos.units + out.online.units,
    discount: Math.max(0, out.pos.gross + out.online.gross - net),
    cancelled: out.pos.cancelled + out.online.cancelled,
    cancelledValue: out.pos.cancelledValue + out.online.cancelledValue,
    avg: out.pos.orders + out.online.orders ? Math.round(net / (out.pos.orders + out.online.orders)) : 0,
  };
  out.posShare = net ? Math.round((out.pos.net / net) * 100) : 0;
  return out;
}

/**
 * The same split over a window, so "this is what today took" can be read off
 * without mentally filtering the order list.
 */
export function channelsSince(orders, days) {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));
  return channelBreakdown(orders.filter((o) => new Date(o.createdAt) >= from));
}

/**
 * What substitutions cost. A packer replacing or dropping a line moves the
 * total away from what the customer first agreed to, and the shop should be
 * able to see the size of that in money, not just a count of orders.
 */
export function adjustmentImpact(orders) {
  const touched = orders.filter((o) => o.status !== "cancelled" && o.originalTotal != null && o.originalTotal !== o.total);
  const delta = touched.reduce((a, o) => a + (o.total - o.originalTotal), 0);
  return { count: touched.length, delta };
}
