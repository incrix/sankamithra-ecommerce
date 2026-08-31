import { Suspense } from "react";
import { Stack, CircularProgress } from "@mui/material";
import ShopClient from "@/app/components/shop/ShopClient";
import CatalogueIndex from "@/app/components/shop/CatalogueIndex";
import {
  SITE_URL, BUSINESS, KEYWORDS, JsonLd, productSlug, priceOf, imageUrl,
  organizationSchema, localBusinessSchema, websiteSchema, faqSchema,
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
    "Buy Sivakasi crackers online from Sankamithra Thunder World, a fireworks manufacturer in Sattur, Sivakasi. 145+ Diwali crackers at up to 90% off, direct factory prices, all-India delivery.",
  keywords: KEYWORDS,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: BUSINESS.name,
    title: "Sankamithra Thunder World | Sivakasi Crackers & Fireworks Online",
    description:
      "Diwali crackers direct from our Sivakasi factory at up to 90% off. Flower pots, ground chakkars, rockets, aerial shots, sparklers and gift boxes.",
    images: [{ url: `${SITE_URL}/images/logo.png`, width: 512, height: 512, alt: BUSINESS.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sankamithra Thunder World | Sivakasi Crackers Online",
    description: "Buy Diwali crackers online direct from our Sivakasi factory at up to 90% off.",
  },
};

const FAQS = [
  {
    q: "Who is Sankamithra Thunder World?",
    a: "Sankamithra Thunder World is a fireworks and crackers manufacturer based in Sattur, near Sivakasi in Tamil Nadu. We make what we sell in our own licensed factory and sell direct to customers and dealers across India, which is how we can offer up to 90% off list prices.",
  },
  {
    q: "Where is Sankamithra fireworks located in Sivakasi?",
    a: "Our office is at 3/1427/G6, Opposite PRC Bus Depot, Sattur Road, Sivakasi 626123, and our factory is at 9/241, Kanmaisurangudi Village, Sattur 626203, Tamil Nadu. You can reach us on +91 99446 95228.",
  },
  {
    q: "Can I buy Sivakasi crackers online from Sankamithra?",
    a: "Yes. Browse the catalogue, add crackers to your cart and place your order online. Because the 2018 Supreme Court order does not permit the online sale of firecrackers, we treat your order as an enquiry: we call or WhatsApp you within 24 hours to confirm it before anything is dispatched.",
  },
  {
    q: "What is the minimum order value?",
    a: "The minimum order value is ₹3,000. The cart shows exactly how much more you need to add to reach it.",
  },
  {
    q: "What types of crackers do you sell?",
    a: "We stock flower pots, ground chakkars, one sound crackers, atom bombs and bijili, rockets, repeating shots and aerial fancy items, sparklers, twinkling stars, pencils, fountains and Sankamithra special gift items.",
  },
  {
    q: "Do you deliver crackers across India?",
    a: "Yes, we arrange licensed transport and deliver across India. Delivery timelines and charges depend on your location, and we confirm them on the phone call before dispatch.",
  },
  {
    q: "Do you supply crackers wholesale to shops and dealers?",
    a: "Yes. We supply retailers, distributors and event buyers direct from the factory with slab pricing that improves with order size. Send your requirement on WhatsApp to +91 94892 39970 for a quotation.",
  },
  {
    q: "Are Sankamithra crackers certified and safe?",
    a: "Yes. We are a licensed manufacturer, green-certified and ISO 9001:2015 compliant, with controlled storage and trained handling at every stage of production.",
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
