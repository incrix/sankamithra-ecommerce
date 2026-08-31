"use client";
import {
  Stack, Box, Typography, InputBase, Chip, Button, IconButton, CircularProgress, Tooltip,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import { useEffect, useMemo, useState } from "react";
import { assetUrl } from "@/util/config";
import ProductEditor from "./ProductEditor";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const net = (p) => Math.round(p.price - (p.price * (p.discount || 0)) / 100);
const BATCH = 40;

/** Catalogue management: search, edit, add, hide and remove products. */
export default function Products({ catalogue, loading, onReload, onToast }) {
  const products = catalogue?.products || [];
  const categories = catalogue?.categories || [];

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [visible, setVisible] = useState(BATCH);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [layout, setLayout] = useState("list"); // list | grid

  // Remembered per browser: whoever packs orders tends to want the same view
  // every time, and re-picking it on each visit is friction.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin:productLayout");
      if (saved === "grid" || saved === "list") setLayout(saved);
    } catch {}
  }, []);

  const chooseLayout = (next) => {
    setLayout(next);
    try { localStorage.setItem("admin:productLayout", next); } catch {}
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        (!q || p.name.toLowerCase().includes(q) || String(p.sku).toLowerCase().includes(q))
    );
  }, [products, query, cat]);

  const shown = filtered.slice(0, visible);

  const startEdit = (p) => { setEditing(p); setOpen(true); };
  const startNew = () => { setEditing(null); setOpen(true); };

  const remove = async (p) => {
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onToast(`${p.name} deleted`, "success");
      onReload();
    } catch {
      onToast("Could not delete", "error");
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <Stack gap={2} sx={{ flex: 1, minHeight: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap" flexShrink={0}>
        <Typography fontSize={12.5} fontWeight={700} color="var(--text-color-secondary)">
          {products.length} in the catalogue · {products.filter((p) => p.active === false).length} hidden
        </Typography>
        <Stack direction="row" alignItems="center" gap={1.25}>
          {/* View switch */}
          <Stack direction="row" sx={{ p: 0.35, borderRadius: "var(--radius-pill)", backgroundColor: "var(--surface-muted)", gap: 0.25 }}>
            {[
              { key: "list", label: "List view", icon: <ViewListRoundedIcon sx={{ fontSize: 17 }} /> },
              { key: "grid", label: "Grid view", icon: <GridViewRoundedIcon sx={{ fontSize: 16 }} /> },
            ].map((v) => (
              <Tooltip key={v.key} title={v.label}>
                <IconButton
                  onClick={() => chooseLayout(v.key)}
                  aria-label={v.label}
                  aria-pressed={layout === v.key}
                  sx={{
                    width: 30, height: 30, borderRadius: "var(--radius-pill)",
                    color: layout === v.key ? "#fff" : "var(--text-color-secondary)",
                    backgroundColor: layout === v.key ? "var(--primary-color)" : "transparent",
                    "&:hover": { backgroundColor: layout === v.key ? "var(--primary-dark)" : "#e6e6e6" },
                  }}
                >
                  {v.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Stack>

          <Button onClick={startNew} startIcon={<AddRoundedIcon />}
            sx={{ textTransform: "none", fontWeight: 800, fontSize: 14, px: 2.5, py: 1, borderRadius: "var(--radius)",
                  color: "#fff", backgroundColor: "var(--primary-color)", "&:hover": { backgroundColor: "var(--primary-dark)" } }}>
            Add product
          </Button>
        </Stack>
      </Stack>

      <Stack gap={1.25} flexShrink={0}>
        <Stack direction="row" alignItems="center" gap={1}
          sx={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius)", px: 1.5, py: 0.75, maxWidth: 420,
                "&:focus-within": { borderColor: "var(--primary-color)" } }}>
          <SearchRoundedIcon sx={{ fontSize: 19, color: "var(--text-color-trinary)" }} />
          <InputBase value={query} onChange={(e) => { setQuery(e.target.value); setVisible(BATCH); }}
            placeholder="Search name or SKU..." sx={{ flex: 1, fontSize: 14, fontWeight: 600 }} />
          {query && <CloseRoundedIcon onClick={() => setQuery("")} sx={{ fontSize: 17, cursor: "pointer", color: "var(--text-color-trinary)" }} />}
        </Stack>

        <Stack direction="row" gap={0.75} sx={{ overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { display: "none" } }}>
          {["All", ...categories].map((c) => {
            const n = c === "All" ? products.length : products.filter((p) => p.category === c).length;
            const on = cat === c;
            return (
              <Chip key={c} label={`${c} ${n}`} onClick={() => { setCat(c); setVisible(BATCH); }}
                sx={{ flexShrink: 0, fontWeight: 700, fontSize: 12, border: "1px solid",
                      borderColor: on ? "var(--primary-color)" : "var(--border)",
                      backgroundColor: on ? "var(--primary-color)" : "#fff",
                      color: on ? "#fff" : "var(--text-color)" }} />
            );
          })}
        </Stack>
      </Stack>

      <Typography fontSize={11.5} fontWeight={700} color="var(--text-color-secondary)" flexShrink={0}>
        {filtered.length} shown
      </Typography>

      <Stack
        gap={0.75}
        sx={{ flex: 1, minHeight: 0, overflowY: { md: "auto" }, pr: { md: 0.5 } }}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollHeight - el.scrollTop - el.clientHeight < 400) {
            setVisible((v) => (v < filtered.length ? v + BATCH : v));
          }
        }}
      >
        {loading ? (
          <Stack alignItems="center" py={6}><CircularProgress sx={{ color: "var(--primary-color)" }} /></Stack>
        ) : shown.length === 0 ? (
          <Stack alignItems="center" gap={1} py={6}>
            <Box sx={{ fontSize: 30 }}>📦</Box>
            <Typography fontWeight={800} color="var(--text-color)">No products match</Typography>
          </Stack>
        ) : (
          <>
            {layout === "grid" ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)", xl: "repeat(5, 1fr)",
                  },
                  gap: 1.5,
                }}
              >
                {shown.map((p) => (
                  <Stack
                    key={p.id}
                    data-product-row={p.id}
                    gap={0.75}
                    sx={{
                      p: 1, borderRadius: "var(--radius)", border: "1px solid var(--border)",
                      backgroundColor: "var(--surface)", position: "relative",
                      opacity: p.active === false ? 0.55 : 1,
                      transition: "border-color var(--transition), box-shadow var(--transition)",
                      "&:hover": { borderColor: "var(--primary-border)", boxShadow: "var(--shadow-sm)" },
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <Box component="img" src={assetUrl(p.image?.[0])} alt=""
                        sx={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover",
                              borderRadius: "var(--radius-sm)", backgroundColor: "#f6f6f6", display: "block" }} />

                      {p.discount > 0 && (
                        <Chip label={`${p.discount}%`} size="small"
                          sx={{ position: "absolute", top: 6, left: 6, height: 19, fontSize: 10, fontWeight: 800,
                                backgroundColor: "var(--badge-color)", color: "#fff" }} />
                      )}

                      {/* Actions sit over the image so the card stays compact */}
                      <Stack direction="row" gap={0.4} sx={{ position: "absolute", top: 6, right: 6 }}>
                        <IconButton size="small" onClick={() => startEdit(p)} aria-label={`edit ${p.name}`}
                          sx={{ p: 0.4, backgroundColor: "rgba(255,255,255,.92)", color: "var(--text-color)",
                                "&:hover": { backgroundColor: "#fff", color: "var(--primary-color)" } }}>
                          <EditRoundedIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                        {confirmId === p.id ? (
                          <Button size="small" onClick={() => remove(p)}
                            sx={{ minWidth: 0, px: 0.75, textTransform: "none", fontWeight: 800, fontSize: 10.5,
                                  color: "#fff", backgroundColor: "var(--danger)", "&:hover": { backgroundColor: "#c92a2a" } }}>
                            Sure?
                          </Button>
                        ) : (
                          <IconButton size="small" onClick={() => setConfirmId(p.id)} aria-label={`delete ${p.name}`}
                            sx={{ p: 0.4, backgroundColor: "rgba(255,255,255,.92)", color: "var(--text-color-secondary)",
                                  "&:hover": { backgroundColor: "#fff", color: "var(--danger)" } }}>
                            <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        )}
                      </Stack>

                      {p.active === false && (
                        <Chip icon={<VisibilityOffRoundedIcon sx={{ fontSize: 12, ml: 0.5 }} />} label="Hidden" size="small"
                          sx={{ position: "absolute", bottom: 6, left: 6, height: 19, fontSize: 9.5, fontWeight: 800,
                                backgroundColor: "rgba(0,0,0,.72)", color: "#fff", "& .MuiChip-icon": { color: "#fff" } }} />
                      )}
                    </Box>

                    <Typography fontSize={10.5} fontWeight={700} color="var(--text-color-trinary)" noWrap>
                      {p.category}
                    </Typography>

                    <Typography fontSize={12.5} fontWeight={800} color="var(--text-color)"
                      sx={{ lineHeight: 1.3, minHeight: 32, display: "-webkit-box", WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.name}
                    </Typography>

                    <Stack direction="row" alignItems="baseline" gap={0.75} flexWrap="wrap">
                      <Typography fontSize={14} fontWeight={800} color="var(--text-color)">{inr(net(p))}</Typography>
                      {p.discount > 0 && (
                        <Typography fontSize={10.5} color="var(--text-color-trinary)" sx={{ textDecoration: "line-through" }}>
                          {inr(p.price)}
                        </Typography>
                      )}
                    </Stack>

                    <Typography fontSize={10.5} fontWeight={700}
                      color={p.countInStock <= 0 ? "var(--danger-ink)" : "var(--text-color-secondary)"}>
                      {p.countInStock <= 0 ? "Out of stock" : `${p.countInStock} in stock`}
                      {p.sku ? ` · ${p.sku}` : ""}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            ) : (
              shown.map((p) => (
              <Stack key={p.id} direction="row" alignItems="center" gap={1.5} data-product-row={p.id}
                sx={{ p: 1, borderRadius: "var(--radius)", border: "1px solid var(--border)", backgroundColor: "var(--surface)",
                      opacity: p.active === false ? 0.55 : 1,
                      "&:hover": { borderColor: "var(--primary-border)" } }}>
                <Box component="img" src={assetUrl(p.image?.[0])} alt=""
                  sx={{ width: 46, height: 46, borderRadius: "var(--radius-sm)", objectFit: "cover", flexShrink: 0, backgroundColor: "#f6f6f6" }} />

                <Stack flex={1} minWidth={0}>
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    <Typography fontSize={13.5} fontWeight={800} color="var(--text-color)" noWrap>{p.name}</Typography>
                    {p.active === false && (
                      <Tooltip title="Hidden from the shop"><VisibilityOffRoundedIcon sx={{ fontSize: 14, color: "var(--text-color-trinary)" }} /></Tooltip>
                    )}
                    {p.countInStock <= 0 && (
                      <Chip label="No stock" size="small" sx={{ height: 17, fontSize: 9.5, fontWeight: 800, backgroundColor: "var(--danger-soft)", color: "var(--danger-ink)" }} />
                    )}
                  </Stack>
                  <Typography fontSize={11.5} color="var(--text-color-secondary)" fontWeight={600}>
                    {p.category}{p.sku ? ` · SKU ${p.sku}` : ""} · {p.countInStock} in stock
                  </Typography>
                </Stack>

                <Stack alignItems="flex-end" sx={{ minWidth: 96 }}>
                  <Typography fontSize={14} fontWeight={800} color="var(--text-color)">{inr(net(p))}</Typography>
                  {p.discount > 0 && (
                    <Typography fontSize={11} color="var(--text-color-secondary)">
                      <Box component="span" sx={{ textDecoration: "line-through" }}>{inr(p.price)}</Box>{" "}
                      <Box component="span" sx={{ color: "var(--success)", fontWeight: 800 }}>{p.discount}% off</Box>
                    </Typography>
                  )}
                </Stack>

                <Stack direction="row" gap={0.25} flexShrink={0}>
                  <IconButton size="small" onClick={() => startEdit(p)} aria-label={`edit ${p.name}`}
                    sx={{ color: "var(--text-color-secondary)", "&:hover": { color: "var(--primary-color)", backgroundColor: "var(--primary-soft)" } }}>
                    <EditRoundedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                  {confirmId === p.id ? (
                    <Button size="small" onClick={() => remove(p)}
                      sx={{ textTransform: "none", fontWeight: 800, fontSize: 11.5, color: "#fff", backgroundColor: "var(--danger)", "&:hover": { backgroundColor: "#c92a2a" } }}>
                      Confirm
                    </Button>
                  ) : (
                    <IconButton size="small" onClick={() => setConfirmId(p.id)} aria-label={`delete ${p.name}`}
                      sx={{ color: "var(--text-color-trinary)", "&:hover": { color: "var(--danger)", backgroundColor: "var(--danger-soft)" } }}>
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  )}
                </Stack>
              </Stack>
              ))
            )}
            {visible < filtered.length && (
              <Button onClick={() => setVisible((v) => v + BATCH)}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, color: "var(--primary-color)" }}>
                Show more ({filtered.length - visible} left)
              </Button>
            )}
          </>
        )}
      </Stack>

      <ProductEditor
        open={open}
        product={editing}
        categories={categories}
        onClose={() => setOpen(false)}
        // Filter down to whatever was just saved: a new product is otherwise
        // item 146 of 146 and the user never sees that it worked.
        onSaved={(saved) => {
          if (saved?.name) { setQuery(saved.name); setCat("All"); setVisible(BATCH); }
          onReload();
        }}
        onToast={onToast}
      />
    </Stack>
  );
}
