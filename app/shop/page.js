"use client";
import ProductTab from "@/app/components/productTab";
import ShopByCategory from "../components/shopByCategory";
import { Stack } from "@mui/material";
import useWindowSize from "@/util/windowSize";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/context/ProductContext";
import FloatTopButton from "../components/floatTopButton";

export default function Shop() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  console.log(category);
  const { width } = useWindowSize();
  const { searchTerm } = useProducts();
  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Stack width={"100%"} maxWidth={"var(--max-width)"} padding={"40px 0"}>
        <Stack
          m={{
            xs: "0 20px",
            sm: "0 40px",
          }}
        >
          <ShopByCategory />
        </Stack>
        <ProductTab category={category} searchTerm={searchTerm} />
      </Stack>
      <FloatTopButton />
    </main>
  );
}
