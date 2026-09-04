"use client";
import {
  Stack, Box, Typography, InputBase, Chip, Button, IconButton, TextField,
  CircularProgress, Divider, Drawer, Badge, Switch,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { assetUrl } from "@/util/config";
import QtyStepper from "@/app/components/commerce/QtyStepper";
import { useAdmin } from "../AdminContext";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
/**
 * Counter pricing.
 *
 * Pricelist 1 is the website list: an MRP with the product's own discount.
 * Pricelist 2 is a separate, lower set of MRPs carrying no product discount -
 * the biller gives away margin themselves through ExtraDiscount instead.
 *
 * Both lists resolve to a single effective discount off a single MRP, because
 * that is the only shape the server prices an order in. The server recomputes
 * from exactly these two numbers with the same formula, so what the biller sees
 * is what gets stored - and no price is ever taken from the browser, which
 * matters because the order endpoint is public.
 */
const basisMrp = (p, list2) => (list2 ? (p.mrp2 ?? p.price) : p.price);

const effDiscount = (p, list2, extra) => {
  const base = list2 ? 0 : Number(p.discount) || 0;
  const e = Math.min(95, Math.max(0, Number(extra) || 0));
  // Compounded, not added: ExtraDiscount comes off what is already discounted.
  return Math.round((1 - (1 - base / 100) * (1 - e / 100)) * 10000) / 100;
};

const unitOf = (p, list2, extra) => {
  const m = basisMrp(p, list2);
  return Math.round(m - (m * effDiscount(p, list2, extra)) / 100);
};
const PAGE = 40;

/** Unique per bill attempt; crypto.randomUUID is absent on older Safari. */
const newKey = () =>
  globalThis.crypto?.randomUUID?.() ??
  `pos-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Counter billing.
 *
 * Staff pick products and build the bill themselves, for a walk-in customer.
 * The result is an ordinary order with source "pos", so it joins the same list
 * and runs the same packing and dispatch workflow as a website order - the only
 * difference is who assembled it.
 *
 * The ₹3,000 online minimum deliberately does not apply: it exists to make
 * shipping worthwhile, and a counter sale is handed over on the spot.
 */
export default function Pos() {
  const { catalogue, catLoading, loadCatalogue, notify, loadOrders } = useAdmin();
  // Wrapped: `catalogue?.products || []` builds a new array on every render,
  // so every useMemo downstream saw a changed dependency and recomputed - on a
  // 184-product catalogue that ran on every keystroke.
  const products = useMemo(
    () => catalogue?.products?.filter((p) => p.active !== false) || [],
    [catalogue]
  );
  const categories = catalogue?.categories || [];

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [lines, setLines] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "", city: "", state: "Tamil Nadu", zip: "" });
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const [confirmClear, setConfirmClear] = useState(false);
  // Identifies this bill across retries. Several devices bill at the same
  // counter, and a slow reply invites a second tap - the server uses this to
  // recognise the repeat instead of writing a second bill.
  const billKey = useRef(newKey());
  // Counter billing only. The storefront never sees either of these.
  const [list2, setList2] = useState(false);
  const [extra, setExtra] = useState("");

  /**
   * The bill is rendered once, either as the desktop column or the mobile
   * sheet. Rendering both and hiding one with CSS would put two sets of the
   * customer inputs in the DOM under identical labels.
   * noSsr avoids a hydration mismatch; the panel is admin-only and client-side.
   */
  const wide = useMediaQuery("(min-width:1200px)", { noSsr: true });

  /** How many of a product are already on the bill — drives the card badge. */
  const countOf = (id) => lines.find((l) => l.id === id)?.count || 0;

  useEffect(() => { if (!catalogue) loadCatalogue(); }, [catalogue, loadCatalogue]);

  const matching = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        (!q || p.name.toLowerCase().includes(q) || String(p.sku).toLowerCase().includes(q))
    );
  }, [products, query, cat]);

  // Rendered in batches as you scroll rather than capped: a fixed limit hid
  // whole categories from "All" — the tail of the catalogue was unreachable.
  const shown = useMemo(() => matching.slice(0, visible), [matching, visible]);

  useEffect(() => { setVisible(PAGE); }, [cat, query]);

  /**
   * Loads the next batch when the end of the grid comes into view.
   *
   * An IntersectionObserver rather than a scroll handler on the grid: the admin
   * shell lets the *page* scroll on mobile and the *container* scroll on
   * desktop, so a container-bound listener never fires on a phone — which left
   * the catalogue stuck at the first batch.
   */
  const sentinel = useRef(null);
  const more = visible < matching.length;

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !more) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisible((v) => v + PAGE); },
      { rootMargin: "400px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [more, matching.length, visible]);

  const add = (p) =>
    setLines((prev) => {
      const i = prev.findIndex((l) => l.id === p.id);
      if (i > -1) {
        const next = [...prev];
        next[i] = { ...next[i], count: next[i].count + 1 };
        return next;
      }
      return [...prev, { ...p, count: 1 }];
    });

  const setQty = (id, count) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, count } : l)).filter((l) => l.count > 0));

  const adjust = (id, delta) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, count: l.count + delta } : l)).filter((l) => l.count > 0));

  const net = (l) => unitOf(l, list2, extra);
  const total = lines.reduce((a, l) => a + Math.round(net(l) * l.count), 0);
  const mrp = lines.reduce((a, l) => a + Math.round(basisMrp(l, list2) * l.count), 0);
  // The same basket on the other list, so the biller can see both at once.
  const otherTotal = lines.reduce(
    (a, l) => a + Math.round(unitOf(l, !list2, extra) * l.count), 0
  );
  const units = lines.reduce((a, l) => a + l.count, 0);

  const reset = () => { billKey.current = newKey(); setConfirmClear(false); setLines([]); setList2(false); setExtra(""); setCustomer({ name: "", phone: "", email: "", address: "", city: "", state: "Tamil Nadu", zip: "" }); setNote(""); };

  const createBill = async () => {
    if (!lines.length) { notify("Add at least one product", "error"); return; }
    if (!customer.name.trim()) { notify("Customer name is required", "error"); return; }
    setSaving(true);
    try {
      // The proforma is rendered here, in the browser, for the same reason the
      // storefront does it: the PDF template only works client-side.
      let invoice;
      if (customer.email?.trim()) {
        const { buildProformaBase64 } = await import("@/util/proforma");
        invoice = await buildProformaBase64({ customer, items: lines.map((l) => ({
          name: l.name, mrp: basisMrp(l, list2), discount: effDiscount(l, list2, extra), count: l.count,
        })) }).catch(() => undefined);
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Lines are sent on the list they were billed on, so the server prices
        // them exactly as the counter screen showed them.
        body: JSON.stringify({
          source: "pos", note, billingDetails: customer, invoice, clientRef: billKey.current,
          productList: lines.map((l) => ({
            ...l, price: basisMrp(l, list2), discount: effDiscount(l, list2, extra),
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { notify(data.error || "Could not create the bill", "error"); return; }

      notify(`${data.ref} billed · ${inr(total)}`, "success");
      setLastOrder({ ref: data.ref, total, units, lines, customer, at: new Date() });
      reset();
      // Close the sheet: leaving it open over an empty bill reads as "nothing
      // happened", which is exactly how it felt.
      setSheetOpen(false);
      loadOrders();
    } catch {
      notify("Could not reach the server", "error");
    } finally {
      setSaving(false);
    }
  };

  /** Thermal-friendly receipt: narrow, monospaced, no colour. */
  const printBill = (bill) => {
    const w = window.open("", "_blank", "width=380,height=700");
    if (!w) return;
    w.document.write(`
      <html><head><title>${bill.ref}</title><style>
        @page { size: 80mm auto; margin: 4mm; }
        body { font-family: ui-monospace, "Courier New", monospace; font-size: 12px; width: 72mm; color:#000; }
        h2 { text-align:center; margin:0 0 2px; font-size:14px; }
        .c { text-align:center; }
        .muted { color:#555; font-size:10px; }
        table { width:100%; border-collapse:collapse; margin-top:8px; }
        td { padding:2px 0; vertical-align:top; }
        .r { text-align:right; } .rule { border-top:1px dashed #000; margin:6px 0; }
        .tot { font-weight:bold; font-size:13px; }
      </style></head><body>
        <h2>SANKAMITHRA THUNDER WORLD</h2>
        <div class="c muted">Fireworks &amp; Crackers · Sivakasi<br>+91 94892 39970</div>
        <div class="rule"></div>
        <div>Bill: <b>${bill.ref}</b></div>
        <div class="muted">${bill.at.toLocaleString("en-IN")}</div>
        <div>Customer: ${bill.customer.name}${bill.customer.phone ? `<br>${bill.customer.phone}` : ""}</div>
        <div class="rule"></div>
        <table>
          ${bill.lines.map((l) => `<tr><td>${l.name}<div class="muted">${l.count} x ${inr(net(l))}</div></td>
            <td class="r">${inr(Math.round(net(l) * l.count))}</td></tr>`).join("")}
        </table>
        <div class="rule"></div>
        <table>
          <tr><td>Items</td><td class="r">${bill.units}</td></tr>
          <tr class="tot"><td>TOTAL</td><td class="r">${inr(bill.total)}</td></tr>
        </table>
        <div class="rule"></div>
        <div class="c muted">Proforma — not a tax invoice.<br>Thank you, and celebrate safely!</div>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  /**
   * The bill, used as the desktop column and the mobile sheet.
   *
   * Header and action bar are pinned; everything between them scrolls as one
   * region. Previously the line list alone was the flex child, so on a short
   * screen the fixed-height customer fields and totals ate the space and the
   * items collapsed to nothing — the sheet looked like it only held a button.
   */
  const billPanel = (
    <Stack sx={{ width: "100%", height: "100%", minHeight: 0 }}>
      {/* Only the dismiss control lives up here. "Clear" used to sit beside it,
          which put a destructive action one thumb-width from a harmless one -
          a mis-tap wiped the whole bill. It now lives at the foot of the item
          list, and asks first. */}
      <Stack direction="row" alignItems="center" gap={1} flexShrink={0} sx={{ px: 2, pt: 2, pb: 1 }}>
        <ReceiptLongRoundedIcon sx={{ color: "var(--primary-color)", fontSize: 19 }} />
        <Typography flex={1} fontSize={15} fontWeight={800} color="var(--text-color)">Counter bill</Typography>
        {!wide && (
          <IconButton onClick={() => setSheetOpen(false)} aria-label="close bill"
            sx={{ color: "var(--text-color-secondary)" }}>
            <CloseRoundedIcon sx={{ fontSize: 21 }} />
          </IconButton>
        )}
      </Stack>

      {/* One scrolling region: items, customer, totals */}
      <Stack sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2, gap: 1.5, pb: 1,
                   overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}>
        {lines.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" gap={1} sx={{ py: 5 }}>
            <Box sx={{ fontSize: 30 }}>🧾</Box>
            <Typography fontSize={13} fontWeight={800} color="var(--text-color)">No items yet</Typography>
            <Typography fontSize={12} color="var(--text-color-secondary)" textAlign="center">
              Tap a product to add it to the bill.
            </Typography>
          </Stack>
        ) : (
          <Stack gap={0.75}>
            {lines.map((l) => (
              <Stack key={l.id} data-bill-line={l.id} direction="row" alignItems="center" gap={1}
                sx={{ p: 0.75, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <Stack flex={1} minWidth={0}>
                  <Typography fontSize={12.5} fontWeight={800} color="var(--text-color)" noWrap>{l.name}</Typography>
                  <Typography fontSize={10.5} color="var(--text-color-secondary)">{inr(net(l))} each</Typography>
                </Stack>
                <QtyStepper size="sm" value={l.count} onChange={(q) => setQty(l.id, q)} onAdjust={(d) => adjust(l.id, d)} />
                <Typography fontSize={13} fontWeight={800} color="var(--text-color)" sx={{ minWidth: 58, textAlign: "right" }}>
                  {inr(Math.round(net(l) * l.count))}
                </Typography>
                <IconButton size="small" onClick={() => setQty(l.id, 0)} aria-label={`remove ${l.name}`}
                  sx={{ color: "var(--text-color-trinary)", "&:hover": { color: "var(--danger)" } }}>
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            ))}

            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ pt: 0.5 }}>
              {/* Which price list this bill is on. Left of Clear all, where the
                  biller is already looking when reviewing the basket. */}
              <Stack direction="row" alignItems="center" gap={0.5}>
                <Switch
                  size="small"
                  checked={list2}
                  onChange={(e) => setList2(e.target.checked)}
                  inputProps={{ "aria-label": "use pricelist 2" }}
                  sx={{ "& .Mui-checked": { color: "var(--primary-color)" },
                        "& .Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--primary-color)" } }}
                />
                <Stack>
                  <Typography fontSize={12} fontWeight={800}
                    color={list2 ? "var(--primary-color)" : "var(--text-color)"}>
                    {list2 ? "Pricelist 2" : "Pricelist 1"}
                  </Typography>
                  {lines.length > 0 && (
                    <Typography fontSize={10.5} color="var(--text-color-secondary)">
                      other list: {inr(otherTotal)}
                    </Typography>
                  )}
                </Stack>
              </Stack>

              {confirmClear ? (
                <Stack direction="row" gap={1} alignItems="center">
                  <Typography fontSize={12} color="var(--text-color-secondary)">Clear all items?</Typography>
                  <Button size="small" onClick={() => setConfirmClear(false)}
                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, color: "var(--text-color-secondary)" }}>
                    Keep
                  </Button>
                  <Button size="small" onClick={() => { reset(); setConfirmClear(false); }}
                    sx={{ textTransform: "none", fontWeight: 800, fontSize: 12, px: 1.5,
                          color: "#fff", backgroundColor: "var(--danger)",
                          "&:hover": { backgroundColor: "#c92a2a" } }}>
                    Clear
                  </Button>
                </Stack>
              ) : (
                <Button size="small" onClick={() => setConfirmClear(true)}
                  startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />}
                  sx={{ textTransform: "none", fontWeight: 700, fontSize: 12,
                        color: "var(--text-color-trinary)",
                        "&:hover": { color: "var(--danger)", backgroundColor: "var(--danger-soft)" } }}>
                  Clear all
                </Button>
              )}
            </Stack>

            {/* Sits under the products, where the bill is totted up. Pricelist 2
                carries no product discount, so this is where that bill's
                concession is given. */}
            <TextField
              size="small"
              label="ExtraDiscount %"
              value={extra}
              onChange={(e) => setExtra(e.target.value.replace(/[^0-9.]/g, "").slice(0, 5))}
              inputProps={{ inputMode: "decimal", "aria-label": "extra discount percent" }}
              helperText={
                Number(extra) > 0
                  ? `${Number(extra)}% off every line${list2 ? "" : ", on top of the product discount"}`
                  : "Optional — a concession for this bill only"
              }
              sx={fld}
            />
          </Stack>
        )}

        <Divider />

        <Stack gap={1}>
          <TextField size="small" label="Customer name *" value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })} sx={fld} />
          <Stack direction="row" gap={1}>
            <TextField size="small" fullWidth label="Phone" value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              inputProps={{ inputMode: "numeric" }} sx={fld} />
            <TextField size="small" fullWidth label="Email (for the proforma)" value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })} sx={fld} />
          </Stack>
          <TextField size="small" label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} sx={fld} />
        </Stack>

        {mrp > total && (
          <Stack direction="row" justifyContent="space-between">
            <Typography fontSize={12} fontWeight={700} color="var(--success)">Discount</Typography>
            <Typography fontSize={12} fontWeight={800} color="var(--success)">− {inr(mrp - total)}</Typography>
          </Stack>
        )}
      </Stack>

      {/* Pinned: the total and the action are always reachable */}
      <Stack gap={1} flexShrink={0}
        sx={{ px: 2, pt: 1.5, pb: 2, borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Stack>
            <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Total</Typography>
            <Typography fontSize={11} color="var(--text-color-secondary)">
              {lines.length} {lines.length === 1 ? "line" : "lines"} · {units} units
            </Typography>
          </Stack>
          <Typography fontSize={22} fontWeight={800} color="var(--text-color)">{inr(total)}</Typography>
        </Stack>

        <Button onClick={createBill} disabled={saving || !lines.length}
          startIcon={saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null}
          sx={{ textTransform: "none", fontWeight: 800, fontSize: 15, py: 1.25, borderRadius: "var(--radius)",
                color: "#fff", backgroundColor: "var(--primary-color)",
                "&:hover": { backgroundColor: "var(--primary-dark)" },
                "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" } }}>
          {saving ? "Creating..." : `Create bill · ${inr(total)}`}
        </Button>
      </Stack>
    </Stack>
  );

  return (
    <Stack direction={{ xs: "column", lg: "row" }} gap={2} sx={{ flex: 1, minHeight: 0, pb: { xs: 9, lg: 0 } }}>
      {/* Products */}
      <Stack flex={1} minWidth={0} gap={1.5} sx={{ minHeight: 0 }}>
        <Stack direction="row" alignItems="center" gap={1} flexShrink={0}
          sx={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius)", px: 1.5, py: 0.75,
                "&:focus-within": { borderColor: "var(--primary-color)" } }}>
          <SearchRoundedIcon sx={{ fontSize: 19, color: "var(--text-color-trinary)" }} />
          <InputBase autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product or SKU to add..." sx={{ flex: 1, fontSize: 14, fontWeight: 600 }} />
          {query && <CloseRoundedIcon onClick={() => setQuery("")} sx={{ fontSize: 17, cursor: "pointer", color: "var(--text-color-trinary)" }} />}
        </Stack>

        <Stack direction="row" gap={0.75} flexShrink={0} sx={{ overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { display: "none" } }}>
          {["All", ...categories].map((c) => (
            <Chip key={c} label={c} size="small" onClick={() => setCat(c)}
              sx={{ flexShrink: 0, fontWeight: 700, fontSize: 11.5, border: "1px solid",
                    borderColor: cat === c ? "var(--primary-color)" : "var(--border)",
                    backgroundColor: cat === c ? "var(--primary-color)" : "#fff",
                    color: cat === c ? "#fff" : "var(--text-color)" }} />
          ))}
        </Stack>

        <Typography fontSize={11.5} fontWeight={700} color="var(--text-color-secondary)" flexShrink={0}>
          {matching.length === 0
            ? "No products match"
            : `Showing ${shown.length} of ${matching.length}${cat === "All" ? " products" : ` in ${cat}`}`}
        </Typography>

        {catLoading ? (
          <Stack alignItems="center" py={6}><CircularProgress sx={{ color: "var(--primary-color)" }} /></Stack>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: { lg: "auto" }, pr: { lg: 0.5 },
                     display: "grid", gap: 1,
                     gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", sm: "repeat(3,minmax(0,1fr))", xl: "repeat(4,minmax(0,1fr))" },
                     alignContent: "start" }}>
            {shown.map((p) => {
              const n = countOf(p.id);
              return (
                  <Stack key={p.id} data-pos-product={p.id} onClick={() => add(p)} gap={0.5}
                    sx={{ p: 1, borderRadius: "var(--radius)", position: "relative",
                          border: "1.5px solid", borderColor: n ? "var(--primary-color)" : "var(--border)",
                          backgroundColor: n ? "var(--primary-softer)" : "var(--surface)", cursor: "pointer",
                          transition: "border-color .12s, background-color .12s",
                          "&:active": { transform: "scale(0.98)" },
                          "&:hover": { borderColor: "var(--primary-color)" } }}>
                    <Box sx={{ position: "relative" }}>
                      <Box component="img" src={assetUrl(p.image?.[0])} alt=""
                        sx={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "var(--radius-sm)", backgroundColor: "#f6f6f6" }} />
                      {/* The count sits on the card so a tap is confirmed where
                          the eye already is — on mobile the bill is far below. */}
                      {n > 0 && (
                        <Box sx={{ position: "absolute", top: 6, right: 6, minWidth: 26, height: 26, px: 0.75,
                                   borderRadius: 99, backgroundColor: "var(--primary-color)", color: "#fff",
                                   display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800,
                                   boxShadow: "0 2px 6px rgba(0,0,0,.25)" }}>
                          {n}
                        </Box>
                      )}
                    </Box>

                    <Typography fontSize={11.5} fontWeight={800} color="var(--text-color)"
                      sx={{ lineHeight: 1.25, minHeight: 29, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.name}
                    </Typography>

                    {n > 0 ? (
                      // stopPropagation, or adjusting would also re-add the item
                      <Stack direction="row" alignItems="center" justifyContent="space-between"
                        onClick={(e) => e.stopPropagation()}
                        sx={{ backgroundColor: "#fff", border: "1px solid var(--primary-border)",
                              borderRadius: "var(--radius-pill)", p: 0.25 }}>
                        <IconButton size="small" aria-label={`remove one ${p.name}`}
                          onClick={() => adjust(p.id, -1)}
                          sx={{ width: 28, height: 28, color: "var(--primary-color)" }}>
                          <RemoveRoundedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                        <Typography fontSize={13.5} fontWeight={800} color="var(--text-color)">{n}</Typography>
                        <IconButton size="small" aria-label={`add one ${p.name}`}
                          onClick={() => adjust(p.id, 1)}
                          sx={{ width: 28, height: 28, color: "var(--primary-color)" }}>
                          <AddRoundedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Stack>
                    ) : (
                      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                        <Typography fontSize={13} fontWeight={800} color="var(--primary-color)">{inr(net(p))}</Typography>
                        <Typography fontSize={10} color="var(--text-color-trinary)">{p.countInStock} left</Typography>
                      </Stack>
                    )}
                </Stack>
              );
            })}

            {more && (
              <Button
                ref={sentinel}
                onClick={() => setVisible((v) => v + PAGE)}
                sx={{ gridColumn: "1 / -1", textTransform: "none", fontWeight: 700, fontSize: 13, py: 1.25,
                      color: "var(--primary-color)", "&:hover": { backgroundColor: "var(--primary-soft)" } }}
              >
                Show more ({matching.length - visible} left)
              </Button>
            )}
          </Box>
        )}
      </Stack>

      {/* Bill — a column on desktop, a bottom sheet on mobile */}
      {wide && (
        <Box sx={{ display: "flex", width: 400, flexShrink: 0, minHeight: 0,
                   border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
                   backgroundColor: "var(--surface)", overflow: "hidden" }}>
          {billPanel}
        </Box>
      )}

      {/* The last bill stays reachable after the sheet closes, so the receipt
          can still be printed while the next sale is started. */}
      {lastOrder && (
        <Stack direction="row" alignItems="center" gap={1}
          sx={{ position: "fixed", left: 0, right: 0, zIndex: 1150,
                bottom: !wide && lines.length > 0 ? 64 : 0,
                mx: { xs: 1.5, lg: 3 }, mb: 1.5,
                p: 1.25, borderRadius: "var(--radius)",
                backgroundColor: "var(--success-soft)", border: "1px solid #b6e7c9",
                boxShadow: "var(--shadow)" }}>
          <Typography flex={1} fontSize={12.5} fontWeight={700} color="var(--success-ink)">
            {lastOrder.ref} billed · {inr(lastOrder.total)}
          </Typography>
          <Button size="small" onClick={() => printBill(lastOrder)} startIcon={<PrintRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{ textTransform: "none", fontWeight: 800, fontSize: 12, color: "var(--success-ink)" }}>
            Print
          </Button>
          <IconButton size="small" onClick={() => setLastOrder(null)} aria-label="dismiss"
            sx={{ color: "var(--success-ink)" }}>
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      )}

      {/* Mobile: a standing summary so the running total is always visible
          without scrolling past the whole product grid. */}
      {!wide && lines.length > 0 && (
        <Stack
          direction="row" alignItems="center" justifyContent="space-between"
          onClick={() => setSheetOpen(true)}
          sx={{
            display: "flex",
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1200,
            px: 2, py: 1.25, cursor: "pointer",
            backgroundColor: "var(--primary-color)",
            boxShadow: "0 -4px 20px rgba(0,0,0,.18)",
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Badge badgeContent={units} max={999}
              sx={{ "& .MuiBadge-badge": { backgroundColor: "#fff", color: "var(--primary-color)", fontWeight: 800 } }}>
              <ReceiptLongRoundedIcon sx={{ color: "#fff" }} />
            </Badge>
            <Stack>
              <Typography fontSize={15} fontWeight={800} color="#fff">{inr(total)}</Typography>
              <Typography fontSize={10.5} color="#ffe0d3" fontWeight={600}>
                {lines.length} {lines.length === 1 ? "line" : "lines"} · {units} units
              </Typography>
            </Stack>
          </Stack>
          <Typography fontSize={13.5} fontWeight={800} color="#fff">Review bill →</Typography>
        </Stack>
      )}

      <Drawer
        anchor="bottom"
        open={!wide && sheetOpen}
        onClose={() => setSheetOpen(false)}
        PaperProps={{ sx: { borderTopLeftRadius: 18, borderTopRightRadius: 18, height: "90vh", display: "flex", flexDirection: "column" } }}
      >
        <Box sx={{ width: 38, height: 4, borderRadius: 99, backgroundColor: "#ddd", mx: "auto", mt: 1.25, flexShrink: 0 }} />
        {!wide && sheetOpen && billPanel}
      </Drawer>
    </Stack>
  );
}

const fld = {
  "& .MuiOutlinedInput-root": { borderRadius: "var(--radius)" },
  "& label.Mui-focused": { color: "var(--primary-color)" },
  "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "var(--primary-color)" },
};
