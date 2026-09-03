"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Stack, Box, Typography, InputBase, TextField, Button, MenuItem, Chip,
  CircularProgress, useMediaQuery,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

/**
 * Wholesale stock and rates.
 *
 * Three numbers per product and nothing else, because wholesale is a separate
 * trade from the shop: a box rate, how many boxes a case holds, and how many
 * cases are left. A product reaches the dealer list only once it has a rate
 * and stock, so filling nothing in here keeps an item off it entirely - and
 * dropping stock to zero takes it straight back off.
 */

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const PAGE = 60;
const FILTERS = [
  { key: "listed", label: "On the dealer list" },
  { key: "all", label: "All products" },
  { key: "nostock", label: "Out of stock" },
];

export default function Wholesale({ catalogue, loading, onReload, onToast }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [filter, setFilter] = useState(null);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState(null);
  const [shown, setShown] = useState(PAGE);
  const compact = useMediaQuery("(max-width:900px)", { noSsr: true });

  // Same rule the dealer page applies, so the screen cannot offer to list a
  // product that would never appear on it.
  const OWN_BRAND = /^Sankamithra\s*/i;
  const products = (catalogue?.products || []).filter((p) => OWN_BRAND.test(p.plSection || ""));
  const categories = [...new Set(products.map((p) => (p.plSection || "").replace(OWN_BRAND, "").trim()).filter(Boolean))].sort();

  const isListed = (p) => p.wsBoxRate > 0 && p.wsStock > 0;

  // Nothing on the list yet means the shop is here to fill it in, so start on
  // the full catalogue - opening on an empty filtered view reads as broken.
  const liveNow = products.filter(isListed).length;
  const effective = filter ?? (liveNow ? "listed" : "all");

  useEffect(() => {
    fetch("/api/admin/wholesale").then((r) => r.json()).then(setLink).catch(() => {});
  }, []);
  useEffect(() => { setShown(PAGE); }, [q, cat, effective]);


  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "All" && (p.plSection || "").replace(OWN_BRAND, "").trim() !== cat) return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      if (effective === "listed" && !isListed(p)) return false;
      if (effective === "nostock" && !(p.wsBoxRate > 0 && !(p.wsStock > 0))) return false;
      return true;
    });
  }, [products, q, cat, effective]);

  const liveCount = products.filter(isListed).length;

  const valueOf = (p, f) => {
    const e = edits[p.id];
    if (e && e[f] !== undefined) return e[f];
    return p[f] == null ? "" : String(p[f]);
  };
  const setField = (id, f, v) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [f]: v.replace(/[^0-9.]/g, "") } }));

  const dirtyIds = Object.keys(edits).map(Number);

  async function saveAll() {
    setSaving(true);
    let ok = 0;
    try {
      for (const id of dirtyIds) {
        const p = products.find((x) => x.id === id);
        if (!p) continue;
        const e = edits[id] || {};
        const num = (v) => (v === "" || v == null ? null : Number(v));
        const res = await fetch(`/api/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wsBoxRate: num(e.wsBoxRate ?? p.wsBoxRate),
            wsCase: num(e.wsCase ?? p.wsCase),
            wsStock: num(e.wsStock ?? p.wsStock),
          }),
        });
        if (res.ok) { ok++; setEdits((prev) => { const n = { ...prev }; delete n[id]; return n; }); }
      }
      onToast(ok === dirtyIds.length ? `${ok} saved` : `${ok} of ${dirtyIds.length} saved`, ok === dirtyIds.length ? "success" : "error");
      onReload();
    } finally { setSaving(false); }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(link.url); onToast("Dealer link copied"); }
    catch { onToast("Could not copy — select the link and copy it", "error"); }
  };

  const visible = rows.slice(0, shown);

  return (
    <Stack gap={1.5} sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
      {/* The link is the product here: it is what the shop actually hands out. */}
      <Stack gap={1} flexShrink={0}
        sx={{ p: 1.5, borderRadius: "var(--radius)", backgroundColor: "var(--text-color)" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
          <Typography fontSize={12} fontWeight={800} color="#fff" sx={{ opacity: 0.75 }}>
            DEALER LINK · {liveCount} {liveCount === 1 ? "item" : "items"} showing
          </Typography>
          {link && (
            <Stack direction="row" gap={0.75} flexWrap="wrap">
              <Mini onClick={copy} icon={<ContentCopyRoundedIcon sx={{ fontSize: 14 }} />} label="Copy" />
              <Mini href={link.path} icon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />} label="Open" />
              <Mini href={`https://wa.me/?text=${encodeURIComponent(`Sankamithra wholesale price list: ${link.url}`)}`}
                icon={<WhatsAppIcon sx={{ fontSize: 14 }} />} label="Share" />
            </Stack>
          )}
        </Stack>
        <Typography fontSize={12.5} color="#fff" sx={{ wordBreak: "break-all", opacity: 0.9, fontFamily: "monospace" }}>
          {link ? link.url : "…"}
        </Typography>
        <Typography fontSize={11} color="#fff" sx={{ opacity: 0.55 }}>
          Anyone with this link can see the list. It is not linked from the site and search engines are told to skip it.
        </Typography>
      </Stack>

      <Stack direction={{ xs: "column", lg: "row" }} gap={1.25} alignItems={{ lg: "center" }} flexShrink={0} sx={{ minWidth: 0 }}>
        <Stack direction="row" alignItems="center" gap={1}
          sx={{ flex: 1, px: 1.5, py: 0.75, borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
          <SearchRoundedIcon sx={{ fontSize: 18, color: "var(--text-color-trinary)" }} />
          <InputBase placeholder="Search a product…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flex: 1, fontSize: 14 }} />
        </Stack>
        <TextField select size="small" value={cat} onChange={(e) => setCat(e.target.value)} sx={{ minWidth: 180, ...fld }}>
          <MenuItem value="All">All ranges</MenuItem>
          {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
      </Stack>

      <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center" flexShrink={0}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} size="small" onClick={() => setFilter(f.key)}
            sx={{ fontWeight: 800, fontSize: 11.5, cursor: "pointer",
                  backgroundColor: effective === f.key ? "var(--primary-color)" : "var(--surface-muted)",
                  color: effective === f.key ? "#fff" : "var(--text-color-secondary)" }} />
        ))}
        <Typography fontSize={12} color="var(--text-color-secondary)" sx={{ ml: 0.5 }}>{rows.length} shown</Typography>
      </Stack>

      {loading ? (
        <Stack alignItems="center" py={6}><CircularProgress size={22} /></Stack>
      ) : (
        <Stack sx={{ flex: 1, minWidth: 0, minHeight: 0, border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {!compact && (
            <Stack direction="row" gap={1} flexShrink={0}
              sx={{ px: 1.5, py: 1, backgroundColor: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
              <Th w={40}>SL</Th><Th flex>Product</Th><Th w={104} right>Per box ₹</Th><Th w={104} right>Case contents</Th>
              <Th w={104} right>Stock (cases)</Th><Th w={96} right>Case value</Th><Th w={74}>On list</Th>
            </Stack>
          )}

          <Stack sx={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain" }}>
            {visible.length === 0 && (
              <Typography fontSize={13} color="var(--text-color-secondary)" textAlign="center" py={5}>
                {effective === "listed" ? "No products are on the dealer list yet — switch to All products and set a box rate and stock." : "Nothing matches that."}
              </Typography>
            )}

            {visible.map((p) => {
              const rate = valueOf(p, "wsBoxRate"), cs = valueOf(p, "wsCase"), st = valueOf(p, "wsStock");
              const listed = Number(rate) > 0 && Number(st) > 0;
              const caseValue = Number(rate) > 0 && Number(cs) > 0 ? Math.round(Number(rate) * Number(cs)) : null;
              const dirty = Boolean(edits[p.id]);

              const name = (
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontSize={13} fontWeight={700} color="var(--text-color)" noWrap>{p.name}</Typography>
                  <Typography fontSize={10.5} color="var(--text-color-secondary)">
                    {(p.plSection || p.category || "").replace(OWN_BRAND, "").trim()}
                  </Typography>
                </Box>
              );
              const badge = (
                <Chip label={listed ? "Listed" : "Hidden"} size="small"
                  sx={{ height: 17, fontSize: 9.5, fontWeight: 800,
                        backgroundColor: listed ? "var(--success-soft, #e7f7ee)" : "var(--surface-muted)",
                        color: listed ? "var(--success-ink, #1b7f4d)" : "var(--text-color-trinary)" }} />
              );

              if (compact) {
                return (
                  <Stack key={p.id} gap={1} sx={{ p: 1.25, borderBottom: "1px solid var(--border)",
                        backgroundColor: dirty ? "var(--primary-soft)" : "transparent" }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography fontSize={11} color="var(--text-color-trinary)" sx={{ width: 26 }}>
                        {p.sortOrder != null && p.sortOrder < 1000 ? p.sortOrder : "—"}
                      </Typography>
                      {name}{badge}
                    </Stack>
                    <Stack direction="row" gap={1} flexWrap="wrap" sx={{ minWidth: 0 }}>
                      <F label="Per box ₹"><Num value={rate} onChange={(v) => setField(p.id, "wsBoxRate", v)} /></F>
                      <F label="Case contents"><Num value={cs} onChange={(v) => setField(p.id, "wsCase", v)} /></F>
                      <F label="Stock (cases)"><Num value={st} onChange={(v) => setField(p.id, "wsStock", v)} /></F>
                    </Stack>
                    {caseValue && (
                      <Typography fontSize={11} color="var(--text-color-secondary)">Full case {inr(caseValue)}</Typography>
                    )}
                  </Stack>
                );
              }

              return (
                <Stack key={p.id} direction="row" gap={1} alignItems="center"
                  sx={{ px: 1.5, py: 0.75, borderBottom: "1px solid var(--border)",
                        backgroundColor: dirty ? "var(--primary-soft)" : "transparent" }}>
                  <Typography sx={{ width: 40, fontSize: 11.5, color: "var(--text-color-trinary)" }}>
                    {p.sortOrder != null && p.sortOrder < 1000 ? p.sortOrder : "—"}
                  </Typography>
                  {name}
                  <Box sx={{ width: 104 }}><Num value={rate} onChange={(v) => setField(p.id, "wsBoxRate", v)} /></Box>
                  <Box sx={{ width: 104 }}><Num value={cs} onChange={(v) => setField(p.id, "wsCase", v)} /></Box>
                  <Box sx={{ width: 104 }}><Num value={st} onChange={(v) => setField(p.id, "wsStock", v)} /></Box>
                  <Box sx={{ width: 96, textAlign: "right", pr: 0.5 }}>
                    <Typography fontSize={13} fontWeight={800} color={caseValue ? "var(--text-color)" : "var(--text-color-trinary)"}>
                      {caseValue ? inr(caseValue) : "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ width: 74 }}>{badge}</Box>
                </Stack>
              );
            })}

            {shown < rows.length && (
              <Button onClick={() => setShown((n) => n + PAGE)}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, py: 1.5, color: "var(--primary-color)" }}>
                Show {Math.min(PAGE, rows.length - shown)} more
              </Button>
            )}
          </Stack>
        </Stack>
      )}

      {dirtyIds.length > 0 && (
        <Stack direction="row" alignItems="center" gap={1.5} flexShrink={0}
          sx={{ px: 1.75, py: 1.25, borderRadius: "var(--radius)", backgroundColor: "var(--text-color)" }}>
          <Typography fontSize={13} fontWeight={800} color="#fff" flex={1}>
            {dirtyIds.length} unsaved {dirtyIds.length === 1 ? "change" : "changes"}
          </Typography>
          <Button onClick={() => setEdits({})} disabled={saving} startIcon={<UndoRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, color: "#fff", opacity: 0.75 }}>
            Discard
          </Button>
          <Button onClick={saveAll} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <SaveRoundedIcon sx={{ fontSize: 16 }} />}
            sx={primaryBtn}>
            {saving ? "Saving…" : "Save changes"}
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
  textTransform: "none", fontWeight: 800, fontSize: 13, px: 2.5, whiteSpace: "nowrap",
  borderRadius: "var(--radius-pill)", color: "#fff", backgroundColor: "var(--primary-color)",
  "&:hover": { backgroundColor: "#e34100" },
  "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" },
};
const Th = ({ children, w, flex, right }) => (
  <Typography sx={{ width: w, flex: flex ? 1 : undefined, textAlign: right ? "right" : "left", pr: right ? 0.5 : 0,
                    fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4,
                    color: "var(--text-color-secondary)" }}>{children}</Typography>
);
const F = ({ label, children }) => (
  <Stack gap={0.35} sx={{ flex: "1 1 96px", minWidth: 0 }}>
    <Typography fontSize={9.5} fontWeight={800} textTransform="uppercase" letterSpacing={0.4} color="var(--text-color-trinary)">{label}</Typography>
    {children}
  </Stack>
);
const Num = ({ value, onChange }) => (
  <InputBase value={value} placeholder="—" onChange={(e) => onChange(e.target.value)}
    inputProps={{ inputMode: "decimal", style: { textAlign: "right" } }}
    sx={{ width: "100%", fontSize: 13, px: 1, py: 0.35, borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)", backgroundColor: "var(--surface)",
          "&.Mui-focused": { borderColor: "var(--primary-color)", boxShadow: "0 0 0 2px var(--primary-soft)" } }} />
);
const Mini = ({ onClick, href, icon, label }) => (
  <Stack component={href ? "a" : "button"} onClick={onClick} href={href}
    {...(href ? { target: "_blank", rel: "noopener noreferrer" } : { type: "button" })}
    direction="row" alignItems="center" gap={0.5}
    sx={{ px: 1.25, py: 0.5, borderRadius: "var(--radius-pill)", border: 0, cursor: "pointer",
          backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11.5, fontWeight: 800,
          textDecoration: "none", "&:hover": { backgroundColor: "rgba(255,255,255,0.25)" } }}>
    {icon}{label}
  </Stack>
);
