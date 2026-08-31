"use client";
import { Stack, Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import FactoryRoundedIcon from "@mui/icons-material/FactoryRounded";
import { assetUrl } from "@/util/config";

/**
 * Home hero: a headline that says what the shop is, then the banners.
 *
 * The previous hero was a bare carousel inside a useWindowSize()-driven grid,
 * so the page opened with no statement of who this is or why to buy, and the
 * layout shifted once JS measured the window.
 */

const TRUST = [
  { icon: <FactoryRoundedIcon />, title: "Direct from Sivakasi", body: "Bought where they are made" },
  { icon: <SavingsRoundedIcon />, title: "Up to 90% off", body: "Straight off the price list" },
  { icon: <VerifiedRoundedIcon />, title: "Licensed & certified", body: "ISO and green-certified" },
  { icon: <LocalShippingRoundedIcon />, title: "All-India delivery", body: "Safely packed and shipped" },
];

export default function Hero() {
  return (
    <Stack gap={{ xs: 3, md: 5 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        gap={{ xs: 3, md: 5 }}
        alignItems="center"
      >
        <Stack flex={1} gap={2} minWidth={0}>
          <Box
            sx={{
              alignSelf: "flex-start",
              px: 1.5, py: 0.5, borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--primary-soft)",
              color: "var(--primary-color)",
              fontSize: 12, fontWeight: 800,
            }}
          >
            Diwali 2025 · Now taking orders
          </Box>

          <Typography component="h1" fontSize={{ xs: 27, sm: 32, md: 40 }} fontWeight={800} lineHeight={1.15} sx={{ color: "var(--text-color)" }}>
            Light up Diwali with{" "}
            <Box component="span" sx={{ color: "var(--primary-color)" }}>Sankamithra</Box>
          </Typography>

          <Typography fontSize={{ xs: 14.5, md: 16 }} color="var(--text-color-secondary)" lineHeight={1.7}>
            A crackers shop in Sivakasi, where almost all of India&apos;s fireworks are
            made. Buying here skips the distributor and city-shop margins. Build your
            order online and we&apos;ll confirm it by phone within 24 hours.
          </Typography>

          <Stack direction="row" gap={1.25} flexWrap="wrap" mt={0.5}>
            <Button component={Link} href="/shop" endIcon={<ArrowForwardRoundedIcon />} sx={primaryBtn}>
              Shop crackers
            </Button>
            <Button component={Link} href="/factory" sx={ghostBtn}>
              Why Sivakasi
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            flex: 1, width: "100%", minWidth: 0,
            borderRadius: "var(--radius-lg)", overflow: "hidden",
            boxShadow: "var(--shadow)",
            "& .carousel .slide img": { display: "block", width: "100%" },
          }}
        >
          <Carousel
            showThumbs={false}
            showStatus={false}
            infiniteLoop
            autoPlay
            interval={5000}
            transitionTime={600}
            emulateTouch
            showArrows={false}
          >
            {["banner2.png", "banner3.png"].map((b) => (
              <Box key={b}>
                <Box component="img" src={assetUrl(b)} alt="" sx={{ width: "100%", display: "block" }} />
              </Box>
            ))}
          </Carousel>
        </Box>
      </Stack>

      {/* Trust strip */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: { xs: 1.25, md: 2 },
        }}
      >
        {TRUST.map((t) => (
          <Stack
            key={t.title}
            direction="row"
            gap={1.25}
            alignItems="flex-start"
            sx={{
              p: { xs: 1.5, md: 2 },
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              backgroundColor: "var(--surface)",
            }}
          >
            <Box sx={{ color: "var(--primary-color)", display: "flex", "& svg": { fontSize: 22 } }}>{t.icon}</Box>
            <Stack minWidth={0}>
              <Typography fontSize={{ xs: 12.5, md: 13.5 }} fontWeight={800} color="var(--text-color)" lineHeight={1.3}>
                {t.title}
              </Typography>
              <Typography fontSize={{ xs: 11, md: 12 }} color="var(--text-color-secondary)" lineHeight={1.4}>
                {t.body}
              </Typography>
            </Stack>
          </Stack>
        ))}
      </Box>
    </Stack>
  );
}

export const primaryBtn = {
  textTransform: "none", fontWeight: 800, fontSize: 15,
  py: 1.2, px: 3, borderRadius: "var(--radius-pill)",
  color: "#fff", backgroundColor: "var(--primary-color)",
  boxShadow: "none",
  "&:hover": { backgroundColor: "var(--primary-dark)", boxShadow: "none" },
};

export const ghostBtn = {
  textTransform: "none", fontWeight: 800, fontSize: 15,
  py: 1.2, px: 3, borderRadius: "var(--radius-pill)",
  color: "var(--text-color)", border: "1.5px solid var(--border-strong)",
  "&:hover": { borderColor: "var(--primary-color)", color: "var(--primary-color)", backgroundColor: "var(--primary-soft)" },
};
