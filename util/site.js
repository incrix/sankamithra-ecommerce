/**
 * Single source of truth for site identity, search keywords and structured data.
 *
 * Everything an engine reads about this business - the name it trades under,
 * where it is, what it sells, what questions it answers - is declared once here
 * and consumed by every page's metadata and JSON-LD.
 */

import { assetUrl } from "@/util/config";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://thunder.sankamithra.com"
).replace(/\/$/, "");

export const BUSINESS = {
  name: "Sankamithra Thunder World",
  legalName: "Sankamithra Thunder World",
  alternateName: ["Sankamithra Fireworks", "Sankamithra Crackers", "Sankamithra"],
  tagline: "Fireworks & Crackers from Sivakasi",
  description:
    "Sankamithra Thunder World is a fireworks and crackers retailer in Sivakasi, Tamil Nadu. Buy Diwali crackers online from our Sivakasi shop at up to 80% off, with delivery across India.",
  phone: ["+91 94892 39970", "+91 75488 20326", "+91 99620 66648", "+91 84892 92901"],
  whatsapp: "919489239970",
  email: "sankamithrathunderworld@gmail.com",
  office: {
    street: "3/1427/G6, Opposite PRC Bus Depot, Sattur Road",
    locality: "Sivakasi",
    region: "Tamil Nadu",
    postalCode: "626123",
    country: "IN",
  },
  geo: { latitude: 9.2988567, longitude: 77.8711883 },
  openingHours: "Mo-Sa 09:00-19:00",
  founded: "2018",
};

/**
 * Search terms real customers use. These inform copy and metadata - they are
 * never stuffed into a hidden block, which search engines discount and can
 * penalise.
 */
export const KEYWORDS = [
  "Sankamithra",
  "Sankamithra fireworks",
  "Sankamithra Thunder World",
  "Sankamithra crackers Sivakasi",
  "fireworks shop in Sivakasi",
  "crackers shop in Sivakasi",
  "Sivakasi crackers online",
  "buy crackers online Tamil Nadu",
  "Diwali crackers online",
  "Diwali crackers offer 2025",
  "crackers price list Sivakasi",
  "Sivakasi crackers direct purchase",
  "online crackers shopping India",
  "crackers wholesale Sivakasi",
  "cheap crackers online India",
  "gift box crackers Sivakasi",
  "flower pots crackers",
  "ground chakkar online",
  "sparklers online India",
  "aerial shots crackers",
  "rockets crackers online",
  "crackers home delivery Tamil Nadu",
];

/** URL-safe, stable, human-readable product slug: "lucky-money-1". */
export const productSlug = (p) =>
  `${String(p.name)
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${p.id}`;

export const idFromSlug = (slug) => {
  const m = String(slug || "").match(/-(\d+)$/);
  return m ? Number(m[1]) : null;
};

export const categorySlug = (c) =>
  String(c).toLowerCase().replace(/['']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Discounted unit price, matching the cart, checkout and invoice. */
export const priceOf = (p) => Math.round(p.price - (p.price * (p.discount || 0)) / 100);

/**
 * Absolute image URL for structured data. Search engines need a fully-qualified
 * address, and product artwork lives on the asset host, not this origin.
 */
export const imageUrl = (path) => {
  if (!path) return `${SITE_URL}/images/logo.png`;
  const url = assetUrl(path);
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
};

/** Renders a JSON-LD block. Next injects it into the served HTML. */
export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const organizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: BUSINESS.name,
  legalName: BUSINESS.legalName,
  alternateName: BUSINESS.alternateName,
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo.png`,
  description: BUSINESS.description,
  foundingDate: BUSINESS.founded,
  telephone: BUSINESS.phone[0],
  email: BUSINESS.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: BUSINESS.office.street,
    addressLocality: BUSINESS.office.locality,
    addressRegion: BUSINESS.office.region,
    postalCode: BUSINESS.office.postalCode,
    addressCountry: BUSINESS.office.country,
  },
});

/**
 * The shop itself. "Store" rather than a manufacturing type, because that is
 * what Sankamithra is — and a local search result is judged on address, hours,
 * phone and area served, all of which are declared here.
 */
export const localBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": ["Store", "LocalBusiness"],
  "@id": `${SITE_URL}/#store`,
  name: BUSINESS.name,
  image: `${SITE_URL}/images/logo.png`,
  url: SITE_URL,
  telephone: BUSINESS.phone[0],
  email: BUSINESS.email,
  priceRange: "₹₹",
  description: BUSINESS.description,
  address: {
    "@type": "PostalAddress",
    streetAddress: BUSINESS.office.street,
    addressLocality: BUSINESS.office.locality,
    addressRegion: BUSINESS.office.region,
    postalCode: BUSINESS.office.postalCode,
    addressCountry: BUSINESS.office.country,
  },
  geo: { "@type": "GeoCoordinates", latitude: BUSINESS.geo.latitude, longitude: BUSINESS.geo.longitude },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "09:00",
    closes: "19:00",
  },
  areaServed: [
    { "@type": "Country", name: "India" },
    { "@type": "State", name: "Tamil Nadu" },
  ],
  currenciesAccepted: "INR",
  paymentAccepted: "Cash, UPI, Bank Transfer",
  keywords: KEYWORDS.slice(0, 10).join(", "),
  slogan: "Sivakasi crackers, straight from the town that makes them",
  hasMap: `https://www.google.com/maps/search/?api=1&query=${BUSINESS.geo.latitude},${BUSINESS.geo.longitude}`,
  sameAs: [],
});

/**
 * Tells a search engine the site has its own search, which can earn a sitelinks
 * search box in results.
 */
export const searchActionSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website-search`,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

/** Delivery, payment and returns, so an answer engine can state them directly. */
export const merchantPolicySchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#policies`,
  name: BUSINESS.name,
  hasMerchantReturnPolicy: {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "IN",
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    merchantReturnLink: `${SITE_URL}/contact`,
  },
  makesOffer: {
    "@type": "Offer",
    priceCurrency: "INR",
    eligibleTransactionVolume: {
      "@type": "PriceSpecification",
      minPrice: 3000,
      priceCurrency: "INR",
      description: "Minimum order value for online orders",
    },
    availableDeliveryMethod: "https://schema.org/ParcelService",
    areaServed: { "@type": "Country", name: "India" },
  },
});

export const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: BUSINESS.name,
  description: BUSINESS.description,
  publisher: { "@id": `${SITE_URL}/#organization` },
});

export const breadcrumbSchema = (trail) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.name,
    item: `${SITE_URL}${t.path}`,
  })),
});

/** Answer-engine friendly: a plain question/answer pair list. */
export const faqSchema = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});
