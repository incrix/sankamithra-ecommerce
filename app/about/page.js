import { Stack, Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import CategoryGrid from "@/app/components/home/CategoryGrid";
import Faq from "@/app/components/Faq";
import {
  SITE_URL, BUSINESS, KEYWORDS, JsonLd, organizationSchema, breadcrumbSchema, faqSchema,
} from "@/util/site";
import { getCategories, getProducts } from "@/util/products.server";

export const metadata = {
  title: "About Us — Fireworks Manufacturer in Sivakasi",
  description:
    "Sankamithra Thunder World is a licensed fireworks and crackers manufacturer in Sattur, Sivakasi, Tamil Nadu. Learn who we are, what we make, and why buying direct from the factory costs less.",
  keywords: [...KEYWORDS, "about Sankamithra", "Sivakasi fireworks company", "cracker manufacturer Tamil Nadu"],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "About Sankamithra Thunder World | Sivakasi Fireworks Manufacturer",
    description: BUSINESS.description,
    url: `${SITE_URL}/about`,
    siteName: BUSINESS.name,
    type: "website",
  },
};

const FAQS = [
  {
    q: "What is Sankamithra Thunder World?",
    a: "Sankamithra Thunder World is a fireworks and crackers manufacturer in Sattur, near Sivakasi in Tamil Nadu. We have been making crackers in the Sivakasi belt since 2018 and sell direct to customers, retailers and event buyers across India.",
  },
  {
    q: "Why are Sankamithra crackers cheaper than shops?",
    a: "Because we manufacture what we sell. There is no distributor or wholesaler markup between our factory floor and your order, which is how we can list crackers at up to 90% off MRP.",
  },
  {
    q: "Is Sivakasi really the home of Indian fireworks?",
    a: "Yes. Sivakasi and the surrounding Sattur belt in Virudhunagar district produce the large majority of India's fireworks. Sankamithra Thunder World manufactures in this belt, at our own licensed unit in Kanmaisurangudi Village, Sattur.",
  },
  {
    q: "Are your crackers licensed and certified?",
    a: "Yes. We hold the required manufacturing licences and are green-certified and ISO 9001:2015 compliant, with controlled storage and trained handling at every stage.",
  },
  {
    q: "How do I contact Sankamithra Thunder World?",
    a: "Call +91 99446 95228 or +91 75488 20326, WhatsApp +91 94892 39970, or email sankamithrathunderworld@gmail.com. Our office is at 3/1427/G6, Opposite PRC Bus Depot, Sattur Road, Sivakasi 626123.",
  },
];

const PILLARS = [
  ["Direct from the factory", "Every cracker is mixed, filled and finished at our own unit in Sattur. Nothing is bought in and relabelled, so quality is ours to answer for."],
  ["Up to 90% off list prices", "Selling direct removes the distributor markup. The saving shows on every line of the price list."],
  ["Licensed and certified", "A licensed manufacturer, green-certified and ISO 9001:2015 compliant, with controlled magazines and trained handling."],
  ["All-India delivery", "We arrange licensed transport and deliver across India, confirming charges and timelines on the call before dispatch."],
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
              Sankamithra Thunder World is a fireworks and crackers manufacturer in the
              Sivakasi belt of Tamil Nadu — the region that produces most of India&apos;s
              fireworks. We make our crackers at our own licensed factory in
              Kanmaisurangudi Village, Sattur, and sell them direct to families, shops
              and event buyers across the country.
            </Typography>
            <Typography fontSize={{ xs: 14.5, md: 15.5 }} color="var(--text-color-secondary)" lineHeight={1.85}>
              Buying direct is the whole point. There is no distributor between our
              factory floor and your Diwali, so a box that would carry three markups in
              a shop reaches you at close to what it costs to make — which is why our
              price list runs up to 90% below MRP on {products.length} products.
            </Typography>

            <Stack direction="row" gap={1.25} flexWrap="wrap" mt={1}>
              <Button component={Link} href="/" sx={primaryBtn}>Browse the catalogue</Button>
              <Button component={Link} href="/factory" sx={ghostBtn}>See the factory</Button>
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
                What we manufacture
              </Typography>
              <Typography fontSize={14} color="var(--text-color-secondary)" lineHeight={1.8}>
                {categories.length} categories across {products.length} products — from flower pots and
                ground chakkars to rockets, aerial repeating shots, sparklers, twinkling
                stars, atom bombs, bijili and Sankamithra special gift items.
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
