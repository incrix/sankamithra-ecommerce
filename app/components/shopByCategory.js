"use client";
import { Paper, Stack } from "@mui/material";
import Link from "next/link";
import aerial from "../../public/temp/aerial.png";
import chakkar from "../../public/temp/chakkar.png";
import flower from "../../public/temp/flower.png";
import rocket from "../../public/temp/rocket.png";
import sound from "../../public/temp/sound.png";
import special from "../../public/temp/special.png";
import useWindowSize from "@/util/windowSize";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ShopByCategory() {
  const { width } = useWindowSize();
  const catList = [
    {
      id: 1,
      title: "Ground Chakkar",
      imgURL: chakkar.src,
    },
    {
      id: 2,
      title: "Flowerpots",
      imgURL: flower.src,
    },
    {
      id: 3,
      title: "One Sound",
      imgURL: sound.src,
    },
    {
      id: 4,
      title: "Rockets",
      imgURL: rocket.src,
    },
    {
      id: 5,
      title: "Special’s",
      imgURL: special.src,
    },
    {
      id: 6,
      title: "Aerials",
      imgURL: aerial.src,
    },
  ];
  return (
    width > 1024 && (
      <Stack width={"100%"} gap={4} padding={width < 1480 ? "0 40px" : "0"}>
        <Stack
          width={"100%"}
          flexDirection={"row"}
          gap={2}
          alignItems={"center"}
        >
          <h4
            style={{
              fontSize: "32px",
              color: "var(--text-color)",
              fontWeight: "bold",
            }}
          >
            Shop By Categories
          </h4>
          <Link href={"/shop"}>
            <span style={{ fontSize: "16px" }}>All Categories</span>
          </Link>
        </Stack>
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            // flexWrap: "wrap",
            overflowX: "scroll",
            overflowY: "hidden",
            gap: "30px",
            padding: "30px 0",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {catList.map((cat, index) => {
            return (
              <CatCard key={index} titile={cat.title} imgURL={cat.imgURL} />
            );
          })}
        </Stack>
      </Stack>
    )
  );
}

const CatCard = ({ titile: title, imgURL }) => {
  const router = useRouter();
  return (
    <Paper
      sx={{
        background: "#F4F6FA",
        width: "150px",
        height: "180px",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
      }}
      onClick={() => router.push("/shop?category=" + title)}
    >
      <Image
        src={imgURL}
        alt={title}
        width={80}
        height={80}
        style={{
          margin: "0 35px",
        }}
      />
      <p
        style={{
          textAlign: "center",
          width: "100px",
          fontSize: "14px",
          fontWeight: "bold",
          color: "var(--text-color)",
        }}
      >
        {title}
      </p>
    </Paper>
  );
};
