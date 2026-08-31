"use client";
import { Stack, Box, Typography } from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";
import { useProducts } from "@/context/ProductContext";
import flower from "@/public/temp/flower.png";
import sound from "@/public/temp/sound.png";
import special from "@/public/temp/special.png";
import chakkar from "@/public/temp/chakkar.png";
import aerial from "@/public/temp/aerial.png";
import rocket from "@/public/temp/rocket.png";
import bomb from "@/public/temp/bomb.png";
import twinkle from "@/public/temp/twinkle.png";

/** Category -> icon, and which product categories roll up into it. */
const CATS = [
  { label: "Flower Pots",     img: flower,  match: ["Flower Pots", "Fountains"] },
  { label: "Ground Chakkars", img: chakkar, match: ["Ground Chakkars"] },
  { label: "One Sound",       img: sound,   match: ["One Sound"] },
  { label: "Special's",       img: special, match: ["Special's"] },
  { label: "Rockets",         img: rocket,  match: ["Rockets"] },
  { label: "Aerials",         img: aerial,  match: ["Repeating shots"] },
  { label: "Bombs",           img: bomb,    match: ["Atom bombs", "Bijili crackers"] },
  { label: "Twinklers",       img: twinkle, match: ["Twinkling stars", "Pencils", "Sparklers"] },
];

export default function CategoryGrid() {
  const { productList } = useProducts();

  const counts = useMemo(() => {
    const m = new Map();
    productList.forEach((p) => m.set(p.category, (m.get(p.category) || 0) + 1));
    return CATS.map((c) => ({
      ...c,
      count: c.match.reduce((a, k) => a + (m.get(k) || 0), 0),
    }));
  }, [productList]);

  return (
    <Stack gap={{ xs: 2, md: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={2}>
        <Stack>
          <Typography component="h2" fontSize={{ xs: 20, md: 26 }} fontWeight={800} lineHeight={1.25} color="var(--text-color)">Shop by category</Typography>
          <Typography fontSize={13.5} color="var(--text-color-secondary)">
            Everything from flower pots to aerial shots
          </Typography>
        </Stack>
        <Typography
          component={Link}
          href="/shop"
          fontSize={13.5}
          fontWeight={800}
          color="var(--primary-color)"
          sx={{ flexShrink: 0, "&:hover": { textDecoration: "underline" } }}
        >
          View all →
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", lg: "repeat(8, 1fr)" },
          gap: { xs: 1.25, md: 2 },
        }}
      >
        {counts.map((c) => (
          <Stack
            key={c.label}
            component={Link}
            href={`/shop?category=${encodeURIComponent(c.match[0])}`}
            alignItems="center"
            gap={1}
            sx={{
              p: { xs: 1.5, md: 2 },
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              backgroundColor: "var(--surface)",
              transition: "transform var(--transition), border-color var(--transition), box-shadow var(--transition)",
              "&:hover": {
                transform: "translateY(-3px)",
                borderColor: "var(--primary-color)",
                boxShadow: "var(--shadow)",
              },
            }}
          >
            <Box component="img" src={c.img.src} alt="" sx={{ width: { xs: 34, md: 40 }, height: { xs: 34, md: 40 }, objectFit: "contain" }} />
            <Typography fontSize={{ xs: 12, md: 12.5 }} fontWeight={800} color="var(--text-color)" textAlign="center" lineHeight={1.25}>
              {c.label}
            </Typography>
            <Typography fontSize={10.5} fontWeight={700} color="var(--text-color-secondary)">
              {c.count} items
            </Typography>
          </Stack>
        ))}
      </Box>
    </Stack>
  );
}
