"use client";
import ProductTab from "@/app/components/productTab";
import ShopByCategory from "../components/shopByCategory";
import { Stack } from "@mui/material";
import useWindowSize from "@/util/windowSize";
import { useSearchParams } from "next/navigation";

export default function Shop() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  console.log(category);
  const { width } = useWindowSize();
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
            xs: "20px",
            sm: "40px",
          }}
        >
          <ShopByCategory />
        </Stack>
        <ProductTab category={category} />
      </Stack>
    </main>
  );
}
