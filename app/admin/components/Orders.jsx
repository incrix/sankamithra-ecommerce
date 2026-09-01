"use client";
import {
  Stack, Typography, Box, InputBase, Chip, Drawer, CircularProgress, IconButton, Button,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "../AdminContext";
import OrderRow from "./OrderRow";
import OrderDetail from "./OrderDetail";

const BATCH = 40;

/**
 * Groups orders under date headings — Today, Yesterday, then the date itself.
 *
 * A flat list of hundreds gives no sense of "what came in today"; segmenting by
 * day is how the shop actually thinks about the queue. Uses local calendar days,
 * not UTC, so an evening order doesn't jump to tomorrow.
 */
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

function segmentByDate(list) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const tKey = dayKey(today), yKey = dayKey(yesterday);

  const groups = new Map();
  for (const o of list) {
    const k = dayKey(o.createdAt);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(o);
  }

  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, orders]) => ({
      key,
      label: key === tKey ? "Today" : key === yKey ? "Yesterday"
        : new Date(orders[0].createdAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
      orders,
      total: orders.filter((o) => o.status !== "cancelled").reduce((a, o) => a + (o.total || 0), 0),
    }));
}

const SOURCES = [
  { key: "all", label: "All orders" },
  { key: "online", label: "Website" },
  { key: "pos", label: "Counter" },
];

const SORTS = {
  newest:  { label: "Newest first",   fn: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  // The packing queue is fair only if the longest wait is packed first.
  oldest:  { label: "Oldest first",   fn: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
  highest: { label: "Highest value",  fn: (a, b) => (b.total || 0) - (a.total || 0) },
  lowest:  { label: "Lowest value",   fn: (a, b) => (a.total || 0) - (b.total || 0) },
  name:    { label: "Customer A–Z",   fn: (a, b) => a.customer.name.localeCompare(b.customer.name) },
  units:   { label: "Most items",     fn: (a, b) => (b.itemCount || 0) - (a.itemCount || 0) },
};

const RANGES = {
  all:   { label: "All time", days: null },
  today: { label: "Today",    days: 0 },
  "7":   { label: "7 days",   days: 7 },
  "30":  { label: "30 days",  days: 30 },
};

const TABS = [
  { key: "active", label: "To do" }, // new + packing + packed: the work queue
  { key: "new", label: "New" },
  { key: "packing", label: "Packing" },
  { key: "packed", label: "Packed" },
  { key: "dispatched", label: "Dispatched" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];


/** The order queue: filter, sort, open one and work it. */
export default function Orders() {
  const { orders, loading, busy, patchOrder, notify } = useAdmin();

  // Honours /admin/orders?tab=packed, so a dashboard tile or a bookmark can
  // open the queue already filtered.
  const params = useSearchParams();
  const initialTab = TABS.some((t) => t.key === params.get("tab")) ? params.get("tab") : "active";
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const t = params.get("tab");
    if (t && TABS.some((x) => x.key === t)) setTab(t);
  }, [params]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [range, setRange] = useState("all");
  const [source, setSource] = useState("all");
  const [visible, setVisible] = useState(BATCH);
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let from = null;
    const days = RANGES[range]?.days;
    if (days !== null && days !== undefined) {
      from = new Date();
      from.setHours(0, 0, 0, 0);
      from.setDate(from.getDate() - days);
    }

    return orders
      .filter((o) => {
        const inTab =
          tab === "all" ? true
          : tab === "active" ? ["new", "packing", "packed"].includes(o.status)
          : o.status === tab;
        if (!inTab) return false;
        if (from && new Date(o.createdAt) < from) return false;
        // Orders predating the POS feature have no source; treat them as website.
        if (source !== "all" && (o.source || "online") !== source) return false;
        if (!q) return true;
        return (
          o.ref.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.phone.includes(q) ||
          o.customer.city.toLowerCase().includes(q)
        );
      })
      .sort(SORTS[sort]?.fn || SORTS.newest.fn);
  }, [orders, tab, query, sort, range, source]);

  const shown = useMemo(() => filtered.slice(0, visible), [filtered, visible]);

  // Date headings only make sense when the list is in date order; grouping a
  // value-sorted list by day would scatter the segments.
  const grouped = useMemo(
    () => (sort === "newest" || sort === "oldest" ? segmentByDate(shown) : null),
    [shown, sort]
  );

  useEffect(() => { setVisible(BATCH); }, [tab, query, sort, range, source]);

  const onListScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 400) {
      setVisible((v) => (v < filtered.length ? v + BATCH : v));
    }
  };

  const selected = orders.find((o) => o.id === selectedId) || null;
  const patch = (body) => patchOrder(selected.id, body);

  return (
    <>
      {/* Search + status tabs */}
      <Stack gap={1.25} flexShrink={0}>
        <Stack direction="row" alignItems="center" gap={1}
          sx={{ border: "1.5px solid #ececec", borderRadius: "10px", px: 1.5, py: 0.75, maxWidth: 420,
                "&:focus-within": { borderColor: "var(--primary-color)" } }}>
          <SearchRoundedIcon sx={{ color: "var(--text-color-trinary)", fontSize: 20 }} />
          <InputBase
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ref, name, phone, city..."
            sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}
          />
          {query && <CloseRoundedIcon onClick={() => setQuery("")} sx={{ fontSize: 18, cursor: "pointer", color: "var(--text-color-trinary)" }} />}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems={{ sm: "center" }} justifyContent="space-between">
          <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap">
            <Typography fontSize={11.5} fontWeight={800} color="var(--text-color-trinary)">PERIOD</Typography>
            {Object.entries(RANGES).map(([k, r]) => (
              <Chip key={k} label={r.label} size="small" onClick={() => setRange(k)}
                sx={{
                  fontWeight: 700, fontSize: 11.5, height: 24, border: "1px solid",
                  borderColor: range === k ? "var(--primary-color)" : "var(--border)",
                  backgroundColor: range === k ? "var(--primary-soft)" : "#fff",
                  color: range === k ? "var(--primary-color)" : "var(--text-color-secondary)",
                }} />
            ))}
          </Stack>

          <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap">
            <Typography fontSize={11.5} fontWeight={800} color="var(--text-color-trinary)">SOURCE</Typography>
            {SOURCES.map((sc) => (
              <Chip
                key={sc.key}
                data-source-filter={sc.key}
                label={sc.label}
                size="small"
                onClick={() => setSource(sc.key)}
                sx={{
                  fontWeight: 700, fontSize: 11.5, height: 24, border: "1px solid",
                  borderColor: source === sc.key ? "var(--primary-color)" : "var(--border)",
                  backgroundColor: source === sc.key ? "var(--primary-soft)" : "#fff",
                  color: source === sc.key ? "var(--primary-color)" : "var(--text-color-secondary)",
                }}
              />
            ))}
          </Stack>

          <Stack direction="row" gap={0.75} alignItems="center">
            <Typography fontSize={11.5} fontWeight={800} color="var(--text-color-trinary)">SORT</Typography>
            {/* A native select: one tap instead of two, and it gets the OS
                picker on a phone, which is where this gets used. */}
            <Box
              component="select"
              aria-label="sort orders"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              sx={{
                fontSize: 12.5, fontWeight: 700, fontFamily: "inherit",
                color: "var(--text-color)", backgroundColor: "var(--surface)",
                border: "1px solid var(--border)", borderRadius: "var(--radius-pill)",
                py: 0.6, pl: 1.5, pr: 3, cursor: "pointer", appearance: "none",
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237e7e7e' stroke-width='3'><path d='M6 9l6 6 6-6'/></svg>\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                "&:hover": { borderColor: "var(--primary-color)" },
              }}
            >
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </Box>
          </Stack>
        </Stack>

        <Stack direction="row" gap={0.75} sx={{ overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { display: "none" } }}>
          {TABS.map((t) => {
            const n = t.key === "all" ? orders.length
              : t.key === "active" ? orders.filter((o) => ["new", "packing", "packed"].includes(o.status)).length
              : orders.filter((o) => o.status === t.key).length;
            const on = tab === t.key;
            return (
              <Chip key={t.key} label={`${t.label} ${n}`} onClick={() => setTab(t.key)}
                sx={{ flexShrink: 0, fontWeight: 700, fontSize: 12, border: "1px solid",
                      borderColor: on ? "var(--primary-color)" : "#ececec",
                      backgroundColor: on ? "var(--primary-color)" : "#fff",
                      color: on ? "#fff" : "var(--text-color)",
                      "&:hover": { backgroundColor: on ? "var(--primary-color)" : "#fff1ea" } }} />
            );
          })}
        </Stack>
      </Stack>

      {/* List + detail */}
      <Stack direction="row" gap={2} sx={{ flex: { md: 1 }, minHeight: 0, alignItems: "stretch" }}>
        <Stack flex={1} gap={1} minWidth={0} sx={{ minHeight: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexShrink={0} px={0.5}>
          <Typography fontSize={11.5} fontWeight={700} color="var(--text-color-secondary)">
            {filtered.length === 0
              ? "No orders"
              : `${filtered.length} ${filtered.length === 1 ? "order" : "orders"}`}
          </Typography>
          <Typography fontSize={11.5} fontWeight={700} color="var(--text-color-trinary)">
            {SORTS[sort]?.label}
          </Typography>
        </Stack>

        <Stack
          gap={1}
          minWidth={0}
          onScroll={onListScroll}
          sx={{
            flex: 1,
            overflowY: { xs: "visible", md: "auto" },
            pr: { md: 0.5 },
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": { background: "#e6e6e6", borderRadius: 99 },
          }}
        >
          {loading ? (
            <Stack alignItems="center" py={6}><CircularProgress sx={{ color: "var(--primary-color)" }} /></Stack>
          ) : shown.length === 0 ? (
            <Stack alignItems="center" gap={1} py={6}>
              <Box sx={{ fontSize: 32 }}>📦</Box>
              <Typography fontWeight={800} color="var(--text-color)">
                {orders.length === 0 ? "No orders yet" : "Nothing here"}
              </Typography>
              <Typography fontSize={13} color="var(--text-color-secondary)" textAlign="center">
                {orders.length === 0
                  ? "Orders placed on the shop will appear here automatically."
                  : "Try another tab or clear the search."}
              </Typography>
            </Stack>
          ) : (
            <>
              {grouped ? (
                grouped.map((g) => (
                  <Stack key={g.key} gap={1}>
                    {/* Sticky, so the day stays visible while scrolling its orders */}
                    <Stack direction="row" alignItems="baseline" justifyContent="space-between"
                      sx={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "var(--surface)",
                            py: 0.75, borderBottom: "1px solid var(--border)" }}>
                      <Typography fontSize={12.5} fontWeight={800} color="var(--text-color)">{g.label}</Typography>
                      <Typography fontSize={11.5} fontWeight={700} color="var(--text-color-secondary)">
                        {g.orders.length} {g.orders.length === 1 ? "order" : "orders"} · ₹{g.total.toLocaleString("en-IN")}
                      </Typography>
                    </Stack>
                    {g.orders.map((o) => (
                      <OrderRow key={o.id} order={o} selected={o.id === selectedId} onClick={() => setSelectedId(o.id)} />
                    ))}
                  </Stack>
                ))
              ) : (
                shown.map((o) => (
                  <OrderRow key={o.id} order={o} selected={o.id === selectedId} onClick={() => setSelectedId(o.id)} />
                ))
              )}
              {visible < filtered.length && (
                <Button
                  onClick={() => setVisible((v) => v + BATCH)}
                  sx={{
                    textTransform: "none", fontWeight: 700, fontSize: 13, py: 1,
                    color: "var(--primary-color)",
                    "&:hover": { backgroundColor: "var(--primary-soft)" },
                  }}
                >
                  Show more ({filtered.length - visible} left)
                </Button>
              )}
            </>
          )}
        </Stack>
        </Stack>

        {/* Desktop: detail pinned beside the list.
            Must be a flex column with a bounded height: with only maxHeight
            and no flex context, OrderDetail's height:100% resolved against
            auto, its inner scroll area never constrained, and the action bar
            was pushed past the bottom of the viewport with no way to reach it. */}
        <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column",
                   width: 420, flexShrink: 0, height: "100%", minHeight: 0,
                   border: "1px solid #ededed", borderRadius: "16px", backgroundColor: "#fff",
                   overflow: "hidden" }}>
          {selected ? (
            <OrderDetail order={selected} busy={busy} onClose={() => setSelectedId(null)}
              onPatch={patch} onToast={notify} />
          ) : (
            <Stack alignItems="center" justifyContent="center" gap={1} sx={{ height: 320, px: 3 }}>
              <Box sx={{ fontSize: 30 }}>👈</Box>
              <Typography fontSize={13.5} fontWeight={800} color="var(--text-color)">Pick an order</Typography>
              <Typography fontSize={12.5} color="var(--text-color-secondary)" textAlign="center">
                Its packing list and customer details open here.
              </Typography>
            </Stack>
          )}
        </Box>
      </Stack>

      <Drawer
        anchor="bottom"
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        sx={{ display: { xs: "block", md: "none" } }}
        PaperProps={{ sx: { borderTopLeftRadius: 18, borderTopRightRadius: 18, height: "92vh" } }}
      >
        {selected && (
          <OrderDetail order={selected} busy={busy} onClose={() => setSelectedId(null)}
            onPatch={patch} onToast={notify} />
        )}
      </Drawer>

      {/* Errors carry a reason worth reading (mail server responses, for
          example), so they linger and stay dismissable; confirmations don't. */}
    </>
  );
}
