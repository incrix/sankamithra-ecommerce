"use client";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Stack, Typography, Box, Chip, Drawer, Button,
  Snackbar, Alert, Badge, CircularProgress,
} from "@mui/material";
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
  const { productList, loading, searchTerm, setSearchTerm } = useProducts();
  const c = useCart();

  const params = useSearchParams();
  // Deliberately the shared term, not local state: the header search box
  // writes here, and while the grid kept its own copy a customer could type
  // "rocket" into the most prominent field on the page and nothing happened.
  const query = searchTerm || "";
  // Links like /?category=Rockets arrive from the footer and category grid.
  const [category, setCategory] = useState(params.get("category") || "All");
  const [sort, setSort] = useState("popular");

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

  // Chip order follows the arrangement the shop saved in the admin panel, not
  // the product count - otherwise adding stock to a category silently promoted
  // it past one the shop had deliberately put first.
  const categories = useMemo(() => {
    const counts = new Map();
    productList.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    const seen = new Set();
    const ordered = [];
    // Products already arrive in sortOrder, so first appearance is the order.
    productList.forEach((p) => {
      if (!seen.has(p.category)) { seen.add(p.category); ordered.push([p.category, counts.get(p.category)]); }
    });
    return [["All", productList.length], ...ordered];
  }, [productList]);

  const net = (p) => Math.round(p.price - (p.price * (p.discount || 0)) / 100);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = productList.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q))
    );
    // "popular" is the price-list order the shop already curates, so it stays
    // the default rather than something derived from sales we cannot see.
    if (sort === "low") return [...list].sort((a, b) => net(a) - net(b));
    if (sort === "high") return [...list].sort((a, b) => net(b) - net(a));
    if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [productList, category, query, sort]);

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
              Sivakasi Crackers Online — Up to 80% Off
            </Typography>
          </Stack>
          <Typography fontSize={13.5} color="var(--text-color-secondary)">
            Buy Diwali crackers from Sankamithra Thunder World, a crackers shop in
            Sivakasi — up to 80% off, delivered across India. Build your order and edit
            your cart without leaving this page.
          </Typography>
        </Stack>

        {/* What the shop promises, before the grid - a first-time buyer decides
            here whether to bother scrolling. */}
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 0.5 }}>
          {[
            ["Delivered across India", "🚚"],
            ["Minimum order ₹3,000", "🧾"],
            ["Licensed Sivakasi shop", "✅"],
            ["Pay on confirmation", "🤝"],
          ].map(([label, icon]) => (
            <Stack key={label} direction="row" alignItems="center" gap={0.6}
              sx={{ px: 1.25, py: 0.6, borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--surface-muted)", border: "1px solid var(--border)" }}>
              <Box sx={{ fontSize: 13 }}>{icon}</Box>
              <Typography fontSize={11.5} fontWeight={700} color="var(--text-color-secondary)">{label}</Typography>
            </Stack>
          ))}
        </Stack>

        {/* Categories and sorting stay pinned so refining never needs a scroll
            back up. The search itself lives once, in the header. */}
        <Stack
          gap={1}
          sx={{
            position: "sticky", top: 0, zIndex: 5,
            backgroundColor: "#fff", pt: 1, pb: 1.25,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
            <Typography fontSize={13} fontWeight={800} color="var(--text-color)">
              {shown.length} {shown.length === 1 ? "cracker" : "crackers"}
              {category !== "All" ? ` in ${category}` : ""}
            </Typography>
            {query && (
              <Chip
                label={`"${query}"`}
                size="small"
                onDelete={() => setSearchTerm("")}
                deleteIcon={<CloseRoundedIcon />}
                sx={{ fontWeight: 700, fontSize: 11.5, backgroundColor: "var(--primary-soft)", color: "var(--primary-color)" }}
              />
            )}
            <Box flex={1} />
            <Stack direction="row" alignItems="center" gap={0.5}>
              <Typography fontSize={11.5} fontWeight={700} color="var(--text-color-trinary)">Sort</Typography>
              {[["popular", "Featured"], ["low", "Price ↓"], ["high", "Price ↑"], ["name", "A–Z"]].map(([k, label]) => (
                <Box
                  key={k}
                  onClick={() => setSort(k)}
                  role="button"
                  sx={{
                    px: 1, py: 0.4, borderRadius: "var(--radius-pill)", cursor: "pointer",
                    fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap",
                    color: sort === k ? "var(--primary-color)" : "var(--text-color-secondary)",
                    backgroundColor: sort === k ? "var(--primary-soft)" : "transparent",
                    "&:hover": { backgroundColor: "var(--surface-muted)" },
                  }}
                >
                  {label}
                </Box>
              ))}
            </Stack>
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
