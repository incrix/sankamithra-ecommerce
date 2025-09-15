"use client";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
import { Stack } from "@mui/material";

export default function HeroCarousel() {
  return (
    <Stack width={"100%"}>
      <Carousel
        infiniteLoop
        interval={5000}
        autoPlay
        stopOnHover
        showThumbs={false}
        showStatus={false}
        showArrows={false}
      >
        <Stack
          borderRadius={{
            md: 0,
            lg: "20px",
          }}
          overflow={"hidden"}
        >
          {/* Fetched image from the first URL */}
          <img
            src="https://e-com.incrix.com/Sankamithra%20Products/banner2.png"
            alt="Carousel Image 1"
          />
        </Stack>
        <Stack
          borderRadius={{
            md: 0,
            lg: "20px",
          }}
          overflow={"hidden"}
        >
          {/* Fetched image from the second URL */}
          <img
            src="https://e-com.incrix.com/Sankamithra%20Products/banner3.png"
            alt="Carousel Image 2"
          />
        </Stack>
      </Carousel>
    </Stack>
  );
}
