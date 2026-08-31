import { Quicksand } from "next/font/google";
import "@/app/globals.css";
import Header from "@/app/components/header";
import { getBanner } from "@/util/settingsStore";
import Footer from "@/app/components/footer";
import ShopChrome from "@/app/components/shopChrome";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CartProvider } from "@/context/CartContext";
import { BillingProvider } from "@/context/BillingContext";
import { ProductProvider } from "@/context/ProductContext";
import { SITE_URL, BUSINESS, KEYWORDS } from "@/util/site";

const quicksand = Quicksand({ subsets: ["latin"], display: "swap" });

export const metadata = {
  // Every relative canonical/OG url below resolves against this.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sankamithra Thunder World | Sivakasi Crackers & Fireworks Online",
    // Each page supplies its own name; the brand is appended once, here.
    template: "%s | Sankamithra Thunder World",
  },
  description: BUSINESS.description,
  keywords: KEYWORDS,
  applicationName: BUSINESS.name,
  authors: [{ name: "Incrix Techlutions LLP" }],
  creator: BUSINESS.name,
  publisher: BUSINESS.name,
  category: "shopping",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: BUSINESS.name,
    title: "Sankamithra Thunder World | Sivakasi Crackers & Fireworks Online",
    description: BUSINESS.description,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: true, address: true, email: true },
};

export const viewport = {
  themeColor: "#ff4800",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  const banner = await getBanner();

  return (
    <html lang="en-IN">
      <body className={quicksand.className}>
        <CartProvider>
          <BillingProvider>
            <ProductProvider>
              {/* Shop chrome is hidden on /admin, which is a work tool */}
              <ShopChrome>
                <Header banner={banner} />
              </ShopChrome>
              {children}
              <ShopChrome>
                <Footer />
              </ShopChrome>
              <GoogleAnalytics gaId="G-BVTWT7NXQW" />
            </ProductProvider>
          </BillingProvider>
        </CartProvider>
      </body>
    </html>
  );
}
