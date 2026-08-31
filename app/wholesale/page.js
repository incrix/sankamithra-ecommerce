import WholesaleContent from "@/app/components/pages/wholesale";
import Faq from "@/app/components/Faq";
import { Stack } from "@mui/material";
import { SITE_URL, BUSINESS, KEYWORDS, JsonLd, breadcrumbSchema, faqSchema } from "@/util/site";

export const metadata = {
  title: "Wholesale Crackers Sivakasi — Bulk Fireworks for Dealers",
  description:
    "Buy crackers wholesale direct from a Sivakasi manufacturer. Slab pricing for shops, dealers, distributors and event buyers, bulk stock through the season and transport arranged across India.",
  keywords: [...KEYWORDS, "wholesale crackers Sivakasi", "bulk fireworks dealers", "crackers dealership Tamil Nadu", "fireworks distributor India"],
  alternates: { canonical: `${SITE_URL}/wholesale` },
  openGraph: {
    title: "Wholesale Crackers from Sivakasi | Sankamithra Thunder World",
    description: "Slab pricing for dealers and bulk buyers, direct from our Sattur factory.",
    url: `${SITE_URL}/wholesale`, siteName: BUSINESS.name, type: "website",
  },
};

const FAQS = [
  { q: "Do you sell crackers wholesale?", a: "Yes. We supply shops, distributors and event buyers direct from our Sattur factory, with slab rates that improve as order size increases. Send your item list on WhatsApp to +91 94892 39970 for a quotation." },
  { q: "What is the minimum order for wholesale?", a: "Wholesale rates are quoted case by case against the current price list. Send us your requirement and we will confirm the slab your quantity falls into." },
  { q: "Do you offer crackers dealership in Tamil Nadu?", a: "We supply dealers and retailers across Tamil Nadu and the rest of India. Call +91 99620 66648 to discuss terms for your area." },
  { q: "How is bulk transport arranged?", a: "We help organise licensed transport to your town or godown. Charges and timelines are confirmed with your quotation before dispatch." },
  { q: "Can I get the latest wholesale price list?", a: "Yes — the current price list PDF is downloadable from the site, and we share slab rates against it once we know your quantities." },
];

export default function WholesalePage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Crackers", path: "/" }, { name: "Wholesale", path: "/wholesale" }])} />
      <JsonLd data={faqSchema(FAQS)} />
      <WholesaleContent />
      <Stack width="100%" maxWidth="var(--max-width)" mx="auto" px={{ xs: 2, sm: 3, md: 4 }} pb={{ xs: 4, md: 7 }}>
        <Faq heading="Wholesale questions" faqs={FAQS} />
      </Stack>
    </>
  );
}
