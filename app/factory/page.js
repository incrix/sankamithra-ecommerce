import { Stack, Typography } from "@mui/material";
import { Quicksand } from "next/font/google";
import FacImg from "@/public/images/fac.jpg";
import factory1 from "@/public/images/factory1.jpg";
import factory2 from "@/public/images/factory2.jpg";
import factory3 from "@/public/images/factory3.jpg";
const quicksand = Quicksand({ subsets: ["latin"] });

export default function Factory() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        padding: "0 40px",
      }}
    >
      <Stack
        sx={{
          width: "100%",
          maxWidth: "var(--max-width)",
          padding: "40px 0",
          gap: 5,
        }}
      >
        <Typography
          className={quicksand.className}
          variant="h1"
          fontSize={48}
          fontWeight={800}
        >
          Factory
        </Typography>
        <Stack direction={"row"} justifyContent={"space-between"} gap={4}>
          <Stack maxWidth={600} gap={4}>
            <Stack gap={1}>
              <Typography
                className={quicksand.className}
                variant="h2"
                fontSize={24}
                color={"var(--primary-color)"}
                fontWeight={500}
              >
                Welcome to Sankamithra Fireworks - Where Innovation Ignites the
                Sky!
              </Typography>
              <Typography
                className={quicksand.className}
                fontSize={20}
                fontWeight={400}
              >
                The manufacturing unit of Sankamithra Fireworks stands as the
                pulsating heart of our operations, where creativity, precision,
                and safety converge to give birth to the mesmerizing displays
                that light up the skies. Located in the pyrotechnics hub of
                Sivakasi, our manufacturing unit embodies the rich tradition and
                innovative spirit that define Sankamithra Fireworks.
              </Typography>
            </Stack>
            <Stack gap={1}>
              <Typography
                className={quicksand.className}
                variant="h2"
                fontSize={24}
                fontWeight={500}
                color={"var(--primary-color)"}
              >
                Craftsmanship and Expertise:
              </Typography>
              <Typography
                className={quicksand.className}
                fontSize={20}
                fontWeight={400}
              >
                At the core of our manufacturing unit is a team of skilled
                artisans and technicians who bring years of expertise to the
                table. These craftsmen are the backbone of our operations,
                meticulously assembling and crafting each firework with a keen
                eye for detail and a commitment to quality.
              </Typography>
            </Stack>
          </Stack>
          <img
            style={{
              width: "50%",
            }}
            src={factory1.src}
          />
        </Stack>
        <Stack
          direction={"row-reverse"}
          justifyContent={"space-between"}
          pt={10}
          gap={4}
        >
          <Stack maxWidth={600} gap={4}>
            <Stack gap={1}>
              <Typography
                className={quicksand.className}
                variant="h2"
                fontSize={24}
                color={"var(--primary-color)"}
                fontWeight={500}
              >
                Safety Protocols
              </Typography>
              <Typography
                className={quicksand.className}
                fontSize={20}
                fontWeight={400}
              >
                Safety is paramount in our manufacturing process. We strictly
                adhere to rigorous safety protocols and industry standards to
                minimize risks associated with pyrotechnics. Our team undergoes
                regular training to stay updated on the latest safety measures
                and to create a secure working environment.
              </Typography>
            </Stack>
            <Stack gap={1}>
              <Typography
                className={quicksand.className}
                variant="h2"
                fontSize={24}
                fontWeight={500}
                color={"var(--primary-color)"}
              >
                Quality Control
              </Typography>
              <Typography
                className={quicksand.className}
                fontSize={20}
                fontWeight={400}
              >
                Quality control is a non-negotiable aspect of our manufacturing
                process. Every firework undergoes thorough testing and
                inspection to ensure it meets our stringent quality standards.
                From the choice of raw materials to the final product, we
                maintain an unwavering commitment to delivering excellence.
              </Typography>
            </Stack>
          </Stack>
          <img
            style={{
              width: "50%",
            }}
            src={factory2.src}
          />
        </Stack>
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          pt={10}
          gap={4}
        >
          <Stack maxWidth={600} gap={4}>
            <Stack gap={1}>
              <Typography
                className={quicksand.className}
                variant="h2"
                fontSize={24}
                color={"var(--primary-color)"}
                fontWeight={500}
              >
                Environmental Responsibility:
              </Typography>
              <Typography
                className={quicksand.className}
                fontSize={20}
                fontWeight={400}
              >
                As part of our manufacturing ethos, we prioritize environmental
                responsibility. Our processes incorporate eco-friendly materials
                and energy-efficient practices to minimize the ecological impact
                of our operations. We believe in enjoying the beauty of
                fireworks while being mindful of our environmental footprint.
              </Typography>
            </Stack>
            <Stack gap={1}>
              <Typography
                className={quicksand.className}
                variant="h2"
                fontSize={24}
                fontWeight={500}
                color={"var(--primary-color)"}
              >
                Art of Authenticity:
              </Typography>
              <Typography
                className={quicksand.className}
                fontSize={20}
                fontWeight={400}
              >
                The Sankamithra Fireworks manufacturing unit is not just a place
                of production, it&apos;s a symbol of our commitment to
                delivering unforgettable moments. It&apos;s where tradition
                meets innovation, craftsmanship meets technology, and every
                spark is a testament to our passion for creating joyous
                celebrations.
              </Typography>
            </Stack>
          </Stack>
          <img
            style={{
              width: "50%",
            }}
            src={factory3.src}
          />
        </Stack>
        <div style={{ padding: "56.25% 0 0 0", position: "relative" }}>
          <iframe
            src="https://player.vimeo.com/video/1000663654?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
            title="Sankamithra fireworks | Diwali 2024"
          ></iframe>
        </div>
      </Stack>
    </main>
  );
}
