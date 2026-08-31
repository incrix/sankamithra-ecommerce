"use client";
import {
  Stack, Box, Typography, TextField, Button, IconButton, MenuItem, Divider, Chip, Slider,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import { useState } from "react";

const panel = {
  p: { xs: 2, md: 2.5 },
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  backgroundColor: "var(--surface)",
};

/** Category management, and the bulk discount tool used to run a sale. */
export default function Categories({ catalogue, onReload, onToast }) {
  const products = catalogue?.products || [];
  const categories = catalogue?.categories || [];

  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [renameTo, setRenameTo] = useState("");
  const [busy, setBusy] = useState(false);

  const [saleScope, setSaleScope] = useState("All");
  const [salePct, setSalePct] = useState(58);

  const count = (c) => products.filter((p) => p.category === c).length;

  const call = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const add = () =>
    call(async () => {
      const res = await fetch("/api/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return onToast(d.error || "Could not add", "error");
      onToast(`Category "${newName}" added`, "success");
      setNewName("");
      onReload();
    });

  const rename = (from) =>
    call(async () => {
      const res = await fetch("/api/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, name: renameTo }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return onToast(d.error || "Could not rename", "error");
      onToast(`Renamed to "${renameTo}"`, "success");
      setRenaming(null);
      onReload();
    });

  const remove = (name) =>
    call(async () => {
      const res = await fetch(`/api/categories?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      // Refused when products still use it, rather than orphaning them.
      if (!res.ok) return onToast(d.error || "Could not delete", "error");
      onToast(`"${name}" removed`, "success");
      onReload();
    });

  const runSale = () =>
    call(async () => {
      const res = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulkDiscount",
          discount: salePct,
          category: saleScope === "All" ? undefined : saleScope,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return onToast(d.error || "Could not apply", "error");
      onToast(`${salePct}% applied to ${d.changed} product${d.changed === 1 ? "" : "s"}`, "success");
      onReload();
    });

  const affected = saleScope === "All" ? products.length : count(saleScope);

  return (
    <Stack gap={2} sx={{ flex: 1, minHeight: 0, overflowY: { md: "auto" }, pr: { md: 0.5 } }}>
      <Typography fontSize={12.5} fontWeight={700} color="var(--text-color-secondary)" flexShrink={0}>
        {categories.length} categories across {products.length} products
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
        {/* Categories */}
        <Stack gap={1.5} sx={panel}>
          <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Categories</Typography>

          <Stack direction="row" gap={1}>
            <TextField size="small" fullWidth placeholder="New category name" value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newName.trim() && add()}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "var(--radius)" } }} />
            <Button onClick={add} disabled={busy || !newName.trim()} startIcon={<AddRoundedIcon />}
              sx={{ textTransform: "none", fontWeight: 800, fontSize: 13, px: 2, borderRadius: "var(--radius)", flexShrink: 0,
                    color: "#fff", backgroundColor: "var(--primary-color)", "&:hover": { backgroundColor: "var(--primary-dark)" },
                    "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" } }}>
              Add
            </Button>
          </Stack>

          <Divider />

          <Stack gap={0.75}>
            {categories.map((c) => (
              <Stack key={c} direction="row" alignItems="center" gap={1}
                sx={{ p: 1, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                {renaming === c ? (
                  <>
                    <TextField size="small" fullWidth value={renameTo} autoFocus
                      onChange={(e) => setRenameTo(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && rename(c)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "var(--radius-sm)" } }} />
                    <IconButton size="small" onClick={() => rename(c)} aria-label="save name"
                      sx={{ color: "var(--success)" }}><CheckRoundedIcon sx={{ fontSize: 18 }} /></IconButton>
                  </>
                ) : (
                  <>
                    <Typography flex={1} fontSize={13.5} fontWeight={700} color="var(--text-color)">{c}</Typography>
                    <Chip label={`${count(c)} products`} size="small"
                      sx={{ height: 20, fontSize: 10.5, fontWeight: 700, backgroundColor: "var(--surface-muted)", color: "var(--text-color-secondary)" }} />
                    <IconButton size="small" onClick={() => { setRenaming(c); setRenameTo(c); }} aria-label={`rename ${c}`}
                      sx={{ color: "var(--text-color-secondary)", "&:hover": { color: "var(--primary-color)" } }}>
                      <EditRoundedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => remove(c)} aria-label={`delete ${c}`}
                      sx={{ color: "var(--text-color-trinary)", "&:hover": { color: "var(--danger)" } }}>
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </>
                )}
              </Stack>
            ))}
          </Stack>
        </Stack>

        {/* Sale */}
        <Stack gap={2} sx={{ ...panel, alignSelf: "flex-start" }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <LocalOfferRoundedIcon sx={{ color: "var(--primary-color)", fontSize: 19 }} />
            <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Run a discount sale</Typography>
          </Stack>
          <Typography fontSize={12.5} color="var(--text-color-secondary)" lineHeight={1.6}>
            Sets the same discount percentage across a whole category, or the entire
            catalogue. This overwrites existing discounts on the products it touches.
          </Typography>

          <TextField select size="small" fullWidth label="Apply to" value={saleScope}
            onChange={(e) => setSaleScope(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "var(--radius)" } }}>
            <MenuItem value="All" sx={{ fontSize: 14 }}>Every product ({products.length})</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c} value={c} sx={{ fontSize: 14 }}>{c} ({count(c)})</MenuItem>
            ))}
          </TextField>

          <Stack gap={0.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography fontSize={12.5} fontWeight={700} color="var(--text-color)">Discount</Typography>
              <Typography fontSize={19} fontWeight={800} color="var(--primary-color)">{salePct}%</Typography>
            </Stack>
            <Slider value={salePct} onChange={(_, v) => setSalePct(v)} min={0} max={95} step={1}
              sx={{ color: "var(--primary-color)", "& .MuiSlider-thumb": { width: 16, height: 16 } }} />
          </Stack>

          <Box sx={{ p: 1.5, borderRadius: "var(--radius)", backgroundColor: "var(--warning-soft)" }}>
            <Typography fontSize={12} fontWeight={700} color="var(--warning)">
              This will change the price of {affected} product{affected === 1 ? "" : "s"}.
            </Typography>
          </Box>

          <Button onClick={runSale} disabled={busy}
            sx={{ textTransform: "none", fontWeight: 800, fontSize: 14, py: 1.15, borderRadius: "var(--radius)",
                  color: "#fff", backgroundColor: "var(--primary-color)", "&:hover": { backgroundColor: "var(--primary-dark)" },
                  "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" } }}>
            Apply {salePct}% to {affected} product{affected === 1 ? "" : "s"}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
