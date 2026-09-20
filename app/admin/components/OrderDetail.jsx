"use client";
import { Stack, Typography, Box, Button, Divider, Chip, IconButton, Tooltip } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CustomerBlock from "./CustomerBlock";
import PackingList from "./PackingList";
import SubstitutePicker from "./SubstitutePicker";
import AddItemPicker from "./AddItemPicker";
import BillingBasis from "./BillingBasis";
import { basisMrp, effDiscount, orderBasis, inferBasis } from "@/util/pricing";
import OrderActions from "./OrderActions";
import StatusChip from "./StatusChip";
import { useAdmin } from "../AdminContext";
import { useState, useEffect, useMemo } from "react";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const digits = (s) => String(s || "").replace(/\D/g, "");

/** The next single action for each state - one obvious button, no menus. */
const NEXT = {
  new: { to: "packing", label: "Start packing" },
  packing: { to: "packed", label: "Mark packed" },
  packed: { to: "dispatched", label: "Mark dispatched" },
};

export default function OrderDetail({ order, onClose, onPatch, busy, onToast }) {
  // Hooks must run before any early return, or the hook order changes between
  // renders as soon as `order` goes null.
  const [swapFor, setSwapFor] = useState(null);
  // Editing the bill is a separate mode from packing it. The two want opposite
  // things from the same rows - one ticks what went in the box, the other
  // changes what the customer is being charged for - so they never show at once.
  const [editing, setEditing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  /**
   * Which price list this bill was written on.
   *
   * Recorded on the order since counter billing started storing it. Orders
   * written before that carry neither field and cannot be reverse-engineered -
   * the stored lines are already flattened to one MRP and one effective
   * discount - so the biller picks the list, and `assumed` holds that choice
   * for as long as the panel is open.
   */
  /**
   * `primary` is how the bill was written; `chosen` is what the next line added
   * will be charged at. They start equal and the biller may separate them, so
   * they are held apart rather than one being derived from the other.
   */
  const [chosenList, setChosenList] = useState(null);
  const [chosenExtra, setChosenExtra] = useState(null);

  /**
   * Pricing against mrp2 needs the admin catalogue - /api/products?all=1. The
   * orders screen has no reason to hold it otherwise, so it is fetched the
   * first time editing starts or a picker opens, whichever comes first.
   */
  const { catalogue, catLoading, loadCatalogue } = useAdmin();
  useEffect(() => {
    if ((editing || addOpen || swapFor) && !catalogue) loadCatalogue();
  }, [editing, addOpen, swapFor, catalogue, loadCatalogue]);
  const adminProducts = useMemo(() => catalogue?.products || [], [catalogue]);

  /**
   * Which price list this bill was written on.
   *
   * Recorded on the order since counter billing started storing it. For older
   * bills it is inferred from the MRPs on their own lines, and the biller can
   * override that guess - `assumed` holds the override for as long as the
   * panel is open, and null means "no override, use what was worked out".
   */
  const recorded = orderBasis(order);
  const guess = useMemo(
    () => (recorded.recorded ? null : inferBasis(order, adminProducts)),
    [recorded.recorded, order, adminProducts]
  );

  /** How the bill was written. A fact, never edited here. */
  const primary = recorded.recorded
    ? recorded
    : guess || { recorded: false, list2: false, extra: 0 };

  /**
   * What new lines cost. Follows `primary` until the biller moves it, and
   * resets when a different order is opened - carrying one order's override
   * onto the next would misprice it silently.
   */
  const basis = {
    recorded: primary.recorded,
    list2: chosenList == null ? primary.list2 : chosenList === 2,
    extra: chosenExtra == null ? primary.extra || 0 : Math.min(95, Math.max(0, Number(chosenExtra) || 0)),
  };

  useEffect(() => { setChosenList(null); setChosenExtra(null); }, [order?.id]);

  /**
   * Which lines the packer has ticked off, held here rather than in the order.
   *
   * A tick is a note to self while walking the shelves - it is not a fact about
   * the order until the packing is finished. Saving each one cost a round trip
   * that the packer had to wait through, so ticking now costs nothing and only
   * "Mark packed" writes, which is also the moment the order genuinely changes.
   *
   * Kept in localStorage so closing the panel, or a stray refresh mid-aisle,
   * does not throw the progress away.
   */
  const [ticks, setTicks] = useState({});
  const orderId = order?.id;
  const storeKey = orderId ? `stw.packing.${orderId}` : null;

  useEffect(() => {
    if (!order) return;
    // Once an order is packed or beyond, the order itself is the truth.
    const settledStatus = order.status !== "new" && order.status !== "packing";
    const fromOrder = {};
    (order.items || []).forEach((it) => { if (it.packed) fromOrder[it.id] = true; });
    if (settledStatus) { setTicks(fromOrder); return; }

    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(storeKey) || "null"); } catch {}
    setTicks(saved && typeof saved === "object" ? saved : fromOrder);
    // Re-reads when a different order is opened, or when its status moves on.
  }, [orderId, order?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTick = (it) =>
    setTicks((prev) => {
      const nextTicks = { ...prev, [it.id]: !prev[it.id] };
      try { localStorage.setItem(storeKey, JSON.stringify(nextTicks)); } catch {}
      return nextTicks;
    });

  /**
   * Ticks every line at once, or clears them if they are already all ticked.
   *
   * Lines that could not be filled are skipped: they are settled by being
   * marked out of stock, and ticking one would claim it went in the box.
   */
  const tickAll = () => {
    const tickable = (order?.items || []).filter((it) => !(it.unavailable && !it.substitute));
    const allOn = tickable.length > 0 && tickable.every((it) => ticks[it.id]);
    const nextTicks = { ...ticks };
    tickable.forEach((it) => { nextTicks[it.id] = !allOn; });
    try { localStorage.setItem(storeKey, JSON.stringify(nextTicks)); } catch {}
    setTicks(nextTicks);
  };

  // The list renders from the packer's ticks, not from what is stored.
  const items = useMemo(
    () => (order?.items || []).map((it) => ({ ...it, packed: Boolean(ticks[it.id]) })),
    [order?.items, ticks]
  );

  if (!order) return null;

  const c = order.customer;
  const next = NEXT[order.status];
  // A line the packer could not fill is settled too - it must not block the
  // order from being completed.
  const allSettled = items.every((i) => i.packed || (i.unavailable && !i.substitute));
  const adjusted = (order.originalTotal ?? order.total) !== order.total;

  const waText = encodeURIComponent(
    `Hello ${c.name}, this is Sankamithra Thunder World about your order ${order.ref} (${inr(order.total)}). `
  );


  return (
    // flex:1 + minHeight:0 inside the parent's flex column is what lets the
    // middle section scroll and keeps the action bar pinned in view.
    <Stack sx={{ flex: 1, minHeight: 0, height: "100%" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" gap={1} sx={{ p: 2, borderBottom: "1px solid #eee" }}>
        <Stack flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography fontSize={16} fontWeight={800} color="var(--text-color)">{order.ref}</Typography>
            <StatusChip status={order.status} />
            {!order.emailSent && (
              <Tooltip title="The notification email did not send for this order">
                <Chip label="No email" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, backgroundColor: "#fff4e5", color: "#b26a00" }} />
              </Tooltip>
            )}
          </Stack>
          <Typography fontSize={11.5} color="var(--text-color-secondary)">
            {new Date(order.createdAt).toLocaleString("en-IN")}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} aria-label="close order"><CloseRoundedIcon /></IconButton>
      </Stack>

      <Stack sx={{ flex: 1, overflowY: "auto", minHeight: 0, p: 2, gap: 2.5 }}>
        {/* Customer + one-tap contact: the owner confirms every order by phone */}
        <CustomerBlock
          customer={c}
          busy={busy}
          onSave={(fields) => onPatch({ customer: fields })}
        />

        <OrderActions order={order} onToast={onToast} />

        <Divider />

        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <Button
            onClick={() => setEditing((v) => !v)}
            disabled={busy || order.status === "cancelled"}
            startIcon={editing ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : <EditRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: "none", fontWeight: 800, fontSize: 12.5, px: 1.5,
                  borderRadius: "var(--radius-pill)",
                  color: editing ? "#fff" : "var(--primary-color)",
                  backgroundColor: editing ? "var(--primary-color)" : "var(--primary-soft)",
                  "&:hover": { backgroundColor: editing ? "#e34100" : "var(--primary-border)" } }}
          >
            {editing ? "Done editing" : "Edit items"}
          </Button>
          {editing && (
            <Button
              onClick={() => setAddOpen(true)}
              disabled={busy}
              startIcon={<AddRoundedIcon sx={{ fontSize: 17 }} />}
              sx={{ textTransform: "none", fontWeight: 800, fontSize: 12.5, px: 1.5,
                    borderRadius: "var(--radius-pill)", border: "1px solid var(--primary-color)",
                    color: "var(--primary-color)" }}
            >
              Add product
            </Button>
          )}
          {editing && order.status === "dispatched" && (
            <Typography fontSize={11.5} fontWeight={700} color="var(--warning)">
              This order has already been dispatched.
            </Typography>
          )}

        </Stack>

        {/* Kept out of the toolbar above: it is two related settings and a
            consequence, which a row of chips could not say clearly. */}
        {editing && (
          <BillingBasis
            primary={primary}
            list2={basis.list2}
            extra={chosenExtra == null ? String(primary.extra || 0) : chosenExtra}
            loading={catLoading && !catalogue}
            busy={busy}
            onList={(n) => setChosenList(n)}
            onExtra={(v) => setChosenExtra(v)}
            onReprice={(r) => { onPatch({ reprice: r }); setChosenList(null); setChosenExtra(null); }}
          />
        )}

        <PackingList
          items={items}
          busy={busy}
          editing={editing}
          onToggle={toggleTick}
          onTickAll={tickAll}
          locked={order.status !== "new" && order.status !== "packing"}
          onUnavailable={(it, flag) => onPatch({ itemId: it.id, unavailable: flag })}
          onSubstitute={(it) => setSwapFor(it)}
          onCount={(it, q) => onPatch({ itemId: it.id, count: q })}
          onRemove={(it) => onPatch({ removeItem: it.id })}
        />

        <AddItemPicker
          open={addOpen}
          order={order}
          busy={busy}
          basis={basis}
          products={adminProducts}
          loading={catLoading}
          onClose={() => setAddOpen(false)}
          onAdd={(p, qty) => {
            // Sent on the bill's own list, not the catalogue's website rate, so
            // the new line matches every line already on the order.
            onPatch({ addItem: { id: p.id, name: p.name, category: p.category,
                                 image: p.image?.[0] || null,
                                 price: basisMrp(p, basis.list2),
                                 discount: effDiscount(p, basis.list2, basis.extra),
                                 count: qty } });
            setAddOpen(false);
          }}
        />

        <SubstitutePicker
          open={Boolean(swapFor)}
          item={swapFor}
          basis={basis}
          products={adminProducts}
          onClose={() => setSwapFor(null)}
          onChoose={(sub) => { onPatch({ itemId: swapFor.id, substitute: sub }); setSwapFor(null); }}
        />

        <Divider />

        <Stack gap={0.5}>
          <Row label={`Price (${order.itemCount} units)`} value={inr(order.mrp)} />
          <Row label="Discount" value={`− ${inr(order.mrp - order.total)}`} green />
          <Stack direction="row" justifyContent="space-between" pt={0.5}>
            <Typography fontSize={15} fontWeight={800} color="var(--text-color)">Total</Typography>
            <Stack alignItems="flex-end">
              <Typography fontSize={17} fontWeight={800} color="var(--text-color)">{inr(order.total)}</Typography>
              {adjusted && (
                <Typography fontSize={11} color="var(--text-color-secondary)" sx={{ textDecoration: "line-through" }}>
                  {inr(order.originalTotal)}
                </Typography>
              )}
            </Stack>
          </Stack>

          {/* The customer agreed to the original figure - the shop has to
              mention any change when it calls to confirm. */}
          {adjusted && (
            <Stack direction="row" gap={1} alignItems="center"
              sx={{ mt: 0.5, p: 1.25, borderRadius: "var(--radius)", backgroundColor: "var(--warning-soft)" }}>
              <ErrorOutlineRoundedIcon sx={{ fontSize: 17, color: "var(--warning)" }} />
              <Typography fontSize={11.5} fontWeight={700} color="var(--warning)">
                Total changed by {order.total > order.originalTotal ? "+" : "−"}
                {inr(Math.abs(order.total - order.originalTotal))} — confirm with the customer
              </Typography>
            </Stack>
          )}
        </Stack>

        {order.history?.length > 0 && (
          <Stack gap={0.5}>
            <Typography fontSize={12.5} fontWeight={800} color="var(--text-color)">History</Typography>
            {order.history.map((h, i) => (
              <Typography key={i} fontSize={11.5} color="var(--text-color-secondary)">
                {new Date(h.at).toLocaleString("en-IN")} — {h.event}
              </Typography>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Sticky action bar: the one thing to do next, always reachable */}
      <Stack direction="row" gap={1} sx={{ p: 2, borderTop: "1px solid #eee", backgroundColor: "#fff" }}>
        {order.status !== "cancelled" && order.status !== "dispatched" && (
          <Button
            fullWidth
            disabled={busy || (order.status === "packing" && !allSettled)}
            onClick={() => {
              if (next?.to === "packed") { try { localStorage.removeItem(storeKey); } catch {} }
              onPatch({ status: next?.to });
            }}
            sx={{
              textTransform: "none", fontWeight: 800, fontSize: 14.5, py: 1.15, borderRadius: "10px",
              color: "#fff", backgroundColor: "var(--primary-color)",
              "&:hover": { backgroundColor: "#e34100" },
              "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" },
            }}
          >
            {order.status === "packing" && !allSettled
              ? `${items.filter((i) => !(i.packed || (i.unavailable && !i.substitute))).length} lines left`
              : next?.label}
          </Button>
        )}
        {order.status !== "cancelled" && (
          <Button
            onClick={() => onPatch({ status: "cancelled" })}
            disabled={busy}
            sx={{
              textTransform: "none", fontWeight: 700, fontSize: 13, borderRadius: "10px",
              color: "#c92a2a", flexShrink: 0,
              "&:hover": { backgroundColor: "#ffeaea" },
            }}
          >
            Cancel
          </Button>
        )}
        {order.status === "cancelled" && (
          <Button
            fullWidth onClick={() => onPatch({ status: "new" })} disabled={busy}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", color: "var(--primary-color)", border: "1.5px solid var(--primary-color)" }}
          >
            Reopen order
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

const btn = {
  textTransform: "none", fontWeight: 700, fontSize: 12.5,
  borderRadius: "8px", py: 0.5,
  color: "var(--text-color)", border: "1px solid #ddd",
  "&:hover": { backgroundColor: "#f7f7f7", borderColor: "#ccc" },
};

function Row({ label, value, green }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography fontSize={12.5} fontWeight={green ? 700 : 600} color={green ? "#1d9b53" : "var(--text-color-secondary)"}>{label}</Typography>
      <Typography fontSize={12.5} fontWeight={green ? 800 : 600} color={green ? "#1d9b53" : "var(--text-color-secondary)"}>{value}</Typography>
    </Stack>
  );
}
