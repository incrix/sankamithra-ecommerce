import FactoryContent from "@/app/components/pages/factory";
import Faq from "@/app/components/Faq";
import { Stack } from "@mui/material";
import { SITE_URL, BUSINESS, KEYWORDS, JsonLd, breadcrumbSchema, faqSchema, organizationSchema } from "@/util/site";

export const metadata = {
  title: "Our Fireworks Factory in Sattur, Sivakasi",
  description:
    "Inside the Sankamithra Thunder World fireworks factory at Kanmaisurangudi Village, Sattur, near Sivakasi. Licensed manufacturing, green-certified and ISO 9001:2015, crackers made in-house and sold direct.",
  keywords: [...KEYWORDS, "fireworks factory Sattur", "cracker factory Sivakasi", "fireworks manufacturing Tamil Nadu"],
  alternates: { canonical: `${SITE_URL}/factory` },
  openGraph: {
    title: "Our Fireworks Factory in Sattur, Sivakasi",
    description: "Licensed, green-certified and ISO 9001:2015 cracker manufacturing in the Sivakasi belt.",
    url: `${SITE_URL}/factory`, siteName: BUSINESS.name, type: "website",
  },
};

const FAQS = [
  { q: "Where is the Sankamithra fireworks factory?", a: "Our factory is at 9/241, Kanmaisurangudi Village, Sattur 626203, Tamil Nadu, in the Sivakasi fireworks belt. Our office is at 3/1427/G6, Opposite PRC Bus Depot, Sattur Road, Sivakasi 626123." },
  { q: "Do you manufacture your own crackers?", a: "Yes. Every cracker we sell is mixed, filled and finished at our own licensed unit in Sattur. We do not buy in stock from other manufacturers and relabel it." },
  { q: "Is the factory licensed and certified?", a: "Yes. We hold the required manufacturing licences with controlled magazines and trained handling, and we are green-certified and ISO 9001:2015 compliant." },
  { q: "Can I visit the factory?", a: "Factory access is restricted for safety and licensing reasons. Dealers and bulk buyers can arrange a visit by calling +91 99620 66648 in advance." },
];

export default function FactoryPage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={breadcrumbSchema([{ name: "Crackers", path: "/" }, { name: "Factory", path: "/factory" }])} />
      <JsonLd data={faqSchema(FAQS)} />
      <FactoryContent />
      <Stack width="100%" maxWidth="var(--max-width)" mx="auto" px={{ xs: 2, sm: 3, md: 4 }} pb={{ xs: 4, md: 7 }}>
        <Faq heading="About our factory" faqs={FAQS} />
      </Stack>
    </>
  );
}
