"use client";
import Stack from "@mui/material/Stack";
import Fab from "@mui/material/Fab";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useRouter } from "next/navigation";

export default function PdfCartFloating() {
  const router = useRouter();

  const handlePdfDownload = async () => {
    const pdfUrl = "https://e-com.incrix.com/Sankamithra%20Products/SANKAMITHRA%20THUNDER%20WORLD%20PRICE%20LIST%202025.pdf";
    const fileName = "SANKAMITHRA THUNDER WORLD PRICE LIST 2025.pdf";

    try {
      // Open PDF in a new tab
      window.open(pdfUrl, "_blank");

      // Fetch the PDF to trigger download
      const response = await fetch(pdfUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch the PDF");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download the PDF. Please try downloading it manually from the opened tab.");
    }
  };

  return (
    <Stack
      spacing={2}
      sx={{
        position: "fixed",
        bottom: 90,
        right: { xs: 20, md: 20 },
        zIndex: 1000,
      }}
    >
      {/* PDF Button */}
      <Fab
        aria-label="pdf"
        onClick={handlePdfDownload}
        sx={{
          color: "white",
          backgroundColor: "var(--primary-color)",
          "&:hover": {
            opacity: 0.9,
            backgroundColor: "var(--primary-color)",
          },
        }}
      >
        <PictureAsPdfIcon />
      </Fab>

      {/* Cart Button */}
      {/* <Fab
        aria-label="cart"
        onClick={() => router.push("/Cart")}
        sx={{
          color: "white",
          backgroundColor: "var(--primary)",
          "&:hover": {
            opacity: 0.9,
            backgroundColor: "var(--primary)",
          },
        }}
      >
        <ShoppingCartIcon />
      </Fab> */}
    </Stack>
  );
}