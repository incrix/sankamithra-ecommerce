import FactoryContent from "@/app/components/pages/factory";
import Faq from "@/app/components/Faq";
import { Stack } from "@mui/material";
import { SITE_URL, BUSINESS, KEYWORDS, JsonLd, breadcrumbSchema, faqSchema, organizationSchema } from "@/util/site";

export const metadata = {
  title: "Why Sivakasi — Where Our Crackers Come From",
  description:
    "Sivakasi makes most of India's fireworks. Sankamithra Thunder World is a crackers shop in the town itself, buying from licensed units so you skip the distributor and city-retailer margins.",
  keywords: [...KEYWORDS, "why Sivakasi crackers", "Sivakasi fireworks industry", "crackers direct from Sivakasi", "Sivakasi cracker shops"],
  alternates: { canonical: `${SITE_URL}/factory` },
  openGraph: {
    title: "Why Sivakasi — Where Our Crackers Come From",
    description: "A crackers shop in the town that makes most of India's fireworks.",
    url: `${SITE_URL}/factory`, siteName: BUSINESS.name, type: "website",
  },
};

const FAQS = [
  { q: "Does Sankamithra Thunder World make its own crackers?", a: "No. We are a retailer, not a manufacturer. We buy from licensed manufacturing units in and around Sivakasi and sell from our shop on Sattur Road and online." },
  { q: "Why is Sivakasi famous for fireworks?", a: "Sivakasi in Virudhunagar district, Tamil Nadu, has made fireworks for close to a century and produces the large majority of India's crackers. The dry climate suited the industry, and the skills have passed through generations of local families." },
  { q: "Is it cheaper to buy crackers from Sivakasi?", a: "Yes, usually a lot cheaper. Buying from a shop in Sivakasi skips the distributor and city-retailer margins that a box normally collects on its way elsewhere, which is why our list runs up to 80% below MRP." },
  { q: "Are the crackers you sell green certified?", a: "The range includes green-certified and ISO 9001:2015 compliant products from licensed units. Ask us about a specific item and we will tell you exactly what it carries." },
  { q: "Can I visit your Sivakasi shop?", a: "Yes. We are at 3/1427/G6, Opposite PRC Bus Depot, Sattur Road, Sivakasi 626123, open Monday to Saturday, 9am to 7pm. Call +91 94892 39970 before a large purchase so we can have the stock ready." },
];

export default function FactoryPage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={breadcrumbSchema([{ name: "Crackers", path: "/" }, { name: "Why Sivakasi", path: "/factory" }])} />
      <JsonLd data={faqSchema(FAQS)} />
      <FactoryContent />
      <Stack width="100%" maxWidth="var(--max-width)" mx="auto" px={{ xs: 2, sm: 3, md: 4 }} pb={{ xs: 4, md: 7 }}>
        <Faq heading="About Sivakasi and our stock" faqs={FAQS} />
      </Stack>
    </>
  );
}
