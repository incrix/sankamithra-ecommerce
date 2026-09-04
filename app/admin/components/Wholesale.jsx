"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Stack, Box, Typography, InputBase, TextField, Button, MenuItem, Chip,
  CircularProgress, useMediaQuery,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { assetUrl } from "@/util/config";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import WholesalePhoto from "./WholesalePhoto";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

/**
 * The 2026 dealer price list.
 *
 * Names, codes and pack sizes are the printed list and are not editable here -
 * they should change when the list is reprinted, not by hand. What moves day
 * to day is stock, and that is the switch the public page reads: an explicit
 * zero takes an item off the dealer list, blank leaves it on and untracked.
 */

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const PAGE = 60;
const FILTERS = [
  { key: "all", label: "All" },
  { key: "listed", label: "Showing to dealers" },
  { key: "hidden", label: "Out of stock" },
  { key: "noimage", label: "No photo" },
];

export default function Wholesale({ onToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sec, setSec] = useState("All");
  const [filter, setFilter] = useState("all");
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [matching, setMatching] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [photoFor, setPhotoFor] = useState(null);
  const compact = useMediaQuery("(max-width:900px)", { noSsr: true });

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/wholesale", { cache: "no-store" });
      setData(await r.json());
    } catch { onToast("Could not load the wholesale list", "error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);            // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setShown(PAGE); }, [q, sec, filter]);

  const items = useMemo(() => data?.items || [], [data]);
  const sections = [...new Set(items.map((i) => i.section))];
  const isListed = (i) => i.active !== false && i.stock !== 0;
  const liveCount = items.filter(isListed).length;

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((i) => {
      if (sec !== "All" && i.section !== sec) return false;
      if (term && !i.name.toLowerCase().includes(term) && !i.code.toLowerCase().includes(term)) return false;
      if (filter === "listed" && !isListed(i)) return false;
      if (filter === "hidden" && isListed(i)) return false;
      if (filter === "noimage" && i.image) return false;
      return true;
    });
  }, [items, q, sec, filter]);

  const valueOf = (i, f) => {
    const e = edits[i.code];
    if (e && e[f] !== undefined) return e[f];
    return i[f] == null ? "" : String(i[f]);
  };
  const setField = (code, f, v) =>
    setEdits((prev) => ({ ...prev, [code]: { ...prev[code], [f]: v.replace(/[^0-9.]/g, "") } }));

  const dirty = Object.keys(edits);

  async function saveAll() {
    setSaving(true);
    let ok = 0;
    try {
      for (const code of dirty) {
        const e = edits[code];
        const res = await fetch("/api/admin/wholesale", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, ...e }),
        });
        if (res.ok) ok++;
      }
      setEdits({});
      onToast(ok === dirty.length ? `${ok} saved` : `${ok} of ${dirty.length} saved`, ok === dirty.length ? "success" : "error");
      load();
    } finally { setSaving(false); }
  }

  async function matchImages() {
    setMatching(true);
    try {
      const res = await fetch("/api/admin/wholesale", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "matchImages" }),
      });
      const d = await res.json();
      onToast(`Photos matched for ${d.matched} of ${d.total} items`);
      load();
    } catch { onToast("Could not match photos", "error"); }
    finally { setMatching(false); }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(data.url); onToast("Dealer link copied"); }
    catch { onToast("Could not copy — select the link and copy it", "error"); }
  };

  const visible = rows.slice(0, shown);
  const withPhoto = items.filter((i) => i.image).length;

  return (
    <Stack gap={1.5} sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
      <Stack gap={1} flexShrink={0} sx={{ p: 1.5, borderRadius: "var(--radius)", backgroundColor: "var(--text-color)" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
          <Typography fontSize={12} fontWeight={800} color="#fff" sx={{ opacity: 0.75 }}>
            DEALER LINK · {liveCount} of {items.length} showing · {withPhoto} with photos
          </Typography>
          {data && (
            <Stack direction="row" gap={0.75} flexWrap="wrap">
              <Mini onClick={copy} icon={<ContentCopyRoundedIcon sx={{ fontSize: 14 }} />} label="Copy" />
              <Mini href={data.path} icon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />} label="Open" />
              <Mini href={`https://wa.me/?text=${encodeURIComponent(`Sankamithra wholesale price list: ${data.url}`)}`}
                icon={<WhatsAppIcon sx={{ fontSize: 14 }} />} label="Share" />
              <Mini onClick={matchImages} busy={matching} icon={<ImageRoundedIcon sx={{ fontSize: 14 }} />} label="Match photos" />
            </Stack>
          )}
        </Stack>
        <Typography fontSize={12.5} color="#fff" sx={{ wordBreak: "break-all", opacity: 0.9, fontFamily: "monospace" }}>
          {data ? data.url : "…"}
        </Typography>
      </Stack>

      <Stack direction={{ xs: "column", lg: "row" }} gap={1.25} alignItems={{ lg: "center" }} flexShrink={0} sx={{ minWidth: 0 }}>
        <Stack direction="row" alignItems="center" gap={1}
          sx={{ flex: 1, px: 1.5, py: 0.75, borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
          <SearchRoundedIcon sx={{ fontSize: 18, color: "var(--text-color-trinary)" }} />
          <InputBase placeholder="Search name or code…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flex: 1, fontSize: 14 }} />
        </Stack>
        <TextField select size="small" value={sec} onChange={(e) => setSec(e.target.value)} sx={{ minWidth: 220, ...fld }}>
          <MenuItem value="All">All sections</MenuItem>
          {sections.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
      </Stack>

      <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center" flexShrink={0}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} size="small" onClick={() => setFilter(f.key)}
            sx={{ fontWeight: 800, fontSize: 11.5, cursor: "pointer",
                  backgroundColor: filter === f.key ? "var(--primary-color)" : "var(--surface-muted)",
                  color: filter === f.key ? "#fff" : "var(--text-color-secondary)" }} />
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
              <Th w={52}>Code</Th><Th w={64}>Photo</Th>
              <Th flex>Item</Th><Th w={78}>Contents</Th>
              <Th w={92} right>Price ₹</Th><Th w={70} right>Per</Th>
              <Th w={86} right>Cs/Cont</Th><Th w={92} right>Stock</Th><Th w={70}>Status</Th>
            </Stack>
          )}

          <Stack sx={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain" }}>
            {visible.length === 0 && (
              <Typography fontSize={13} color="var(--text-color-secondary)" textAlign="center" py={5}>Nothing matches that.</Typography>
            )}

            {visible.map((i) => {
              const price = valueOf(i, "price"), cq = valueOf(i, "caseQty"), st = valueOf(i, "stock");
              const listed = i.active !== false && Number(st !== "" ? st : 1) !== 0;
              const isDirty = Boolean(edits[i.code]);
              // Clicking the picture is how you change it - the obvious place to
              // reach for, and it keeps a per-row button out of the table.
              const thumb = (
                <Box
                  onClick={() => setPhotoFor(i)}
                  role="button"
                  aria-label={`Change photo for ${i.name}`}
                  sx={{ position: "relative", width: 54, height: 54, flexShrink: 0, cursor: "pointer",
                        borderRadius: "var(--radius-sm)", overflow: "hidden",
                        border: "1px solid var(--border)",
                        backgroundColor: i.image ? "#f4f4f4" : "var(--surface-muted)",
                        "&:hover .edit": { opacity: 1 } }}
                >
                  {i.image && (
                    <Box component="img" src={assetUrl(i.image)} alt="" loading="lazy"
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <Stack className="edit" alignItems="center" justifyContent="center"
                    sx={{ position: "absolute", inset: 0, opacity: i.image ? 0 : 1,
                          backgroundColor: i.image ? "rgba(0,0,0,0.45)" : "transparent",
                          transition: "opacity var(--transition)" }}>
                    <EditRoundedIcon sx={{ fontSize: 17, color: i.image ? "#fff" : "var(--text-color-trinary)" }} />
                  </Stack>
                </Box>
              );
              const badge = (
                <Chip label={listed ? "Showing" : "Hidden"} size="small"
                  sx={{ height: 17, fontSize: 9.5, fontWeight: 800,
                        backgroundColor: listed ? "var(--success-soft, #e7f7ee)" : "var(--surface-muted)",
                        color: listed ? "var(--success-ink, #1b7f4d)" : "var(--text-color-trinary)" }} />
              );

              if (compact) {
                return (
                  <Stack key={i.code} gap={1} sx={{ p: 1.25, borderBottom: "1px solid var(--border)",
                        backgroundColor: isDirty ? "var(--primary-soft)" : "transparent" }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      {thumb}
                      <Box flex={1} minWidth={0}>
                        <Typography fontSize={13} fontWeight={700} color="var(--text-color)" noWrap>{i.name}</Typography>
                        <Typography fontSize={10.5} color="var(--text-color-secondary)">{i.code} · {i.section}</Typography>
                      </Box>
                      {badge}
                    </Stack>
                    <Stack direction="row" gap={1} flexWrap="wrap" sx={{ minWidth: 0 }}>
                      <F label={`Price / ${i.per}`}><Num value={price} onChange={(v) => setField(i.code, "price", v)} /></F>
                      <F label={`Cs/Cont (${i.caseUnit})`}><Num value={cq} onChange={(v) => setField(i.code, "caseQty", v)} /></F>
                      <F label="Stock (cases)"><Num value={st} onChange={(v) => setField(i.code, "stock", v)} /></F>
                    </Stack>
                  </Stack>
                );
              }

              return (
                <Stack key={i.code} direction="row" gap={1} alignItems="center"
                  sx={{ px: 1.5, py: 0.6, borderBottom: "1px solid var(--border)",
                        backgroundColor: isDirty ? "var(--primary-soft)" : "transparent" }}>
                  <Typography sx={{ width: 52, fontSize: 11, fontFamily: "monospace", color: "var(--text-color-trinary)" }}>{i.code}</Typography>
                  <Box sx={{ width: 64 }}>{thumb}</Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontSize={13} fontWeight={700} color="var(--text-color)" noWrap>{i.name}</Typography>
                    <Typography fontSize={10.5} color="var(--text-color-secondary)" noWrap>{i.section}</Typography>
                  </Box>
                  <Typography sx={{ width: 78, fontSize: 12, color: "var(--text-color-secondary)" }}>{i.contents || "—"}</Typography>
                  <Box sx={{ width: 92 }}><Num value={price} onChange={(v) => setField(i.code, "price", v)} /></Box>
                  <Typography sx={{ width: 70, fontSize: 11.5, textAlign: "right", color: "var(--text-color-secondary)" }}>{i.per}</Typography>
                  <Box sx={{ width: 86 }}><Num value={cq} onChange={(v) => setField(i.code, "caseQty", v)} suffix={i.caseUnit} /></Box>
                  <Box sx={{ width: 92 }}><Num value={st} onChange={(v) => setField(i.code, "stock", v)} /></Box>
                  <Box sx={{ width: 70 }}>{badge}</Box>
                </Stack>
              );
            })}

            {shown < rows.length && (
              <Button onClick={() => setShown((n) => n + PAGE)}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, py: 1.5, color: "var(--primary-color)" }}>
                Show {Math.min(PAGE, rows.length - shown)} more
              </Button>
            )}
            <Typography fontSize={11} color="var(--text-color-secondary)" sx={{ px: 1.5, py: 1.25 }}>
              Stock blank = listed, not counted. Stock 0 = taken off the dealer list.
            </Typography>
          </Stack>
        </Stack>
      )}

      {photoFor && (
        <WholesalePhoto item={photoFor} onClose={() => setPhotoFor(null)} onSaved={load} onToast={onToast} />
      )}

      {dirty.length > 0 && (
        <Stack direction="row" alignItems="center" gap={1.5} flexShrink={0}
          sx={{ px: 1.75, py: 1.25, borderRadius: "var(--radius)", backgroundColor: "var(--text-color)" }}>
          <Typography fontSize={13} fontWeight={800} color="#fff" flex={1}>
            {dirty.length} unsaved {dirty.length === 1 ? "change" : "changes"}
          </Typography>
          <Button onClick={() => setEdits({})} disabled={saving} startIcon={<UndoRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, color: "#fff", opacity: 0.75 }}>Discard</Button>
          <Button onClick={saveAll} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <SaveRoundedIcon sx={{ fontSize: 16 }} />}
            sx={primaryBtn}>{saving ? "Saving…" : "Save changes"}</Button>
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
                    fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4,
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
    sx={{ width: "100%", fontSize: 13, px: 1, py: 0.3, borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)", backgroundColor: "var(--surface)",
          "&.Mui-focused": { borderColor: "var(--primary-color)", boxShadow: "0 0 0 2px var(--primary-soft)" } }} />
);
const Mini = ({ onClick, href, icon, label, busy }) => (
  <Stack component={href ? "a" : "button"} onClick={onClick} href={href}
    {...(href ? { target: "_blank", rel: "noopener noreferrer" } : { type: "button", disabled: busy })}
    direction="row" alignItems="center" gap={0.5}
    sx={{ px: 1.25, py: 0.5, borderRadius: "var(--radius-pill)", border: 0, cursor: "pointer",
          backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11.5, fontWeight: 800,
          textDecoration: "none", opacity: busy ? 0.6 : 1,
          "&:hover": { backgroundColor: "rgba(255,255,255,0.25)" } }}>
    {busy ? <CircularProgress size={12} sx={{ color: "#fff" }} /> : icon}{label}
  </Stack>
);
