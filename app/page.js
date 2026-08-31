import { Suspense } from "react";
import { Stack, CircularProgress } from "@mui/material";
import ShopClient from "@/app/components/shop/ShopClient";
import CatalogueIndex from "@/app/components/shop/CatalogueIndex";
import {
  SITE_URL, BUSINESS, KEYWORDS, JsonLd, productSlug, priceOf, imageUrl,
  organizationSchema, localBusinessSchema, websiteSchema, faqSchema,
  searchActionSchema, merchantPolicySchema,
} from "@/util/site";
import { getProducts, getCategories } from "@/util/products.server";

/**
 * The shop is the front page.
 *
 * A server component so the title, description and structured data are in the
 * served HTML - the interactive catalogue below is a client component, and its
 * contents are fetched in the browser, which a crawler may never execute. The
 * ItemList schema here is what actually tells an engine what we sell.
 */

export const metadata = {
  title: "Sankamithra Thunder World | Sivakasi Crackers & Fireworks Online",
  description:
    "Buy Sivakasi crackers online from Sankamithra Thunder World, a fireworks and crackers shop in Sivakasi, Tamil Nadu. 145+ Diwali crackers at up to 90% off, delivered across India.",
  keywords: KEYWORDS,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: BUSINESS.name,
    title: "Sankamithra Thunder World | Sivakasi Crackers & Fireworks Online",
    description:
      "Diwali crackers from our Sivakasi shop at up to 90% off. Flower pots, ground chakkars, rockets, aerial shots, sparklers and gift boxes.",
    images: [{ url: `${SITE_URL}/images/logo.png`, width: 512, height: 512, alt: BUSINESS.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sankamithra Thunder World | Sivakasi Crackers Online",
    description: "Buy Diwali crackers online from our Sivakasi shop at up to 90% off.",
  },
};

const FAQS = [
  {
    q: "Who is Sankamithra Thunder World?",
    a: "Sankamithra Thunder World is a fireworks and crackers retailer based in Sivakasi, Tamil Nadu — the town that supplies most of India's fireworks. We stock crackers from licensed Sivakasi units and sell them to families, shops and event buyers across India, online and from our counter.",
  },
  {
    q: "Where is Sankamithra crackers shop in Sivakasi?",
    a: "Our shop is at 3/1427/G6, Opposite PRC Bus Depot, Sattur Road, Sivakasi 626123, Tamil Nadu. We are open Monday to Saturday, 9am to 7pm. Call +91 94892 39970 for directions or to check stock.",
  },
  {
    q: "Can I buy Sivakasi crackers online from Sankamithra?",
    a: "Yes. Browse the catalogue, add crackers to your cart and place your order online. Because the 2018 Supreme Court order does not permit the online sale of firecrackers, your order is treated as an enquiry: we call or WhatsApp you within 24 hours to confirm it before anything is dispatched.",
  },
  {
    q: "How much do Sivakasi crackers cost at Sankamithra?",
    a: "Prices run from around ₹12 for single items to a few thousand rupees for large gift boxes and aerial shots, at up to 90% off the printed list price. The full price list is on this page and downloadable as a PDF; the minimum order value is ₹3,000.",
  },
  {
    q: "What is the minimum order value?",
    a: "₹3,000 for online orders, which covers safe packing and licensed transport. The cart shows exactly how much more you need to add. There is no minimum if you buy at our Sivakasi counter.",
  },
  {
    q: "What types of crackers can I buy?",
    a: "Flower pots, ground chakkars, one sound crackers, atom bombs and bijili, rockets, repeating shots and aerial fancy items, sparklers, twinkling stars, pencils, fountains, and Sankamithra special gift boxes — 145 products across 13 categories.",
  },
  {
    q: "Do you deliver crackers across India?",
    a: "Yes. We arrange licensed transport and deliver across India. Charges and timelines depend on your location and are confirmed on the phone call before dispatch. Fireworks cannot be sent by ordinary courier or air, so delivery is by approved road transport.",
  },
  {
    q: "Do you supply crackers wholesale to shops and dealers?",
    a: "Yes. We supply retailers, distributors and event buyers with slab pricing that improves as order size increases. Send your requirement on WhatsApp to +91 94892 39970 for a quotation against the current price list.",
  },
  {
    q: "Are the crackers you sell safe and certified?",
    a: "We stock only from licensed Sivakasi units, and the range includes green-certified and ISO 9001:2015 compliant products. Everything is stored and handled to licence conditions. Always follow the safety instructions printed on each pack.",
  },
  {
    q: "How do I track my Sankamithra order?",
    a: "Every order gets a reference like STW-0001 the moment it is placed, sent to you by email. Quote it when you call or WhatsApp +91 94892 39970 and we will tell you exactly where your order is.",
  },
];

export default async function HomeShop() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  // Only a slice goes into the ItemList; the sitemap carries all 145 URLs.
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Sankamithra Thunder World crackers",
    numberOfItems: products.length,
    itemListElement: products.slice(0, 40).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/product/${productSlug(p)}`,
      name: p.name,
    })),
  };

  const store = {
    ...localBusinessSchema(),
    makesOffer: categories.map((c) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Product", name: `${c.name} crackers`, category: c.name },
    })),
  };

  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={websiteSchema()} />
      <JsonLd data={store} />
      <JsonLd data={itemList} />
      <JsonLd data={searchActionSchema()} />
      <JsonLd data={merchantPolicySchema()} />
      <JsonLd data={faqSchema(FAQS)} />

      <Suspense
        fallback={
          <Stack alignItems="center" py={10}>
            <CircularProgress sx={{ color: "var(--primary-color)" }} />
          </Stack>
        }
      >
        <ShopClient />
      </Suspense>

      <section style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "var(--max-width)", padding: "0 16px 40px" }}>
          <CatalogueIndex products={products} categories={categories} />
        </div>
      </section>

      {/* Rendered server-side so the answers are in the HTML an engine reads. */}
      <section
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
        aria-labelledby="faq-heading"
      >
        <div style={{ width: "100%", maxWidth: "var(--max-width)", padding: "0 16px 48px" }}>
          <h2 id="faq-heading" style={{ fontSize: 24, marginBottom: 6, color: "var(--text-color)" }}>
            Frequently asked questions
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-color-secondary)", marginBottom: 20 }}>
            About buying Sivakasi crackers online from Sankamithra Thunder World.
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {FAQS.map((f) => (
              <details
                key={f.q}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "14px 16px",
                  background: "var(--surface)",
                }}
              >
                <summary style={{ fontWeight: 800, fontSize: 15, cursor: "pointer", color: "var(--text-color)" }}>
                  {f.q}
                </summary>
                <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.75, color: "var(--text-color-secondary)" }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
