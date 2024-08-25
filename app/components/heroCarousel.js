"use client";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
import { Stack } from "@mui/material";
import tabPanel from "../../public/temp/Tabpanel.png";
import Carousel1 from "@/public/images/Carosal1.jpg";
import Carousel2 from "@/public/images/Carosal2.jpg";

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
          <img src={Carousel1.src} />
        </Stack>
        <Stack
          borderRadius={{
            md: 0,
            lg: "20px",
          }}
          overflow={"hidden"}
        >
          <img src={Carousel2.src} />
        </Stack>
        <Stack
          borderRadius={{
            md: 0,
            lg: "20px",
          }}
          overflow={"hidden"}
        >
          <img
            style={{
              borderRadius: "20px",
            }}
            src={tabPanel.src}
          />
        </Stack>
      </Carousel>
    </Stack>
  );
}
