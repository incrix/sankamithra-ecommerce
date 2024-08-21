import { Stack } from "@mui/material";
import Hero from "./components/hero";
import ShopByCategory from "./components/shopByCategory";
import EmailSubscribe from "./components/emailSubscribe";
import FireSafety from "./components/fireSafety";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Stack width={"100%"} maxWidth={"var(--max-width)"}>
        <Hero />
        <ShopByCategory />
        <EmailSubscribe />
        <FireSafety />
      </Stack>
    </main>
  );
}
