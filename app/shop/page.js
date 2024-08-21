import ProductTab from "@/app/components/productTab";
import ShopByCategory from "../components/shopByCategory";
import { Stack } from "@mui/material";

export default function Shop() {
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
        <ProductTab />
      </Stack>
    </main>
  );
}
