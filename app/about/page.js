import { Stack, Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import CategoryGrid from "@/app/components/home/CategoryGrid";
import Faq from "@/app/components/Faq";
import {
  SITE_URL, BUSINESS, KEYWORDS, JsonLd, organizationSchema, breadcrumbSchema, faqSchema,
} from "@/util/site";
import { getCategories, getProducts } from "@/util/products.server";

export const metadata = {
  title: "About Us — Crackers Shop in Sivakasi, Tamil Nadu",
  description:
    "Sankamithra Thunder World is a fireworks and crackers retailer in Sivakasi, Tamil Nadu. Who we are, what we stock, and why buying from Sivakasi itself costs less.",
  keywords: [...KEYWORDS, "about Sankamithra", "Sivakasi crackers shop", "crackers dealer Tamil Nadu", "fireworks retailer Sivakasi"],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "About Sankamithra Thunder World | Sivakasi Crackers Shop",
    description: BUSINESS.description,
    url: `${SITE_URL}/about`,
    siteName: BUSINESS.name,
    type: "website",
  },
};

const FAQS = [
  {
    q: "What is Sankamithra Thunder World?",
    a: "Sankamithra Thunder World is a fireworks and crackers retailer in Sivakasi, Tamil Nadu. We have been selling crackers since 2018, from our shop on Sattur Road and online to customers, retailers and event buyers across India.",
  },
  {
    q: "Why are Sankamithra crackers cheaper than city shops?",
    a: "Because we are in Sivakasi, where the crackers are made. We buy in bulk from licensed units here and sell straight to you, so the order skips the layers of distributors and city retailers that each add a margin. That is how the list runs up to 90% below MRP.",
  },
  {
    q: "Do you make your own crackers?",
    a: "No — we are a retailer, not a manufacturer. We select and stock crackers from licensed manufacturing units in and around Sivakasi, which lets us carry a much wider range than any single maker produces.",
  },
  {
    q: "Why does buying from Sivakasi matter?",
    a: "Sivakasi and the surrounding Virudhunagar district produce the large majority of India's fireworks. Buying from a shop in the town itself means shorter supply chains, fresher stock and better prices than the same items reach elsewhere.",
  },
  {
    q: "Are the crackers you sell licensed and certified?",
    a: "Yes. We stock only from licensed units, and the range includes green-certified and ISO 9001:2015 compliant products. Stock is stored and handled to licence conditions.",
  },
  {
    q: "How do I contact Sankamithra Thunder World?",
    a: "Call or WhatsApp +91 94892 39970, call +91 75488 20326, or email sankamithrathunderworld@gmail.com. The shop is at 3/1427/G6, Opposite PRC Bus Depot, Sattur Road, Sivakasi 626123, open Monday to Saturday, 9am to 7pm.",
  },
];

const PILLARS = [
  ["Bought where they are made", "We are in Sivakasi, so we buy from licensed units here rather than through distributors. Shorter chain, fresher stock, better price."],
  ["Up to 90% off list prices", "Skipping the distributor and city-retailer margins is what makes the saving; it shows on every line of the price list."],
  ["A range no single maker offers", "Stocking across many Sivakasi units means 145 products in 13 categories, from ₹12 sparklers to large gift boxes."],
  ["Licensed stock, safely handled", "Green-certified and ISO 9001:2015 compliant products, stored and handled to licence conditions, with transport arranged across India."],
];

export default async function About() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);

  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={breadcrumbSchema([{ name: "Crackers", path: "/" }, { name: "About", path: "/about" }])} />
      <JsonLd data={faqSchema(FAQS)} />

      <main style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <Stack width="100%" maxWidth="var(--max-width)" px={{ xs: 2, sm: 3, md: 4 }} py={{ xs: 3, md: 5 }} gap={{ xs: 4, md: 7 }}>
          <Stack gap={2} maxWidth={760}>
            <Box sx={{ alignSelf: "flex-start", px: 1.5, py: 0.5, borderRadius: "var(--radius-pill)", backgroundColor: "var(--primary-soft)", color: "var(--primary-color)", fontSize: 12, fontWeight: 800 }}>
              Sattur · Sivakasi · Tamil Nadu
            </Box>
            <Typography component="h1" fontSize={{ xs: 27, sm: 32, md: 40 }} fontWeight={800} lineHeight={1.15} color="var(--text-color)">
              About Sankamithra Thunder World
            </Typography>
            <Typography fontSize={{ xs: 15, md: 16.5 }} color="var(--text-color-secondary)" lineHeight={1.85}>
              Sankamithra Thunder World is a fireworks and crackers shop in Sivakasi,
              Tamil Nadu — the town that produces most of India&apos;s fireworks. We
              stock from licensed units across the Sivakasi belt and sell to families,
              retailers and event buyers, over the counter and online across the country.
            </Typography>
            <Typography fontSize={{ xs: 14.5, md: 15.5 }} color="var(--text-color-secondary)" lineHeight={1.85}>
              Being in Sivakasi is the whole point. A box that picks up a distributor,
              a wholesaler and a city retailer on its way to a shop elsewhere reaches
              you here with none of those margins — which is why the price list runs up
              to 90% below MRP across {products.length} products.
            </Typography>

            <Stack direction="row" gap={1.25} flexWrap="wrap" mt={1}>
              <Button component={Link} href="/" sx={primaryBtn}>Browse the catalogue</Button>
              <Button component={Link} href="/factory" sx={ghostBtn}>Why Sivakasi</Button>
            </Stack>
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: { xs: 1.5, md: 2 } }}>
            {PILLARS.map(([title, body]) => (
              <Stack key={title} gap={1} sx={{ p: { xs: 2, md: 2.5 }, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", backgroundColor: "var(--surface)" }}>
                <Typography component="h2" fontSize={16} fontWeight={800} color="var(--text-color)">{title}</Typography>
                <Typography fontSize={14} color="var(--text-color-secondary)" lineHeight={1.75}>{body}</Typography>
              </Stack>
            ))}
          </Box>

          <Stack gap={2}>
            <Stack gap={0.5}>
              <Typography component="h2" fontSize={{ xs: 20, md: 26 }} fontWeight={800} color="var(--text-color)">
                What we stock
              </Typography>
              <Typography fontSize={14} color="var(--text-color-secondary)" lineHeight={1.8}>
                {categories.length} categories across {products.length} products — flower pots, ground
                chakkars, one sound crackers, rockets, aerial repeating shots, sparklers,
                twinkling stars, atom bombs, bijili, pencils, fountains and gift boxes.
              </Typography>
            </Stack>
            <CategoryGrid />
          </Stack>

          <Faq
            heading="About Sankamithra Thunder World"
            intro="Common questions about who we are and how we work."
            faqs={FAQS}
          />
        </Stack>
      </main>
    </>
  );
}

const base = { textTransform: "none", fontWeight: 800, fontSize: 15, py: 1.2, px: 3, borderRadius: "var(--radius-pill)" };
const primaryBtn = { ...base, color: "#fff", backgroundColor: "var(--primary-color)", "&:hover": { backgroundColor: "var(--primary-dark)" } };
const ghostBtn = { ...base, color: "var(--text-color)", border: "1.5px solid var(--border-strong)", "&:hover": { borderColor: "var(--primary-color)", color: "var(--primary-color)", backgroundColor: "var(--primary-soft)" } };
