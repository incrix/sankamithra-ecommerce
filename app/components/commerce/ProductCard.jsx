"use client";
import { Stack, Typography, Button, Box, Chip } from "@mui/material";
import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import Link from "next/link";
import { assetUrl } from "@/util/config";
import { productSlug } from "@/util/site";
import QtyStepper from "./QtyStepper";
import { unitPrice } from "@/util/cart";

/**
 * Product tile.
 *
 * Key change from the old card: once an item is in the cart the button becomes
 * the quantity control in place, so adjusting counts never requires a trip to
 * the cart page. The card also reflects cart state live, driven by the shared
 * `cart:updated` event.
 */
export default function ProductCard({ product, line, onAdd, onQty, onAdjust }) {
  const price = unitPrice(product);
  // Stock is tracked for the shop's own benefit but never blocks a customer:
  // the counter can source almost anything, and an order the shop can fulfil
  // by tomorrow is worth far more than a dead end on the page.
  const out = false;
  const added = Boolean(line);

  return (
    <Stack
      gap={1}
      sx={{
        p: 1.25,
        borderRadius: "14px",
        border: added ? "1.5px solid var(--primary-color)" : "1px solid #ececec",
        backgroundColor: "#fff",
        position: "relative",
        transition: "transform .15s, box-shadow .15s, border-color .15s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 22px rgba(0,0,0,.08)" },
      }}
    >
      {product.discount > 0 && (
        <Chip
          label={`${product.discount}% OFF`}
          size="small"
          sx={{
            position: "absolute", top: 8, left: 8, zIndex: 1,
            height: 20, fontSize: 10, fontWeight: 800,
            color: "#fff", backgroundColor: "var(--badge-color)",
          }}
        />
      )}

      {/* Links to the product's own page: needed for customers to read the
          detail, and it is the internal linking that gets those 145 URLs
          crawled in the first place. */}
      <Box
        component={Link}
        href={`/product/${productSlug(product)}`}
        sx={{ display: "block" }}
      >
        <Box
          component="img"
          src={assetUrl(product.image?.[0])}
          alt={`${product.name} - ${product.category} crackers from Sankamithra, Sivakasi`}
          loading="lazy"
          sx={{
            width: "100%", aspectRatio: "1 / 1", objectFit: "cover",
            borderRadius: "10px", backgroundColor: "#f6f6f6", display: "block",
          }}
        />
      </Box>

      <Typography fontSize={10.5} fontWeight={700} color="var(--text-color-trinary)">
        {product.category}
      </Typography>

      <Typography
        component={Link}
        href={`/product/${productSlug(product)}`}
        fontSize={13.5}
        fontWeight={800}
        color="var(--text-color)"
        sx={{
          lineHeight: 1.3, minHeight: 35,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
          "&:hover": { color: "var(--primary-color)" },
        }}
      >
        {product.name}
      </Typography>

      <Stack direction="row" alignItems="baseline" gap={0.75}>
        <Typography fontSize={16} fontWeight={800} color="var(--primary-color)">
          ₹{price}
        </Typography>
        <Typography
          fontSize={11.5}
          fontWeight={600}
          color="var(--text-color-trinary)"
          sx={{ textDecoration: "line-through" }}
        >
          ₹{product.price}
        </Typography>
      </Stack>

      {added ? (
        // In-place editing - no need to open the cart to change quantity
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.5}>
          <QtyStepper
            size="sm"
            value={line.count}
            onChange={(q) => onQty(product.id, q)}
            onAdjust={(d) => onAdjust(product.id, d)}
          />
          <Typography fontSize={11} fontWeight={800} color="#1d9b53">
            In cart
          </Typography>
        </Stack>
      ) : (
        <Button
          onClick={() => onAdd(product)}
          startIcon={<AddShoppingCartRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: "none", fontWeight: 800, fontSize: 13,
            py: 0.7, borderRadius: "9px",
            color: "var(--primary-color)",
            border: "1.5px solid var(--primary-color)",
            "&:hover": { backgroundColor: "var(--primary-color)", color: "#fff" },
          }}
        >
          Add to cart
        </Button>
      )}
    </Stack>
  );
}
