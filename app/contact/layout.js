import { Quicksand } from "next/font/google";
import "@/app/globals.css";
import AnnounceBar from "@/app/components/announceBar";
import NavBarOne from "@/app/components/navBarOne";
import NavBarTwo from "@/app/components/navBarTwo";
import Footer from "@/app/components/footer";

const quicksand = Quicksand({ subsets: ["latin"] });

export const metadata = {
  title: "Contact - Sankamithra | Fireworks | Crackers | Sivakasi",
  description:
    "Sankamithra is a leading fireworks and crackers shop in Sivakasi. We provide a wide range of fireworks and crackers for all occasions.",
  keyWords: "fireworks, crackers, sivakasi, sankamithra, contact",
  author: "Incrix Techlutions LLP",
  url: "https://sankamithra.com",
  type: "website",
  siteName: "Sankamithra",
  robots: "index, follow",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={quicksand.className}>
        <AnnounceBar />
        <NavBarOne />
        <NavBarTwo />
        {children}
        <Footer />
      </body>
    </html>
  );
}
