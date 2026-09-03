"use client";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Box, Typography,
  TextField, MenuItem, Button, IconButton, CircularProgress, Switch, FormControlLabel, Chip,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { useEffect, useRef, useState } from "react";
import { assetUrl } from "@/util/config";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const BLANK = {
  name: "", category: "", price: "", discount: "", countInStock: "",
  sku: "", shortDescription: "", description: "", image: [], active: true, mrp2: "",
};

/**
 * Create or edit one product.
 *
 * The live price preview matters: staff set an MRP and a discount percentage,
 * but what the customer actually pays is the rounded net - showing it here
 * stops surprises after publishing.
 */
export default function ProductEditor({ open, product, categories, onClose, onSaved, onToast }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const isNew = !product?.id;

  useEffect(() => {
    setForm(product ? { ...BLANK, ...product } : BLANK);
  }, [product, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const price = Number(form.price) || 0;
  const discount = Number(form.discount) || 0;
  const net = Math.round(price - (price * discount) / 100);

  const upload = async (files) => {
    const list = [...files].slice(0, 6);
    if (!list.length) return;
    setUploading(true);
    try {
      const added = [];
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/products/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (res.ok) added.push(data.path);
        else onToast(data.error || `Could not upload ${file.name}`, "error");
      }
      if (added.length) setForm((f) => ({ ...f, image: [...(f.image || []), ...added] }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (i) =>
    setForm((f) => ({ ...f, image: f.image.filter((_, x) => x !== i) }));

  /** The first image is the one the grid and cart show, so make it promotable. */
  const makeCover = (i) =>
    setForm((f) => {
      const next = [...f.image];
      const [pick] = next.splice(i, 1);
      return { ...f, image: [pick, ...next] };
    });

  const save = async () => {
    if (!String(form.name).trim()) { onToast("A product name is required", "error"); return; }
    if (!String(form.category).trim()) { onToast("Pick a category", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch(isNew ? "/api/products" : `/api/products/${product.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { onToast(data.error || "Could not save", "error"); return; }
      onToast(isNew ? `${data.product.name} added` : `${data.product.name} updated`, "success");
      onSaved(data.product);
      onClose();
    } catch {
      onToast("Could not reach the server", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"
      PaperProps={{ sx: { borderRadius: "var(--radius-lg)" } }}>
      <DialogTitle sx={{ p: 2, pb: 1.5, borderBottom: "1px solid var(--border)" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography fontSize={17} fontWeight={800} color="var(--text-color)">
            {isNew ? "Add product" : `Edit ${product.name}`}
          </Typography>
          <IconButton onClick={onClose} aria-label="close"><CloseRoundedIcon /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Stack gap={2.5} pt={1}>
          {/* Images */}
          <Stack gap={1}>
            <Typography fontSize={13} fontWeight={800} color="var(--text-color)">
              Images{" "}
              <Box component="span" sx={{ fontWeight: 600, color: "var(--text-color-secondary)" }}>
                — the first one is the cover shown in the shop
              </Box>
            </Typography>

            <Stack direction="row" gap={1} flexWrap="wrap">
              {(form.image || []).map((img, i) => (
                <Box key={`${img}-${i}`} sx={{ position: "relative", width: 92, height: 92 }}>
                  <Box component="img" src={assetUrl(img)} alt=""
                    sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-sm)",
                          border: i === 0 ? "2px solid var(--primary-color)" : "1px solid var(--border)", backgroundColor: "#f6f6f6" }} />
                  {i === 0 && (
                    <Chip label="Cover" size="small"
                      sx={{ position: "absolute", bottom: 4, left: 4, height: 17, fontSize: 9, fontWeight: 800,
                            backgroundColor: "var(--primary-color)", color: "#fff" }} />
                  )}
                  <Stack direction="row" sx={{ position: "absolute", top: 2, right: 2, gap: 0.25 }}>
                    {i !== 0 && (
                      <IconButton size="small" onClick={() => makeCover(i)} aria-label="make cover"
                        sx={{ p: 0.25, backgroundColor: "rgba(255,255,255,.9)", "&:hover": { backgroundColor: "#fff" } }}>
                        <StarRoundedIcon sx={{ fontSize: 14, color: "var(--badge-color)" }} />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => removeImage(i)} aria-label="remove image"
                      sx={{ p: 0.25, backgroundColor: "rgba(255,255,255,.9)", "&:hover": { backgroundColor: "#fff" } }}>
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 14, color: "var(--danger)" }} />
                    </IconButton>
                  </Stack>
                </Box>
              ))}

              <Box
                component="label"
                sx={{
                  width: 92, height: 92, display: "grid", placeItems: "center", cursor: "pointer",
                  border: "1.5px dashed var(--border-strong)", borderRadius: "var(--radius-sm)",
                  color: "var(--text-color-secondary)",
                  "&:hover": { borderColor: "var(--primary-color)", color: "var(--primary-color)", backgroundColor: "var(--primary-softer)" },
                }}
              >
                {uploading ? <CircularProgress size={20} /> : (
                  <Stack alignItems="center" gap={0.5}>
                    <AddPhotoAlternateRoundedIcon sx={{ fontSize: 22 }} />
                    <Typography fontSize={10} fontWeight={700}>Add</Typography>
                  </Stack>
                )}
                <input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple onChange={(e) => upload(e.target.files)} />
              </Box>
            </Stack>
          </Stack>

          {/* Details */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }, gap: 2 }}>
            <Box sx={{ gridColumn: { sm: "span 2" } }}>
              <TextField fullWidth size="small" label="Product name" value={form.name} onChange={set("name")} sx={fld} />
            </Box>

            <TextField select fullWidth size="small" label="Category" value={form.category} onChange={set("category")} sx={fld}>
              {categories.map((c) => <MenuItem key={c} value={c} sx={{ fontSize: 14 }}>{c}</MenuItem>)}
            </TextField>

            <TextField fullWidth size="small" label="SKU" value={form.sku} onChange={set("sku")} sx={fld} />

            <TextField fullWidth size="small" label="MRP (₹)" value={form.price} onChange={set("price")}
              inputProps={{ inputMode: "numeric" }} sx={fld} />

            <TextField fullWidth size="small" label="Discount (%)" value={form.discount} onChange={set("discount")}
              inputProps={{ inputMode: "numeric" }} sx={fld}
              helperText={price > 0 ? `Customer pays ${inr(net)} — saving ${inr(price - net)}` : " "} />

            <TextField fullWidth size="small" label="Pricelist 2 MRP (₹)" value={form.mrp2 ?? ""} onChange={set("mrp2")}
              inputProps={{ inputMode: "numeric" }} sx={fld}
              helperText="Counter billing only. Leave blank to bill this item at the Pricelist 1 price." />

            <TextField fullWidth size="small" label="Stock" value={form.countInStock} onChange={set("countInStock")}
              inputProps={{ inputMode: "numeric" }} sx={fld} />

            <FormControlLabel
              control={
                <Switch checked={form.active !== false}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  sx={{ "& .Mui-checked": { color: "var(--primary-color)" },
                        "& .Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--primary-color)" } }} />
              }
              label={<Typography fontSize={13.5} fontWeight={700}>Visible in the shop</Typography>}
            />

            <Box sx={{ gridColumn: { sm: "span 2" } }}>
              <TextField fullWidth size="small" multiline rows={2} label="Short description (shown on the product page)"
                value={form.shortDescription} onChange={set("shortDescription")} sx={fld} />
            </Box>
            <Box sx={{ gridColumn: { sm: "span 2" } }}>
              <TextField fullWidth size="small" multiline rows={4} label="Full description"
                value={form.description} onChange={set("description")} sx={fld} />
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: "1px solid var(--border)" }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700, color: "var(--text-color-secondary)" }}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}
          sx={{ textTransform: "none", fontWeight: 800, px: 3, py: 1, borderRadius: "var(--radius)",
                color: "#fff", backgroundColor: "var(--primary-color)",
                "&:hover": { backgroundColor: "var(--primary-dark)" },
                "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" } }}>
          {saving ? "Saving..." : isNew ? "Add product" : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const fld = {
  "& .MuiOutlinedInput-root": { borderRadius: "var(--radius)" },
  "& label.Mui-focused": { color: "var(--primary-color)" },
  "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "var(--primary-color)" },
};
