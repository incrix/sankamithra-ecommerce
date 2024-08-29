"use client";
import { Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import aerial from "@/public/temp/aerial.png";
import chakkar from "@/public/temp/chakkar.png";
import flower from "@/public/temp/flower.png";
import rocket from "@/public/temp/rocket.png";
import sound from "@/public/temp/sound.png";
import special from "@/public/temp/special.png";
import bomb from "@/public/temp/bomb.png";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ShopByCategory() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  useEffect(() => {
    console.log(category);
  }, [category]);
  const catList = [
    {
      id: 1,
      title: "Flowerpots",
      imgURL: flower.src,
      url: "Flower%20Pots",
      query: "Flower Pots",
    },
    {
      id: 2,
      title: "Ground Chakkar",
      imgURL: chakkar.src,
      url: "Ground%20Chakkars",
      query: "Ground Chakkars",
    },
    {
      id: 3,
      title: "One Sound",
      imgURL: sound.src,
      url: "One%20Sound",
      query: "One Sound",
    },
    {
      id: 4,
      title: "Special’s",
      imgURL: special.src,
      url: "Special%27s",
      query: "Special's",
    },
    {
      id: 5,
      title: "Rockets",
      imgURL: rocket.src,
      url: "Rockets",
      query: "Rockets",
    },

    {
      id: 6,
      title: "Aerials",
      imgURL: aerial.src,
      url: "Repeating%20shots",
      query: "Repeating shots",
    },
    {
      id: 7,
      title: "Bombs",
      imgURL: bomb.src,
      url: "Atom%20bombs",
      query: "Atom bombs",
    },
    {
      id: 8,
      title: "Twinklers",
      imgURL: aerial.src,
      url: "Twinklers",
      query: "Twinklers",
    },
  ];

  return (
    <Stack width={"100%"} gap={4}>
      <Stack width={"100%"} flexDirection={"row"} gap={2} alignItems={"center"}>
        <Typography
          variant="h4"
          sx={{
            fontSize: {
              xs: "24px",
              sm: "32px",
              md: "32px",
              lg: "32px",
              xl: "32px",
            },
            color: "var(--text-color)",
            fontWeight: "bold",
          }}
        >
          Shop By Categories
        </Typography>
        <Link href={"/shop"}>
          <span style={{ fontSize: "16px" }}>All Categories</span>
        </Link>
      </Stack>
      <Stack
        flexWrap={{
          xs: "wrap",
          sm: "nowrap",
        }}
        justifyContent={{
          xs: "center",
          sm: "flex-start",
        }}
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: {
            xs: "20px",
            sm: "20px",
          },
          padding: "10px 0 20px 0",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        {catList.map((cat, index) => {
          return (
            <CatCard
              key={index}
              title={cat.title}
              imgURL={cat.imgURL}
              url={cat.url}
              isSelected={category === cat.query}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}

const CatCard = ({ title, imgURL, url, isSelected }) => {
  const router = useRouter();

  return (
    <Paper
      sx={{
        background: isSelected ? "#F4F6FA" : "white",
        width: {
          xs: "120px",
          sm: "150px",
        },
        height: {
          xs: "150px",
          sm: "180px",
        },
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
      }}
      onClick={() => {
        router.push("/shop?category=" + url + "#product");
      }}
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
