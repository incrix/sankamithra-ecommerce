"use client";
import { Stack, Box, Typography, Button, Divider } from "@mui/material";
import Link from "next/link";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import PriceCheckRoundedIcon from "@mui/icons-material/PriceCheckRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import { PRICE_LIST_URL } from "@/util/config";

/**
 * Wholesale enquiries.
 *
 * Was a bare <h1>Wholesale</h1>. Bulk buying is a real line of business for a
 * manufacturer, so this is a proper page - but it deliberately routes to a
 * phone call or WhatsApp rather than a form, because bulk pricing is negotiated
 * and the site has no working enquiry mailbox today.
 */

const BENEFITS = [
  { icon: <PriceCheckRoundedIcon />, title: "Slab pricing", body: "Rates improve with order size, quoted case by case against the current price list." },
  { icon: <Inventory2RoundedIcon />, title: "Bulk stock", body: "Direct from our own production, so large quantities are available through the season." },
  { icon: <LocalShippingRoundedIcon />, title: "Transport arranged", body: "We help organise licensed transport to your town or godown." },
  { icon: <SupportAgentRoundedIcon />, title: "A person to call", body: "One point of contact from quotation through to dispatch." },
];

const WA = "https://wa.me/919489239970?text=" +
  encodeURIComponent("Hello Sankamithra, I would like a wholesale quotation. My requirement is:");

export default function WholesaleContent() {
  return (
    <main style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Stack
        width="100%"
        maxWidth="var(--max-width)"
        px={{ xs: 2, sm: 3, md: 4 }}
        py={{ xs: 3, md: 5 }}
        gap={{ xs: 4, md: 6 }}
      >
        <Stack gap={1.5} maxWidth={700}>
          <Box sx={{ alignSelf: "flex-start", px: 1.5, py: 0.5, borderRadius: "var(--radius-pill)", backgroundColor: "var(--primary-soft)", color: "var(--primary-color)", fontSize: 12, fontWeight: 800 }}>
            Dealers, retailers &amp; bulk buyers
          </Box>
          <Typography component="h1" fontSize={{ xs: 27, sm: 32, md: 40 }} fontWeight={800} lineHeight={1.15} color="var(--text-color)">Wholesale</Typography>
          <Typography fontSize={{ xs: 14.5, md: 16 }} color="var(--text-color-secondary)" lineHeight={1.8}>
            We supply shops, distributors and event buyers direct from our Sattur
            factory. Send us your requirement and we&apos;ll come back with a
            quotation against the current price list — usually the same day.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} mt={1}>
            <Button href={WA} target="_blank" rel="noopener noreferrer" startIcon={<WhatsAppIcon />} sx={waBtn}>
              WhatsApp your list
            </Button>
            <Button href="tel:+919962066648" startIcon={<PhoneRoundedIcon />} sx={ghostBtn}>
              +91 99620 66648
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: { xs: 1.5, md: 2 } }}>
          {BENEFITS.map((b) => (
            <Stack key={b.title} gap={1.25} sx={{ p: { xs: 2, md: 2.5 }, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", backgroundColor: "var(--surface)" }}>
              <Box sx={{ color: "var(--primary-color)", display: "flex", "& svg": { fontSize: 26 } }}>{b.icon}</Box>
              <Typography fontSize={15} fontWeight={800} color="var(--text-color)">{b.title}</Typography>
              <Typography fontSize={13.5} color="var(--text-color-secondary)" lineHeight={1.7}>{b.body}</Typography>
            </Stack>
          ))}
        </Box>

        <Stack gap={2} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: "var(--radius-lg)", backgroundColor: "var(--primary-softer)", border: "1px solid var(--primary-border)" }}>
          <Typography fontSize={{ xs: 17, md: 20 }} fontWeight={800} color="var(--text-color)">
            How it works
          </Typography>
          <Stack gap={1.5}>
            {[
              "Download the current price list, or browse the catalogue online.",
              "Send us your item list and quantities on WhatsApp, or call the factory.",
              "We confirm availability and quote your slab rate.",
              "On agreement we pack, arrange transport and share dispatch details.",
            ].map((step, i) => (
              <Stack key={step} direction="row" gap={1.5} alignItems="flex-start">
                <Box sx={{ width: 24, height: 24, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", backgroundColor: "var(--primary-color)", color: "#fff", fontSize: 12, fontWeight: 800 }}>
                  {i + 1}
                </Box>
                <Typography fontSize={14} color="var(--text-color)" lineHeight={1.6}>{step}</Typography>
              </Stack>
            ))}
          </Stack>

          <Divider />

          <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>
            <Button href={PRICE_LIST_URL} target="_blank" rel="noopener noreferrer" startIcon={<PictureAsPdfRoundedIcon />} sx={primaryBtn}>
              Download price list
            </Button>
            <Button component={Link} href="/shop" sx={ghostBtn}>
              Browse catalogue
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </main>
  );
}

const base = { textTransform: "none", fontWeight: 800, fontSize: 14.5, py: 1.15, px: 2.75, borderRadius: "var(--radius-pill)" };
const primaryBtn = { ...base, color: "#fff", backgroundColor: "var(--primary-color)", "&:hover": { backgroundColor: "var(--primary-dark)" } };
const waBtn = { ...base, color: "#fff", backgroundColor: "#128c7e", "&:hover": { backgroundColor: "#0f7568" } };
const ghostBtn = { ...base, color: "var(--text-color)", border: "1.5px solid var(--border-strong)", "&:hover": { borderColor: "var(--primary-color)", color: "var(--primary-color)", backgroundColor: "var(--primary-soft)" } };
