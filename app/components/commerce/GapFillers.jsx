"use client";
import { Stack, Typography, Box, Button } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { assetUrl } from "@/util/config";
import { unitPrice } from "@/util/cart";

/**
 * "Almost there" suggestions.
 *
 * When the cart is under ₹3000 the old page just disabled checkout. Here we
 * pick items that would actually close the gap and offer them one tap away, so
 * the shortfall comes with a way out instead of a wall. Items already in the
 * cart are excluded, and we bias toward the cheapest thing that still clears
 * the remainder so nobody is pushed into over-buying.
 */
export default function GapFillers({ products, cart, shortBy, onAdd }) {
  if (!products?.length || shortBy <= 0) return null;

  const inCart = new Set(cart.map((c) => c.id));
  const candidates = products
    .filter((p) => !inCart.has(p.id) && p.countInStock > 0)
    .map((p) => ({ p, price: unitPrice(p) }))
    .filter(({ price }) => price > 0);

  // Rank by how close the item lands to the shortfall, so a suggestion closes
  // the gap without forcing a big overspend. (Sorting by "cheapest item that
  // clears it" offered a ₹3,100 box to close a ₹1,896 gap - technically valid,
  // but it reads as an upsell rather than a help.)
  const best = [...candidates]
    .sort((a, b) => Math.abs(a.price - shortBy) - Math.abs(b.price - shortBy))
    .slice(0, 6)
    .map(({ p }) => p);

  if (!best.length) return null;

  return (
    <Stack gap={1}>
      <Typography fontSize={12} fontWeight={800} color="var(--text-color)">
        Almost there — add one of these
      </Typography>

      <Stack
        direction="row"
        gap={1}
        sx={{
          overflowX: "auto",
          pb: 0.5,
          scrollSnapType: "x mandatory",
          "&::-webkit-scrollbar": { height: 5 },
          "&::-webkit-scrollbar-thumb": { background: "#e6e6e6", borderRadius: 99 },
        }}
      >
        {best.map((p) => (
          <Stack
            key={p.id}
            gap={0.5}
            sx={{
              minWidth: 104,
              maxWidth: 104,
              p: 0.75,
              borderRadius: "10px",
              border: "1px solid #eee",
              backgroundColor: "#fff",
              scrollSnapAlign: "start",
            }}
          >
            <Box
              component="img"
              src={assetUrl(p.image?.[0])}
              alt=""
              sx={{
                width: "100%",
                height: 62,
                objectFit: "cover",
                borderRadius: "6px",
                backgroundColor: "#f6f6f6",
              }}
            />
            <Typography
              fontSize={10.5}
              fontWeight={700}
              color="var(--text-color)"
              sx={{
                lineHeight: 1.25,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: 26,
              }}
            >
              {p.name}
            </Typography>
            <Button
              size="small"
              onClick={() => onAdd(p)}
              startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                fontSize: 11,
                py: 0.25,
                borderRadius: "7px",
                color: "#fff",
                backgroundColor: "var(--primary-color)",
                "&:hover": { backgroundColor: "#e34100" },
                "& .MuiButton-startIcon": { mr: 0.25 },
              }}
            >
              ₹{unitPrice(p)}
            </Button>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
