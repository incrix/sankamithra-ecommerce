"use client";
import { Stack, Typography, Box } from "@mui/material";
import { comboUnits } from "@/util/combo";
import { unitPrice } from "@/util/cart";
import { inr } from "@/util/pricing";

/**
 * The cover for a combo pack that has no photo of its own.
 *
 * A box of forty-odd crackers has no single product shot, and the grey "no
 * image" placeholder would make the shop's best-value listing look like its
 * emptiest. This draws the pack as a gift box instead: price and piece count,
 * which is what someone choosing between the three packs is comparing.
 *
 * `compact` is the thumbnail for cart rows, where only the box itself fits.
 */
export default function ComboArt({ product, compact = false, sx }) {
  const base = {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(140deg, var(--primary-color) 0%, var(--badge-color) 100%)",
    color: "#fff",
    ...sx,
  };

  if (compact) {
    return (
      <Box aria-hidden sx={{ ...base, display: "grid", placeItems: "center", fontSize: 26 }}>
        🎁
      </Box>
    );
  }

  const pieces = comboUnits(product);
  const varieties = product?.contents?.length || 0;

  return (
    <Stack
      role="img"
      aria-label={`${product.name}: ${pieces} crackers in one box`}
      alignItems="center" justifyContent="center" gap={0.5}
      sx={{ ...base, textAlign: "center", p: 1.5 }}
    >
      {/* Ribbon: one band across, one down - reads as a wrapped box at any size */}
      <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none",
                 background: "linear-gradient(90deg, transparent 46%, rgba(255,255,255,.22) 46%, rgba(255,255,255,.22) 54%, transparent 54%)" }} />
      <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none",
                 background: "linear-gradient(180deg, transparent 46%, rgba(255,255,255,.22) 46%, rgba(255,255,255,.22) 54%, transparent 54%)" }} />

      <Stack alignItems="center" gap={0.25}
        sx={{ position: "relative", px: 1.75, py: 1.25, borderRadius: "var(--radius)",
              backgroundColor: "rgba(0,0,0,.18)", backdropFilter: "blur(2px)" }}>
        <Typography fontSize={{ xs: 9.5, md: 10.5 }} fontWeight={800} letterSpacing={1.4} sx={{ opacity: 0.92 }}>
          COMBO PACK
        </Typography>
        <Typography fontSize={{ xs: 22, md: 28 }} fontWeight={900} lineHeight={1.1}>
          {inr(unitPrice(product))}
        </Typography>
        <Typography fontSize={{ xs: 10.5, md: 11.5 }} fontWeight={700} sx={{ opacity: 0.95 }}>
          {pieces} pieces · {varieties} varieties
        </Typography>
      </Stack>
    </Stack>
  );
}
