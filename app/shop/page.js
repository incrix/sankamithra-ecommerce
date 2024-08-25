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
        <ShopByCategory />
        <Stack padding={width < 1480 ? "0 40px" : "0"}>
          <ProductTab category={category} />
        </Stack>
      </Stack>
    </main>
  );
}
