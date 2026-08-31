import ContactContent from "@/app/components/pages/contact";
import Faq from "@/app/components/Faq";
import { Stack } from "@mui/material";
import { SITE_URL, BUSINESS, KEYWORDS, JsonLd, breadcrumbSchema, faqSchema, localBusinessSchema } from "@/util/site";

export const metadata = {
  title: "Contact Us — Crackers Shop in Sivakasi",
  description:
    "Call, WhatsApp or visit Sankamithra Thunder World. Office: 3/1427/G6, Opposite PRC Bus Depot, Sattur Road, Sivakasi 626123. Factory: Kanmaisurangudi Village, Sattur. Phone +91 99446 95228.",
  keywords: [...KEYWORDS, "Sankamithra contact number", "crackers shop Sivakasi address", "fireworks shop near me Sivakasi"],
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: "Contact Sankamithra Thunder World, Sivakasi",
    description: "Phone, WhatsApp, addresses and directions for our Sivakasi office and Sattur factory.",
    url: `${SITE_URL}/contact`, siteName: BUSINESS.name, type: "website",
  },
};

const FAQS = [
  { q: "What is the Sankamithra Thunder World contact number?", a: "Call +91 99446 95228 or +91 75488 20326 for the office, or +91 99620 66648 and +91 84892 92901 for the factory. You can also WhatsApp +91 94892 39970." },
  { q: "Where is the Sankamithra crackers shop in Sivakasi?", a: "Our office and shop are at 3/1427/G6, Opposite PRC Bus Depot, Sattur Road, Sivakasi 626123, Tamil Nadu." },
  { q: "What are your opening hours?", a: "We are open Monday to Saturday, 9am to 7pm. Orders placed online are confirmed by phone or WhatsApp within 24 hours." },
  { q: "How do I track my order?", a: "Every order gets a reference like STW-0001 when you place it. Quote that on the phone or on WhatsApp and we will tell you exactly where it is." },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={breadcrumbSchema([{ name: "Crackers", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <JsonLd data={faqSchema(FAQS)} />
      <ContactContent />
      <Stack width="100%" maxWidth="var(--max-width)" mx="auto" px={{ xs: 2, sm: 3, md: 4 }} pb={{ xs: 4, md: 7 }}>
        <Faq heading="Contact questions" faqs={FAQS} />
      </Stack>
    </>
  );
}
