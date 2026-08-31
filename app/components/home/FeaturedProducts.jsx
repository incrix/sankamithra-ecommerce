"use client";
import { Stack, Box, Typography, Button, CircularProgress } from "@mui/material";
import Link from "next/link";
import { useProducts } from "@/context/ProductContext";
import { useCart } from "@/util/cart";
import ProductCard from "@/app/components/commerce/ProductCard";

/**
 * A short shelf of products on the home page.
 *
 * The old home page rendered the entire 145-product catalogue inline, which
 * made the landing page enormous and duplicated the shop. A handful of items
 * is enough to show what's on offer and send people to /shop.
 */
export default function FeaturedProducts({ count = 8 }) {
  const { productList, loading } = useProducts();
  const c = useCart();
  const shown = productList.slice(0, count);

  return (
    <Stack gap={{ xs: 2, md: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={2}>
        <Stack>
          <Typography component="h2" fontSize={{ xs: 20, md: 26 }} fontWeight={800} lineHeight={1.25} color="var(--text-color)">Popular this season</Typography>
          <Typography fontSize={13.5} color="var(--text-color-secondary)">
            Our best-selling crackers, straight off the price list
          </Typography>
        </Stack>
      </Stack>

      {loading ? (
        <Stack alignItems="center" py={5}><CircularProgress sx={{ color: "var(--primary-color)" }} /></Stack>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
            gap: { xs: 1.5, md: 2 },
          }}
        >
          {shown.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              line={c.inCart(p.id)}
              onAdd={(x) => c.add(x, 1)}
              onQty={c.setQty}
              onAdjust={c.adjust}
            />
          ))}
        </Box>
      )}

      <Button
        component={Link}
        href="/shop"
        sx={{
          alignSelf: "center",
          textTransform: "none", fontWeight: 800, fontSize: 14.5,
          py: 1.1, px: 3.5, borderRadius: "var(--radius-pill)",
          color: "var(--primary-color)", border: "1.5px solid var(--primary-color)",
          "&:hover": { backgroundColor: "var(--primary-color)", color: "#fff" },
        }}
      >
        Browse all {productList.length || ""} products
      </Button>
    </Stack>
  );
}
