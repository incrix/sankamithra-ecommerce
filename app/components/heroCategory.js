"use client";
import { Stack, Paper, Typography, Button } from "@mui/material";
import flower from "../../public/temp/flower.png";
import sound from "../../public/temp/sound.png";
import special from "../../public/temp/special.png";
import chakkar from "../../public/temp/chakkar.png";
import aerial from "../../public/temp/aerial.png";
import rocket from "../../public/temp/rocket.png";
import bomb from "@/public/temp/bomb.png";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const CatButton = ({ title, img, count, link }) => {
  const router = useRouter();
  return (
    <Stack
      flexDirection={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
      sx={{
        border: "1px solid",
        borderColor: "#F2F3F4",
        borderRadius: "5px",
        height: "50px",
        padding: "0 20px",
        color: "var(--text-color)",
        "&:hover": {
          backgroundColor: "#FFDACC",
          borderColor: "var(--primary-color)",
          cursor: "pointer",
        },
      }}
      onClick={() => {
        router.push(`/shop?category=${link}`);
      }}
    >
      <img
        src={img.src}
        alt={title}
        style={{
          width: "30px",
        }}
      />
      <p style={{ fontSize: "14px", fontWeight: "600" }}>{title}</p>
      <Stack
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          backgroundColor: "var(--primary-color)",
          color: "white",
        }}
      >
        {count}
      </Stack>
    </Stack>
  );
};

export default function HeroCategory() {
  const [productList, setProductList] = useState([]);

  useEffect(() => {
    let productFromLocalStorage = JSON.parse(
      localStorage.getItem("productList")
    );
    if (
      productFromLocalStorage == null ||
      productFromLocalStorage.length === 0
    ) {
      fetch("https://e-com.incrix.com/Sankamithra%20Products/productData.json")
        .then((response) => response.json())
        .then((data) => {
          localStorage.setItem("productList", JSON.stringify(data));
          setProductList(data);
        });
    } else {
      setProductList(productFromLocalStorage);
    }
  }, []);
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        width: "100%",
        minWidth: "300px",
        maxWidth: "600px",
        border: "2px solid",
        borderColor: "#ECECEC",
        borderRadius: "15px",
        position: "sticky",
        top: "80px",
      }}
    >
      <Stack top={0}>
        <h6
          style={{
            paddingBottom: "10px",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          Category
        </h6>
        <hr
          style={{
            width: "100%",
            height: "2px",
            backgroundColor: "#ECECEC",
            border: "none",
            marginBottom: "20px",
          }}
        />
        <Stack gap={2.5}>
          <CatButton
            title="Flower Pots"
            count={
              productList.filter(
                (product) => product.category === "Flower Pots"
              ).length
            }
            img={flower}
            link={"Flower Pots"}
          />
          <CatButton
            title="Ground Chakkars"
            count={
              productList.filter(
                (product) => product.category === "Ground Chakkars"
              ).length
            }
            img={chakkar}
            link={"Ground Chakkars"}
          />
          <CatButton
            title="One Sound"
            count={
              productList.filter((product) => product.category === "One Sound")
                .length
            }
            img={sound}
            link={"One Sound"}
          />
          <CatButton
            title="Special’s"
            count={
              productList.filter((product) => product.category == "Special's")
                .length
            }
            img={special}
            link={"Special%27s"}
          />
          <CatButton
            title="Rockets"
            count={
              productList.filter((product) => product.category == "Rockets")
                .length
            }
            img={rocket}
            link={"Rockets"}
          />
          <CatButton
            title="Aerials"
            count={
              productList.filter(
                (product) => product.category == "Repeating shots"
              ).length
            }
            img={aerial}
            link={"Repeating shots"}
          />
          <CatButton
            title="Bombs"
            count={
              productList.filter((product) => product.category == "Atom bombs")
                .length +
              productList.filter(
                (product) => product.category == "Bijili crackers"
              ).length
            }
            img={bomb}
            link={"Atom bombs"}
          />
          <CatButton
            title="Twinklers"
            count={
              productList.filter(
                (product) => product.category == "Twinkling stars"
              ).length +
              productList.filter((product) => product.category == "Pencils")
                .length
            }
            img={aerial}
            link={"Twinklers"}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}
