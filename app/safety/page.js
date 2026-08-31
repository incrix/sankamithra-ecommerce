import { Stack, Typography, Box } from "@mui/material";
import SafetyTips from "@/app/components/home/SafetyTips";
import Faq from "@/app/components/Faq";
import { SITE_URL, BUSINESS, JsonLd, breadcrumbSchema, faqSchema } from "@/util/site";

export const metadata = {
  title: "Firework Safety Guide — How to Burst Crackers Safely",
  description:
    "How to burst Diwali crackers safely: what to do and what never to do, from a licensed Sivakasi fireworks manufacturer. Supervision, safe distance, water on hand and correct storage.",
  keywords: [
    "firework safety tips", "how to burst crackers safely", "Diwali safety tips",
    "cracker safety rules India", "firework safety for children", "Sankamithra safety",
  ],
  alternates: { canonical: `${SITE_URL}/safety` },
  openGraph: {
    title: "Firework Safety Guide | Sankamithra Thunder World",
    description: "What to do and what never to do when bursting crackers, from a licensed Sivakasi manufacturer.",
    url: `${SITE_URL}/safety`,
    siteName: BUSINESS.name,
    type: "article",
  },
};

const FAQS = [
  {
    q: "How do you burst crackers safely?",
    a: "Burst crackers outdoors in an open area clear of dry grass, wood and buildings. Light one at a time, at arm's length and away from your body, then step back immediately. Keep a bucket of water or a hose within reach, have a responsible adult in charge, and follow the instructions printed on each pack.",
  },
  {
    q: "What should you never do with fireworks?",
    a: "Never give fireworks to children, never carry them in a pocket, never point them at people or animals, never relight or approach a cracker that has failed to go off, never try to extinguish a live firework, and never use metal or glass containers to launch anything.",
  },
  {
    q: "What is a safe distance for bursting crackers?",
    a: "Light the cracker and move back at least 5 metres for ground items such as flower pots and chakkars, and considerably further for aerial items and rockets. Spectators should stand well behind the person lighting, never in front or to the side of an aerial item.",
  },
  {
    q: "How should crackers be stored at home?",
    a: "Keep crackers in their original packaging in a cool, dry place away from any flame, candle, lamp or heat source, and out of reach of children. Never store them near the area where you will be lighting them.",
  },
  {
    q: "What should I do if a cracker does not go off?",
    a: "Leave it alone. Do not go back to it and do not try to relight it. Wait at least 20 minutes, then soak it thoroughly in a bucket of water before disposing of it.",
  },
  {
    q: "Can children burst crackers?",
    a: "Children must never handle or light fireworks themselves. They can watch from a safe distance under the direct supervision of a responsible adult, standing well back from the lighting area.",
  },
  {
    q: "What should I wear when bursting crackers?",
    a: "Wear close-fitting cotton clothing and covered footwear. Avoid loose, flowing or synthetic garments such as silk and nylon, which catch fire easily and burn fast.",
  },
];

export default function Safety() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Crackers", path: "/" }, { name: "Safety", path: "/safety" }])} />
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to burst crackers safely",
          description: "Safe handling of fireworks, from a licensed Sivakasi manufacturer.",
          step: [
            { "@type": "HowToStep", name: "Choose the place", text: "Pick an open outdoor area clear of dry grass, wood, vehicles and buildings." },
            { "@type": "HowToStep", name: "Prepare for fire", text: "Keep a bucket of water, a garden hose or a portable water pump within reach before you light anything." },
            { "@type": "HowToStep", name: "Put an adult in charge", text: "A responsible adult lights every cracker; children watch from a safe distance." },
            { "@type": "HowToStep", name: "Light one at a time", text: "Light a single cracker at arm's length, away from your body, then step back immediately." },
            { "@type": "HowToStep", name: "Leave duds alone", text: "Never return to a cracker that failed to light. Wait 20 minutes, then soak it in water." },
          ],
        }}
      />

      <main style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <Stack width="100%" maxWidth="var(--max-width)" px={{ xs: 2, sm: 3, md: 4 }} py={{ xs: 3, md: 5 }} gap={{ xs: 4, md: 6 }}>
          <Stack gap={1.5} maxWidth={720}>
            <Typography component="h1" fontSize={{ xs: 27, sm: 32, md: 40 }} fontWeight={800} lineHeight={1.15} color="var(--text-color)">
              Firework safety guide
            </Typography>
            <Typography fontSize={{ xs: 15, md: 16.5 }} color="var(--text-color-secondary)" lineHeight={1.85}>
              We manufacture crackers, so we would rather you enjoyed them and went home
              safely. A few minutes of preparation prevents almost every firework injury:
              burst in the open, light one at a time, keep water within reach, and keep
              children watching rather than handling.
            </Typography>
          </Stack>

          <SafetyTips />

          <Faq
            heading="Firework safety questions"
            intro="Straight answers to what people ask us most before Diwali."
            faqs={FAQS}
          />
        </Stack>
      </main>
    </>
  );
}
