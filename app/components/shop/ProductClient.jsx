"use client";
import { Stack, Box, Typography, Button, Chip, Divider, CircularProgress, Snackbar, Alert } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { useProducts } from "@/context/ProductContext";
import { useCart, unitPrice } from "@/util/cart";
import { assetUrl } from "@/util/config";
import QtyStepper from "@/app/components/commerce/QtyStepper";
import ProductCard from "@/app/components/commerce/ProductCard";

/**
 * Product detail.
 *
 * Rebuilt on the shared cart engine and card. The old page kept its own
 * add-to-cart logic writing straight to localStorage, and priced with
 * Math.ceil where the rest of the site rounds - so it advertised a higher
 * price than the cart charged on 58 of 145 products.
 */
export default function ProductClient({ initialProduct }) {
  // The server already resolved this product for metadata and JSON-LD; use it
  // so the page paints immediately instead of waiting on the client fetch.
  const id = initialProduct?.id;
  const router = useRouter();
  const { productList, loading } = useProducts();
  const c = useCart();
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState(null);

  const product = useMemo(
    () => productList.find((p) => String(p.id) === String(id)) || initialProduct,
    [productList, id, initialProduct]
  );

  const related = useMemo(
    () => productList.filter((p) => p.category === product?.category && p.id !== product?.id).slice(0, 4),
    [productList, product]
  );

  if (loading && !initialProduct) {
    return <Stack alignItems="center" py={10}><CircularProgress sx={{ color: "var(--primary-color)" }} /></Stack>;
  }

  if (!product) {
    return (
      <Stack alignItems="center" gap={2} py={10} px={2}>
        <Box sx={{ fontSize: 40 }}>🔍</Box>
        <Typography fontSize={19} fontWeight={800} color="var(--text-color)">Product not found</Typography>
        <Button component={Link} href="/" sx={primaryBtn}>Back to shop</Button>
      </Stack>
    );
  }

  const price = unitPrice(product);
  const out = product.countInStock <= 0;
  const line = c.inCart(product.id);

  const add = () => {
    if (out) { setToast({ msg: "Sorry, this item is out of stock.", severity: "error" }); return; }
    c.add(product, qty);
    setToast({ msg: `${product.name} × ${qty} added to cart`, severity: "success" });
  };

  return (
    <main style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Stack
        width="100%"
        maxWidth="var(--max-width)"
        px={{ xs: 2, sm: 3, md: 4 }}
        py={{ xs: 2.5, md: 4 }}
        gap={{ xs: 4, md: 6 }}
      >
        <Button
          onClick={() => router.push("/")}
          startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 13 }} />}
          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700, color: "var(--primary-color)", "&:hover": { backgroundColor: "var(--primary-soft)" } }}
        >
          Back to shop
        </Button>

        <Stack direction={{ xs: "column", md: "row" }} gap={{ xs: 3, md: 6 }} alignItems="flex-start">
          {/* Gallery */}
          <Box
            sx={{
              width: { xs: "100%", md: "48%" }, maxWidth: { xs: 460, md: 560 },
              flexShrink: 0, alignSelf: { xs: "center", md: "flex-start" },
              borderRadius: "var(--radius-lg)", overflow: "hidden",
              border: "1px solid var(--border)",
              "& .carousel .thumb": { borderRadius: 6 },
              "& .carousel .thumb.selected": { borderColor: "var(--primary-color)" },
            }}
          >
            <Carousel
              showStatus={false}
              showArrows={product.image.length > 1}
              showIndicators={product.image.length > 1}
              showThumbs={product.image.length > 1}
              infiniteLoop
              emulateTouch
              useKeyboardArrows
              renderThumbs={(children) =>
                children.map((ch, i) => <img key={i} src={ch.props.children.props.src} alt="" />)
              }
            >
              {product.image.map((img, i) => (
                <Box key={i}>
                  <Box component="img" src={assetUrl(img)} alt={product.name} sx={{ width: "100%", display: "block" }} />
                </Box>
              ))}
            </Carousel>
          </Box>

          {/* Details */}
          <Stack flex={1} gap={2} minWidth={0}>
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
              {product.discount > 0 && (
                <Chip label={`${product.discount}% OFF`} size="small"
                  sx={{ height: 22, fontWeight: 800, fontSize: 11, backgroundColor: "var(--badge-color)", color: "#fff" }} />
              )}
              <Typography fontSize={12} fontWeight={700} color="var(--text-color-secondary)">
                {product.category}
              </Typography>
            </Stack>

            <Typography component="h1" fontSize={{ xs: 24, md: 32 }} fontWeight={800} color="var(--text-color)" lineHeight={1.2}>
              {product.name}
            </Typography>

            <Stack direction="row" alignItems="baseline" gap={1.5} flexWrap="wrap">
              <Typography fontSize={{ xs: 28, md: 34 }} fontWeight={800} color="var(--primary-color)">
                ₹{price}
              </Typography>
              <Typography fontSize={{ xs: 15, md: 17 }} color="var(--text-color-trinary)" sx={{ textDecoration: "line-through" }}>
                ₹{product.price}
              </Typography>
              {product.discount > 0 && (
                <Typography fontSize={13.5} fontWeight={800} color="var(--success)">
                  You save ₹{product.price - price}
                </Typography>
              )}
            </Stack>

            {product.shortDescription && (
              <Typography fontSize={14} color="var(--text-color-secondary)" lineHeight={1.8}>
                {product.shortDescription}
              </Typography>
            )}

            <Divider />

            <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
              <QtyStepper value={qty} onChange={(q) => setQty(Math.max(1, q))} onAdjust={(d) => setQty((v) => Math.max(1, v + d))} />
              <Button
                onClick={add}
                disabled={out}
                startIcon={<AddShoppingCartRoundedIcon />}
                sx={{ ...primaryBtn, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}
              >
                {out ? "Out of stock" : "Add to cart"}
              </Button>
            </Stack>

            {line && (
              <Stack direction="row" gap={1} alignItems="center">
                <CheckCircleRoundedIcon sx={{ fontSize: 17, color: "var(--success)" }} />
                <Typography fontSize={13} fontWeight={700} color="var(--success-ink)">
                  {line.count} in your cart
                </Typography>
                <Typography component={Link} href="/cart" fontSize={13} fontWeight={800} color="var(--primary-color)"
                  sx={{ "&:hover": { textDecoration: "underline" } }}>
                  View cart →
                </Typography>
              </Stack>
            )}

            <Stack direction="row" gap={3} flexWrap="wrap" mt={0.5}>
              <Meta label="Availability" value={out ? "Out of stock" : `${product.countInStock} in stock`} />
              <Meta label="SKU" value={product.sku} />
              <Meta label="Brand" value={product.brand} />
            </Stack>
          </Stack>
        </Stack>

        {product.description && (
          <Stack gap={1.5} sx={{ p: { xs: 2.5, md: 4 }, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", backgroundColor: "var(--surface)" }}>
            <Typography component="h2" fontSize={{ xs: 18, md: 22 }} color="var(--text-color)">Description</Typography>
            <Typography fontSize={14} color="var(--text-color-secondary)" lineHeight={1.9}>
              {product.description}
            </Typography>
          </Stack>
        )}

        {related.length > 0 && (
          <Stack gap={{ xs: 2, md: 2.5 }}>
            <Typography component="h2" fontSize={{ xs: 19, md: 23 }} color="var(--text-color)">
              More in {product.category}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }, gap: { xs: 1.5, md: 2 } }}>
              {related.map((p) => (
                <ProductCard key={p.id} product={p} line={c.inCart(p.id)} onAdd={(x) => c.add(x, 1)} onQty={c.setQty} onAdjust={c.adjust} />
              ))}
            </Box>
          </Stack>
        )}
      </Stack>

      <Snackbar open={Boolean(toast)} autoHideDuration={2200} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity || "success"} variant="filled" sx={{ fontWeight: 700 }}>{toast?.msg}</Alert>
      </Snackbar>
    </main>
  );
}

function Meta({ label, value }) {
  return (
    <Stack>
      <Typography fontSize={11} fontWeight={700} color="var(--text-color-trinary)" textTransform="uppercase" letterSpacing={0.4}>
        {label}
      </Typography>
      <Typography fontSize={13.5} fontWeight={700} color="var(--text-color)">{value || "—"}</Typography>
    </Stack>
  );
}

const primaryBtn = {
  textTransform: "none", fontWeight: 800, fontSize: 15,
  py: 1.2, px: 3, borderRadius: "var(--radius-pill)",
  color: "#fff", backgroundColor: "var(--primary-color)",
  "&:hover": { backgroundColor: "var(--primary-dark)" },
  "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" },
};
