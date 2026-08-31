"use client";
import { Stack, Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import green from "@/public/images/green.png";
import iso from "@/public/images/iso.png";

/**
 * Factory page: who makes the crackers and how.
 *
 * Rebuilt from the old fixed-width blocks and raw <img> tags into a responsive
 * story - intro, credentials, gallery, then a route into the shop.
 */

const PILLARS = [
  { icon: <ScienceRoundedIcon />, title: "Made in-house", body: "Every cracker is mixed, filled and finished at our own unit in Sattur — nothing is bought in and relabelled." },
  { icon: <ShieldRoundedIcon />, title: "Safety first", body: "Licensed magazines, controlled storage and trained handling at every stage of production." },
  { icon: <GroupsRoundedIcon />, title: "Local craftspeople", body: "A skilled Sivakasi workforce with decades of fireworks experience between them." },
  { icon: <VerifiedRoundedIcon />, title: "Certified quality", body: "Green-certified and ISO 9001:2015 compliant, checked batch by batch." },
];

const GALLERY = [
  { src: "/images/factory1.jpg", alt: "Inside the Sankamithra factory" },
  { src: "/images/factory2.jpg", alt: "Fireworks production line" },
  { src: "/images/factory3.jpg", alt: "Finished crackers being packed" },
];

export default function FactoryContent() {
  return (
    <main style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Stack
        width="100%"
        maxWidth="var(--max-width)"
        px={{ xs: 2, sm: 3, md: 4 }}
        py={{ xs: 3, md: 5 }}
        gap={{ xs: 4, md: 7 }}
      >
        {/* Intro */}
        <Stack direction={{ xs: "column", md: "row" }} gap={{ xs: 3, md: 5 }} alignItems="center">
          <Stack flex={1} gap={2} minWidth={0}>
            <Box sx={{ alignSelf: "flex-start", px: 1.5, py: 0.5, borderRadius: "var(--radius-pill)", backgroundColor: "var(--primary-soft)", color: "var(--primary-color)", fontSize: 12, fontWeight: 800 }}>
              Sattur, Tamil Nadu
            </Box>
            <Typography component="h1" fontSize={{ xs: 27, sm: 32, md: 40 }} fontWeight={800} lineHeight={1.15} color="var(--text-color)">Our factory</Typography>
            <Typography fontSize={{ xs: 14.5, md: 16 }} color="var(--text-color-secondary)" lineHeight={1.8}>
              Sankamithra Thunder World has been making fireworks in the Sivakasi
              belt for years — the part of Tamil Nadu that supplies most of India&apos;s
              crackers. Because we manufacture what we sell, there is no
              distributor markup between our floor and your celebration, and we can
              stand behind every box that leaves the gate.
            </Typography>
            <Stack direction="row" gap={2} alignItems="center" mt={0.5}>
              <Box component="img" src={green.src} alt="Green certified" sx={{ width: 74 }} />
              <Box component="img" src={iso.src} alt="ISO 9001:2015 certified" sx={{ width: 74 }} />
            </Stack>
          </Stack>

          <Box
            sx={{
              flex: 1, width: "100%", minWidth: 0,
              borderRadius: "var(--radius-lg)", overflow: "hidden",
              boxShadow: "var(--shadow)", aspectRatio: "4 / 3",
            }}
          >
            <Box component="img" src="/images/fac.jpg" alt="Sankamithra factory" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </Box>
        </Stack>

        {/* Pillars */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: { xs: 1.5, md: 2 } }}>
          {PILLARS.map((p) => (
            <Stack key={p.title} gap={1.25} sx={{ p: { xs: 2, md: 2.5 }, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", backgroundColor: "var(--surface)" }}>
              <Box sx={{ color: "var(--primary-color)", display: "flex", "& svg": { fontSize: 26 } }}>{p.icon}</Box>
              <Typography fontSize={15} fontWeight={800} color="var(--text-color)">{p.title}</Typography>
              <Typography fontSize={13.5} color="var(--text-color-secondary)" lineHeight={1.7}>{p.body}</Typography>
            </Stack>
          ))}
        </Box>

        {/* Gallery */}
        <Stack gap={{ xs: 2, md: 2.5 }}>
          <Stack gap={0.5}>
            <Typography component="h2" fontSize={{ xs: 20, md: 26 }} fontWeight={800} lineHeight={1.25} color="var(--text-color)">Inside the unit</Typography>
            <Typography fontSize={13.5} color="var(--text-color-secondary)">
              From mixing and filling through to packing and dispatch.
            </Typography>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: { xs: 1.5, md: 2 } }}>
            {GALLERY.map((g) => (
              <Box
                key={g.src}
                sx={{ borderRadius: "var(--radius-lg)", overflow: "hidden", aspectRatio: "4 / 3", border: "1px solid var(--border)" }}
              >
                <Box
                  component="img" src={g.src} alt={g.alt} loading="lazy"
                  sx={{
                    width: "100%", height: "100%", objectFit: "cover", display: "block",
                    transition: "transform var(--transition)",
                    "&:hover": { transform: "scale(1.04)" },
                  }}
                />
              </Box>
            ))}
          </Box>
        </Stack>

        {/* Route into the shop */}
        <Stack
          alignItems="center" textAlign="center" gap={2}
          sx={{ p: { xs: 3, md: 5 }, borderRadius: "var(--radius-lg)", backgroundColor: "var(--primary-softer)", border: "1px solid var(--primary-border)" }}
        >
          <Typography fontSize={{ xs: 19, md: 24 }} fontWeight={800} color="var(--text-color)">
            Buy straight from the makers
          </Typography>
          <Typography fontSize={14} color="var(--text-color-secondary)" maxWidth={520}>
            Factory prices, genuine stock, and a team that will confirm your order
            personally before anything ships.
          </Typography>
          <Button component={Link} href="/shop" endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              textTransform: "none", fontWeight: 800, fontSize: 15,
              py: 1.2, px: 3.5, borderRadius: "var(--radius-pill)",
              color: "#fff", backgroundColor: "var(--primary-color)",
              "&:hover": { backgroundColor: "var(--primary-dark)" },
            }}
          >
            Shop crackers
          </Button>
        </Stack>
      </Stack>
    </main>
  );
}
