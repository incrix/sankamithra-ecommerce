"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Stack, Box, Typography, InputBase, TextField, Button, MenuItem, Chip,
  CircularProgress, useMediaQuery,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

/**
 * Both price lists, one row per product.
 *
 * Pricelist 1 is what the website charges: an MRP with a discount. Pricelist 2
 * is the counter list - its own MRP and no discount, because the biller gives
 * the concession through ExtraDiscount on the bill. Seeing them on one row is
 * the point: the second list is set by looking at the first.
 *
 * The admin shell is height:100dvh/overflow:hidden on desktop, so this page
 * owns its own scrolling: the filters and the column header stay put and only
 * the rows move. Rows also render in batches - 184 products x 3 inputs is
 * enough fields to make a single render visibly stutter.
 */

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const net1 = (mrp, d) => Math.round(Number(mrp || 0) - (Number(mrp || 0) * Number(d || 0)) / 100);
const PAGE = 60;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "nopl2", label: "No PL2 rate" },
  { key: "higher", label: "PL2 above PL1" },
  { key: "hidden", label: "Hidden" },
];

export default function Pricing({ catalogue, loading, onReload, onToast }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [filter, setFilter] = useState("all");
  const [edits, setEdits] = useState({});
  const [savingAll, setSavingAll] = useState(false);
  const [bulk, setBulk] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const sentinel = useRef(null);
  const compact = useMediaQuery("(max-width:900px)", { noSsr: true });

  const products = catalogue?.products || [];
  const categories = catalogue?.categories || [];

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "All" && p.category !== cat) return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      const n1 = net1(p.price, p.discount);
      if (filter === "nopl2" && p.mrp2 != null) return false;
      if (filter === "higher" && !(p.mrp2 != null && p.mrp2 > n1)) return false;
      if (filter === "hidden" && p.active !== false) return false;
      return true;
    });
  }, [products, q, cat, filter]);

  // Reset the window whenever the filtering changes, or "load more" would
  // keep growing across searches and defeat the point.
  useEffect(() => { setShown(PAGE); }, [q, cat, filter]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || shown >= rows.length) return;
    const io = new IntersectionObserver(
      (e) => { if (e[0].isIntersecting) setShown((n) => Math.min(n + PAGE, rows.length)); },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, rows.length]);

  const valueOf = (p, f) => {
    const e = edits[p.id];
    if (e && e[f] !== undefined) return e[f];
    return p[f] == null ? "" : String(p[f]);
  };
  const setField = (id, f, v) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [f]: v.replace(/[^0-9.]/g, "") } }));

  const dirtyIds = Object.keys(edits).map(Number);

  const bodyOf = (p) => {
    const e = edits[p.id] || {};
    return {
      price: Number(e.price ?? p.price) || 0,
      discount: Number(e.discount ?? p.discount) || 0,
      mrp2: (e.mrp2 ?? p.mrp2) === "" || (e.mrp2 ?? p.mrp2) == null ? null : Number(e.mrp2 ?? p.mrp2),
    };
  };

  async function saveIds(ids) {
    setSavingAll(true);
    let ok = 0;
    try {
      for (const id of ids) {
        const p = products.find((x) => x.id === id);
        if (!p) continue;
        const res = await fetch(`/api/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyOf(p)),
        });
        if (res.ok) { ok++; setEdits((prev) => { const n = { ...prev }; delete n[id]; return n; }); }
      }
      onToast(ok === ids.length ? `${ok} ${ok === 1 ? "product" : "products"} saved` : `${ok} of ${ids.length} saved`, ok === ids.length ? "success" : "error");
      onReload();
    } catch (err) {
      onToast(err.message || "Save failed", "error");
    } finally {
      setSavingAll(false);
    }
  }

  async function applyBulk() {
    const pct = Number(bulk);
    if (!Number.isFinite(pct) || pct < 0 || pct > 95) { onToast("Enter a discount between 0 and 95", "error"); return; }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulkDiscount", discount: pct, ...(cat === "All" ? {} : { category: cat }) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not apply");
      onToast(`${data.changed} products set to ${pct}% off`);
      setBulk(""); onReload();
    } catch (err) {
      onToast(err.message, "error");
    } finally { setBulkBusy(false); }
  }

  const visible = rows.slice(0, shown);

  return (
    <Stack gap={1.5} sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
      {/* Controls stay put; only the rows scroll. */}
      <Stack gap={1.25} flexShrink={0} sx={{ minWidth: 0 }}>
        <Stack direction={{ xs: "column", lg: "row" }} gap={1.25} alignItems={{ lg: "center" }}>
          <Stack direction="row" alignItems="center" gap={1}
            sx={{ flex: 1, px: 1.5, py: 0.75, borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <SearchRoundedIcon sx={{ fontSize: 18, color: "var(--text-color-trinary)" }} />
            <InputBase placeholder="Search a product…" value={q} onChange={(e) => setQ(e.target.value)}
              sx={{ flex: 1, fontSize: 14 }} />
            {q && <Button size="small" onClick={() => setQ("")} sx={{ minWidth: 0, fontSize: 11, color: "var(--text-color-trinary)" }}>clear</Button>}
          </Stack>
          <TextField select size="small" value={cat} onChange={(e) => setCat(e.target.value)} sx={{ minWidth: 180, ...fld }}>
            <MenuItem value="All">All categories</MenuItem>
            {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ minWidth: 0 }}>
            <TextField size="small" label="Set PL1 discount %" value={bulk}
              onChange={(e) => setBulk(e.target.value.replace(/[^0-9.]/g, ""))}
              sx={{ width: 148, ...fld }} inputProps={{ inputMode: "decimal" }} />
            <Button onClick={applyBulk} disabled={bulkBusy || !bulk} sx={primaryBtn}>
              {bulkBusy ? <CircularProgress size={15} sx={{ color: "#fff" }} /> : cat === "All" ? "Apply to all" : `Apply to ${cat}`}
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap">
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <Chip key={f.key} label={f.label} size="small" onClick={() => setFilter(f.key)}
                icon={f.key === "higher" ? <WarningAmberRoundedIcon sx={{ fontSize: 14 }} /> : undefined}
                sx={{ fontWeight: 800, fontSize: 11.5, cursor: "pointer",
                      backgroundColor: on ? "var(--primary-color)" : "var(--surface-muted)",
                      color: on ? "#fff" : "var(--text-color-secondary)",
                      "& .MuiChip-icon": { color: on ? "#fff" : "var(--warning-ink, #b26a00)" },
                      "&:hover": { backgroundColor: on ? "var(--primary-color)" : "var(--border)" } }} />
            );
          })}
          <Typography fontSize={12} color="var(--text-color-secondary)" sx={{ ml: 0.5 }}>
            {rows.length} of {products.length}
          </Typography>
        </Stack>
      </Stack>

      {loading ? (
        <Stack alignItems="center" py={6}><CircularProgress size={22} /></Stack>
      ) : (
        <Stack sx={{ flex: 1, minWidth: 0, minHeight: 0, border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {!compact && (
            <Stack direction="row" gap={1} flexShrink={0}
              sx={{ px: 1.5, py: 1, backgroundColor: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
              <Th w={40}>SL</Th><Th flex>Product</Th>
              <Th w={92} right>PL1 MRP</Th><Th w={78} right>Disc %</Th><Th w={86} right>PL1 price</Th>
              <Th w={92} right>PL2 MRP</Th><Th w={86} right>PL2 price</Th>
            </Stack>
          )}

          <Stack sx={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain" }}>
            {visible.length === 0 && (
              <Typography fontSize={13} color="var(--text-color-secondary)" textAlign="center" py={5}>
                Nothing matches that.
              </Typography>
            )}

            {visible.map((p) => {
              const price = valueOf(p, "price"), disc = valueOf(p, "discount"), m2 = valueOf(p, "mrp2");
              const p1 = net1(price, disc);
              const p2 = m2 === "" ? null : Math.round(Number(m2) || 0);
              const above = p2 != null && p2 > p1;
              const isDirty = Boolean(edits[p.id]);

              const name = (
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontSize={13} fontWeight={700} color="var(--text-color)" noWrap>{p.name}</Typography>
                  <Stack direction="row" gap={0.6} alignItems="center">
                    <Typography fontSize={10.5} color="var(--text-color-secondary)">{p.category}</Typography>
                    {p.active === false && <Chip label="hidden" size="small" sx={tag} />}
                    {above && <Chip label="PL2 above PL1" size="small" sx={{ ...tag, backgroundColor: "#fff3e0", color: "#b26a00" }} />}
                  </Stack>
                </Box>
              );

              if (compact) {
                return (
                  <Stack key={p.id} gap={1} sx={{ p: 1.25, borderBottom: "1px solid var(--border)",
                        backgroundColor: isDirty ? "var(--primary-soft)" : "transparent" }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography fontSize={11} color="var(--text-color-trinary)" sx={{ width: 26 }}>
                        {p.sortOrder != null && p.sortOrder < 1000 ? p.sortOrder : "—"}
                      </Typography>
                      {name}
                    </Stack>
                    <Stack direction="row" gap={1} flexWrap="wrap" sx={{ minWidth: 0 }}>
                      <Field label="PL1 MRP"><Num value={price} onChange={(v) => setField(p.id, "price", v)} /></Field>
                      <Field label="Disc %"><Num value={disc} onChange={(v) => setField(p.id, "discount", v)} /></Field>
                      <Field label="PL1 price"><Readout>{inr(p1)}</Readout></Field>
                    </Stack>
                    <Stack direction="row" gap={1} flexWrap="wrap" sx={{ minWidth: 0 }}>
                      <Field label="PL2 MRP"><Num value={m2} placeholder="—" onChange={(v) => setField(p.id, "mrp2", v)} /></Field>
                      <Field label="PL2 price">
                        <Readout accent={p2 != null} muted={p2 == null}>{p2 == null ? `${inr(p1)}*` : inr(p2)}</Readout>
                      </Field>
                    </Stack>
                  </Stack>
                );
              }

              return (
                <Stack key={p.id} direction="row" gap={1} alignItems="center"
                  sx={{ px: 1.5, py: 0.75, borderBottom: "1px solid var(--border)",
                        backgroundColor: isDirty ? "var(--primary-soft)" : "transparent" }}>
                  <Typography sx={{ width: 40, fontSize: 11.5, color: "var(--text-color-trinary)" }}>
                    {p.sortOrder != null && p.sortOrder < 1000 ? p.sortOrder : "—"}
                  </Typography>
                  {name}
                  <Box sx={{ width: 92 }}><Num value={price} onChange={(v) => setField(p.id, "price", v)} /></Box>
                  <Box sx={{ width: 78 }}><Num value={disc} onChange={(v) => setField(p.id, "discount", v)} /></Box>
                  <Box sx={{ width: 86, textAlign: "right", pr: 0.5 }}>
                    <Typography fontSize={13} fontWeight={800} color="var(--text-color)">{inr(p1)}</Typography>
                  </Box>
                  <Box sx={{ width: 92 }}><Num value={m2} placeholder="—" onChange={(v) => setField(p.id, "mrp2", v)} /></Box>
                  <Box sx={{ width: 86, textAlign: "right", pr: 0.5 }}>
                    <Typography fontSize={13} fontWeight={800}
                      color={p2 == null ? "var(--text-color-trinary)" : above ? "#b26a00" : "var(--primary-color)"}>
                      {p2 == null ? `${inr(p1)}*` : inr(p2)}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}

            {shown < rows.length && (
              <Stack ref={sentinel} alignItems="center" py={2}>
                <CircularProgress size={18} />
              </Stack>
            )}

            <Typography fontSize={11} color="var(--text-color-secondary)" sx={{ px: 1.5, py: 1.25 }}>
              * no Pricelist 2 rate — the counter bills this item at the Pricelist 1 price.
            </Typography>
          </Stack>
        </Stack>
      )}

      {/* Only appears once something is edited, so the table keeps its height. */}
      {dirtyIds.length > 0 && (
        <Stack direction="row" alignItems="center" gap={1.5} flexShrink={0}
          sx={{ px: 1.75, py: 1.25, borderRadius: "var(--radius)", backgroundColor: "var(--text-color)" }}>
          <Typography fontSize={13} fontWeight={800} color="#fff" flex={1}>
            {dirtyIds.length} unsaved {dirtyIds.length === 1 ? "change" : "changes"}
          </Typography>
          <Button onClick={() => setEdits({})} disabled={savingAll}
            startIcon={<UndoRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, color: "#fff", opacity: 0.75 }}>
            Discard
          </Button>
          <Button onClick={() => saveIds(dirtyIds)} disabled={savingAll}
            startIcon={savingAll ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <SaveRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{ ...primaryBtn, px: 2.5 }}>
            {savingAll ? "Saving…" : "Save changes"}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}

const fld = {
  "& .MuiOutlinedInput-root": { borderRadius: "var(--radius)" },
  "& label.Mui-focused": { color: "var(--primary-color)" },
  "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "var(--primary-color)" },
};
const primaryBtn = {
  textTransform: "none", fontWeight: 800, fontSize: 13, px: 2, whiteSpace: "nowrap",
  borderRadius: "var(--radius-pill)", color: "#fff", backgroundColor: "var(--primary-color)",
  "&:hover": { backgroundColor: "#e34100" },
  "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" },
};
const tag = { height: 15, fontSize: 9.5, fontWeight: 800 };

const Th = ({ children, w, flex, right }) => (
  <Typography sx={{ width: w, flex: flex ? 1 : undefined, textAlign: right ? "right" : "left",
                    pr: right ? 0.5 : 0, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: 0.4, color: "var(--text-color-secondary)" }}>
    {children}
  </Typography>
);

const Field = ({ label, children }) => (
  <Stack gap={0.35} sx={{ flex: "1 1 92px", minWidth: 0 }}>
    <Typography fontSize={9.5} fontWeight={800} textTransform="uppercase" letterSpacing={0.4} color="var(--text-color-trinary)">
      {label}
    </Typography>
    {children}
  </Stack>
);

const Readout = ({ children, accent, muted }) => (
  <Typography fontSize={13} fontWeight={800} sx={{ py: 0.35 }}
    color={muted ? "var(--text-color-trinary)" : accent ? "var(--primary-color)" : "var(--text-color)"}>
    {children}
  </Typography>
);

const Num = ({ value, onChange, placeholder }) => (
  <InputBase
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    inputProps={{ inputMode: "decimal", style: { textAlign: "right" } }}
    sx={{ width: "100%", fontSize: 13, px: 1, py: 0.35, borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)", backgroundColor: "var(--surface)",
          "&.Mui-focused": { borderColor: "var(--primary-color)", boxShadow: "0 0 0 2px var(--primary-soft)" } }}
  />
);
