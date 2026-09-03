import { SITE_URL } from "@/util/site";

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/checkout", "/cart", "/wholesale-list"] },
      // Answer engines are welcomed explicitly rather than left to the wildcard.
      { userAgent: ["GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "OAI-SearchBot"], allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
