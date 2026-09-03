"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, Stack, Box, Typography, Button, InputBase, CircularProgress, IconButton,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { assetUrl } from "@/util/config";

/**
 * Sets the photograph for one dealer-list item.
 *
 * Two ways in, because the two cases are different: most lines are also sold
 * in the shop and should simply reuse that photograph, while the new 2026
 * items have none anywhere and need one uploading. Borrowing is offered first
 * since it is the common case and costs nothing.
 */
export default function WholesalePhoto({ item, onClose, onSaved, onToast }) {
  const [q, setQ] = useState("");
  const [products, setProducts] = useState(null);
  const [busy, setBusy] = useState(false);
  const file = useRef(null);

  useEffect(() => {
    fetch("/api/products?all=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setProducts((d.products || []).filter((p) => p.image?.[0])))
      .catch(() => setProducts([]));
  }, []);

  // Seeded with the item's own name, so the photo it needs is usually the
  // first thing on screen rather than something to go hunting for.
  useEffect(() => { setQ(item?.name?.replace(/\s*\([^)]*\)/g, "").trim() || ""); }, [item]);

  const matches = useMemo(() => {
    if (!products) return [];
    const term = q.trim().toLowerCase();
    if (!term) return products.slice(0, 60);
    const words = term.split(/\s+/).filter(Boolean);
    return products
      .map((p) => {
        const n = p.name.toLowerCase();
        return { p, hits: words.filter((w) => n.includes(w)).length };
      })
      .filter((x) => x.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 60)
      .map((x) => x.p);
  }, [products, q]);

  async function save(image) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/wholesale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: item.code, image }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not save");
      onToast(image ? "Photo updated" : "Photo removed");
      onSaved();
      onClose();
    } catch (err) {
      onToast(err.message, "error");
    } finally { setBusy(false); }
  }

  async function upload(f) {
    if (!f) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", f);
      const res = await fetch("/api/products/upload", { method: "POST", body });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Upload failed");
      await save(d.path);
    } catch (err) {
      onToast(err.message, "error");
      setBusy(false);
    } finally { if (file.current) file.current.value = ""; }
  }

  if (!item) return null;

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm"
      PaperProps={{ sx: { borderRadius: "var(--radius)" } }}>
      <Stack sx={{ p: 2, gap: 1.5 }}>
        <Stack direction="row" alignItems="flex-start" gap={1}>
          <Stack flex={1} minWidth={0}>
            <Typography fontSize={15} fontWeight={800} color="var(--text-color)">Photo</Typography>
            <Typography fontSize={12.5} color="var(--text-color-secondary)" noWrap>
              {item.code} · {item.name}
            </Typography>
          </Stack>
          <IconButton size="small" onClick={onClose} disabled={busy}><CloseRoundedIcon sx={{ fontSize: 18 }} /></IconButton>
        </Stack>

        <Stack direction="row" gap={1.5} alignItems="center"
          sx={{ p: 1.25, borderRadius: "var(--radius)", backgroundColor: "var(--surface-muted)" }}>
          <Box sx={{ width: 84, height: 84, borderRadius: "var(--radius)", overflow: "hidden",
                     backgroundColor: "#fff", border: "1px solid var(--border)", flexShrink: 0 }}>
            {item.image
              ? <Box component="img" src={assetUrl(item.image)} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <Stack alignItems="center" justifyContent="center" height="100%">
                  <Typography fontSize={9.5} color="var(--text-color-trinary)">none</Typography>
                </Stack>}
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap" flex={1}>
            <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden
              onChange={(e) => upload(e.target.files?.[0])} />
            <Button onClick={() => file.current?.click()} disabled={busy}
              startIcon={busy ? <CircularProgress size={13} sx={{ color: "inherit" }} /> : <FileUploadRoundedIcon sx={{ fontSize: 16 }} />}
              sx={primaryBtn}>Upload</Button>
            {item.image && (
              <Button onClick={() => save(null)} disabled={busy}
                startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: 12.5, color: "var(--danger, #d33)" }}>
                Remove
              </Button>
            )}
          </Stack>
        </Stack>

        <Typography fontSize={11.5} fontWeight={800} textTransform="uppercase" letterSpacing={0.4}
          color="var(--text-color-secondary)">
          Or use a photo from the shop
        </Typography>

        <Stack direction="row" alignItems="center" gap={1}
          sx={{ px: 1.5, py: 0.75, borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
          <SearchRoundedIcon sx={{ fontSize: 18, color: "var(--text-color-trinary)" }} />
          <InputBase placeholder="Search shop products…" value={q} onChange={(e) => setQ(e.target.value)}
            sx={{ flex: 1, fontSize: 14 }} />
          {q && <Button size="small" onClick={() => setQ("")} sx={{ minWidth: 0, fontSize: 11, color: "var(--text-color-trinary)" }}>clear</Button>}
        </Stack>

        {products === null ? (
          <Stack alignItems="center" py={3}><CircularProgress size={20} /></Stack>
        ) : matches.length === 0 ? (
          <Typography fontSize={13} color="var(--text-color-secondary)" textAlign="center" py={3}>
            No shop product matches that.
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 1, maxHeight: 340, overflowY: "auto",
                     gridTemplateColumns: "repeat(auto-fill,minmax(124px,1fr))" }}>
            {matches.map((p) => (
              <Stack key={p.id} onClick={() => !busy && save(p.image[0])}
                sx={{ cursor: busy ? "default" : "pointer", borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)", overflow: "hidden",
                      "&:hover": { borderColor: "var(--primary-color)" } }}>
                <Box component="img" src={assetUrl(p.image[0])} alt="" loading="lazy"
                  sx={{ width: "100%", height: 104, objectFit: "cover", backgroundColor: "#f6f6f6" }} />
                <Typography fontSize={10} color="var(--text-color-secondary)" noWrap sx={{ px: 0.5, py: 0.5 }}>
                  {p.name}
                </Typography>
              </Stack>
            ))}
          </Box>
        )}
      </Stack>
    </Dialog>
  );
}

const primaryBtn = {
  textTransform: "none", fontWeight: 800, fontSize: 12.5, px: 2,
  borderRadius: "var(--radius-pill)", color: "#fff", backgroundColor: "var(--primary-color)",
  "&:hover": { backgroundColor: "#e34100" },
  "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" },
};
