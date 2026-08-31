"use client";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Stack, Typography, Box, Chip, InputBase, Drawer, Button,
  Snackbar, Alert, Badge, CircularProgress,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useProducts } from "@/context/ProductContext";
import { useCart } from "@/util/cart";
import ProductCard from "@/app/components/commerce/ProductCard";
import CartPanel from "@/app/components/commerce/CartPanel";

/**
 * Shop - catalogue and cart on one screen.
 *
 * The old flow was shop -> /cart -> back to /shop to add anything else, losing
 * scroll position and category each time. Here the cart lives beside the grid
 * (a bottom sheet on mobile), so browsing, editing quantities and adding more
 * products all happen without a navigation.
 */
export default function ShopClient() {
  const { productList, loading } = useProducts();
  const c = useCart();

  const params = useSearchParams();
  const [query, setQuery] = useState("");
  // Links like /?category=Rockets arrive from the footer and category grid.
  const [category, setCategory] = useState(params.get("category") || "All");

  useEffect(() => {
    const c = params.get("category");
    if (c) setCategory(c);
  }, [params]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [undo, setUndo] = useState(null);

  // Lock background scroll while the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const categories = useMemo(() => {
    const counts = new Map();
    productList.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    return [["All", productList.length], ...[...counts.entries()].sort((a, b) => b[1] - a[1])];
  }, [productList]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productList.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q))
    );
  }, [productList, category, query]);

  const handleAdd = (p) => {
    c.add(p, 1);
    setToast({ msg: `${p.name} added`, severity: "success" });
  };

  // Remove keeps the item and its position so it can be put back - the old
  // cart deleted immediately with no way to recover a mis-tap.
  const handleRemove = (item, index) => {
    c.remove(item.id);
    setUndo({ item, index });
  };

  const panelProps = {
    ...c,
    products: productList,
    onQty: c.setQty,
    onAdjust: c.adjust,
    onRemove: handleRemove,
    onAdd: handleAdd,
    onKeepShopping: () => setDrawerOpen(false),
  };

  return (
    <main style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Stack width="100%" maxWidth="var(--max-width)" px={{ xs: 2, md: 4 }} py={{ xs: 2, md: 4 }}>
        <Stack gap={0.5} mb={2}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography
              component="h1"
              fontSize={{ xs: 22, md: 30 }}
              fontWeight={800}
              color="var(--text-color)"
              lineHeight={1.2}
            >
              Sivakasi Crackers Online — Fireworks at Factory Prices
            </Typography>
          </Stack>
          <Typography fontSize={13.5} color="var(--text-color-secondary)">
            Buy Diwali crackers direct from the Sankamithra Thunder World factory in
            Sattur, Sivakasi — up to 90% off, delivered across India. Build your order
            and edit your cart without leaving this page.
          </Typography>
        </Stack>

        {/* Search + categories stay pinned so filtering never needs a scroll back up */}
        <Stack
          gap={1.25}
          sx={{
            position: "sticky", top: 0, zIndex: 5,
            backgroundColor: "#fff", pt: 1, pb: 1.25,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Stack
            direction="row" alignItems="center" gap={1}
            sx={{
              border: "1.5px solid #ececec", borderRadius: "10px", px: 1.5, py: 0.75,
              maxWidth: 420, "&:focus-within": { borderColor: "var(--primary-color)" },
            }}
          >
            <SearchRoundedIcon sx={{ color: "var(--text-color-trinary)", fontSize: 20 }} />
            <InputBase
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search crackers..."
              sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}
            />
            {query && (
              <CloseRoundedIcon
                onClick={() => setQuery("")}
                sx={{ fontSize: 18, cursor: "pointer", color: "var(--text-color-trinary)" }}
              />
            )}
          </Stack>

          <Stack
            direction="row" gap={0.75}
            sx={{ overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { display: "none" } }}
          >
            {categories.map(([name, n]) => (
              <Chip
                key={name}
                label={`${name} ${n}`}
                onClick={() => setCategory(name)}
                sx={{
                  flexShrink: 0, fontWeight: 700, fontSize: 12,
                  border: "1px solid",
                  borderColor: category === name ? "var(--primary-color)" : "#ececec",
                  backgroundColor: category === name ? "var(--primary-color)" : "#fff",
                  color: category === name ? "#fff" : "var(--text-color)",
                  "&:hover": { backgroundColor: category === name ? "var(--primary-color)" : "#fff1ea" },
                }}
              />
            ))}
          </Stack>
        </Stack>

        <Stack direction="row" gap={3} mt={2} alignItems="flex-start">
          <Box flex={1} minWidth={0}>
            {loading ? (
              <Stack alignItems="center" py={8} gap={2}>
                <CircularProgress sx={{ color: "var(--primary-color)" }} />
                <Typography fontSize={13} color="var(--text-color-secondary)">
                  Loading products...
                </Typography>
              </Stack>
            ) : shown.length === 0 ? (
              <Stack alignItems="center" py={8} gap={1}>
                <Box sx={{ fontSize: 34 }}>🔍</Box>
                <Typography fontWeight={800} color="var(--text-color)">No products found</Typography>
                <Typography fontSize={13} color="var(--text-color-secondary)">
                  Try another search or category.
                </Typography>
              </Stack>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)",
                    md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)",
                  },
                  gap: 1.5,
                  pb: { xs: 12, md: 4 }, // room for the mobile cart bar
                }}
              >
                {shown.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    line={c.inCart(p.id)}
                    onAdd={handleAdd}
                    onQty={c.setQty}
                    onAdjust={c.adjust}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Desktop: cart pinned beside the grid */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              width: 340, flexShrink: 0,
              position: "sticky", top: 96,
              maxHeight: "calc(100vh - 120px)", overflowY: "auto",
            }}
          >
            <CartPanel {...panelProps} />
          </Box>
        </Stack>
      </Stack>

      {/* Mobile: summary bar that opens the cart as a bottom sheet */}
      {c.itemCount > 0 && (
        <Stack
          direction="row" alignItems="center" justifyContent="space-between"
          onClick={() => setDrawerOpen(true)}
          sx={{
            display: { xs: "flex", md: "none" },
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1200,
            px: 2, py: 1.25, cursor: "pointer",
            backgroundColor: "var(--primary-color)",
            boxShadow: "0 -4px 20px rgba(0,0,0,.15)",
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Badge badgeContent={c.itemCount} sx={{ "& .MuiBadge-badge": { backgroundColor: "#fff", color: "var(--primary-color)", fontWeight: 800 } }}>
              <ShoppingCartRoundedIcon sx={{ color: "#fff" }} />
            </Badge>
            <Stack>
              <Typography fontSize={15} fontWeight={800} color="#fff">
                ₹{c.total.toLocaleString("en-IN")}
              </Typography>
              {!c.meetsMinimum && (
                <Typography fontSize={10.5} color="#ffe0d3" fontWeight={600}>
                  ₹{c.shortBy.toLocaleString("en-IN")} to checkout
                </Typography>
              )}
            </Stack>
          </Stack>
          <Typography fontSize={13.5} fontWeight={800} color="#fff">
            View cart →
          </Typography>
        </Stack>
      )}

      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 18, borderTopRightRadius: 18,
            maxHeight: "88vh", display: "flex", flexDirection: "column",
          },
        }}
      >
        <Box sx={{ width: 38, height: 4, borderRadius: 99, backgroundColor: "#ddd", mx: "auto", mt: 1.25 }} />
        <Box sx={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          <CartPanel {...panelProps} embedded />
        </Box>
      </Drawer>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={1600}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: { xs: 9, md: 0 } }}
      >
        <Alert severity={toast?.severity || "success"} variant="filled" sx={{ fontWeight: 700 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>

      {/* Undo window for accidental removals */}
      <Snackbar
        open={Boolean(undo)}
        autoHideDuration={5000}
        onClose={() => setUndo(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: { xs: 9, md: 0 } }}
        message={undo ? `${undo.item.name} removed` : ""}
        action={
          <Button
            size="small"
            onClick={() => { c.restore(undo.item, undo.index); setUndo(null); }}
            sx={{ color: "#ffb08c", fontWeight: 800, textTransform: "none" }}
          >
            UNDO
          </Button>
        }
      />
    </main>
  );
}
