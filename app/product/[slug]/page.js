import { notFound } from "next/navigation";
import ProductClient from "@/app/components/shop/ProductClient";
import { getProducts, getProduct } from "@/util/products.server";
import {
  SITE_URL, BUSINESS, JsonLd, productSlug, idFromSlug, priceOf, imageUrl,
  breadcrumbSchema, faqSchema,
} from "@/util/site";

/**
 * One crawlable URL per product.
 *
 * The catalogue previously lived behind /shop/product?id=1 - query-string pages
 * are poorly indexed, so 145 products were effectively invisible to search.
 * Each now has its own address, title, description and Product schema with a
 * price and stock state, which is what puts a result in the shopping carousels.
 */

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: productSlug(p) }));
}

export async function generateMetadata({ params }) {
  const product = await getProduct(idFromSlug(params.slug));
  if (!product) return { title: "Product not found" };

  const price = priceOf(product);
  const url = `${SITE_URL}/product/${productSlug(product)}`;
  const title = `${product.name} — ${product.category} Crackers at ₹${price}`;
  const description =
    `Buy ${product.name} (${product.category}) online from Sankamithra Thunder World, Sivakasi. ` +
    `₹${price} at ${product.discount}% off MRP ₹${product.price}. ` +
    (product.shortDescription || "").slice(0, 110);

  return {
    title,
    description,
    keywords: [
      product.name, `${product.name} price`, `${product.name} online`,
      `${product.category} crackers`, "Sivakasi crackers", "Sankamithra fireworks",
      "Diwali crackers online",
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: BUSINESS.name,
      title,
      description,
      images: [{ url: imageUrl(product.image?.[0]), alt: product.name }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProductPage({ params }) {
  const product = await getProduct(idFromSlug(params.slug));
  if (!product) notFound();

  const price = priceOf(product);
  const url = `${SITE_URL}/product/${productSlug(product)}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    sku: product.sku || String(product.id),
    category: product.category,
    description: product.description || product.shortDescription,
    image: (product.image || []).map(imageUrl),
    brand: { "@type": "Brand", name: "Sankamithra" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price,
      availability:
        product.countInStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@id": `${SITE_URL}/#organization` },
      priceValidUntil: `${new Date().getFullYear() + 1}-03-31`,
    },
  };

  const faqs = [
    {
      q: `How much does ${product.name} cost?`,
      a: `${product.name} is ₹${price} at Sankamithra Thunder World, which is ${product.discount}% off the MRP of ₹${product.price}. Orders are placed online and confirmed by phone within 24 hours.`,
    },
    {
      q: `Is ${product.name} available online?`,
      a:
        product.countInStock > 0
          ? `Yes, ${product.name} is in stock. Add it to your cart and place your order — the minimum order value is ₹3,000 and we deliver across India.`
          : `${product.name} is currently out of stock. Call +91 94892 39970 and we will tell you when it is back.`,
    },
  ];

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Crackers", path: "/" },
          { name: product.category, path: `/?category=${encodeURIComponent(product.category)}` },
          { name: product.name, path: `/product/${productSlug(product)}` },
        ])}
      />
      <JsonLd data={faqSchema(faqs)} />
      <ProductClient initialProduct={product} />
    </>
  );
}
