"use client";
import { Stack, Grid } from "@mui/material";
import HeroCategory from "./heroCategory";
import HeroCarousel from "./heroCarousel";
import ProductTab from "./productTab";
import useWindowSize from "@/util/windowSize";

export default function Hero() {
  const { width } = useWindowSize();
  return (
    <Stack
      sx={{
        margin: {
          md: "40px 0",
          lg: "40px",
        },
      }}
    >
      <Grid container spacing={2} direction={"row"}>
        {width > 1024 && (
          <Grid position={"relative"} item xs={width > 1300 ? 3 : 4}>
            <HeroCategory />
          </Grid>
        )}
        <Grid item xs={width > 1300 ? 9 : width > 1024 ? 8 : 12}>
          <HeroCarousel />
          <ProductTab />
          <Stack
            display={{
              sm: "flex",
              md: "none",
            }}
            width={"100%"}
            alignItems={"center"}
            margin={"40px 0 0 0"}
            padding={"20px"}
          >
            <HeroCategory />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
