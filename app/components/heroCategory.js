"use client";
import { Stack, Paper, Typography, Button } from "@mui/material";
import Link from "next/link";
import flower from "../../public/temp/flower.png";
import sound from "../../public/temp/sound.png";
import special from "../../public/temp/special.png";
import chakkar from "../../public/temp/chakkar.png";
import aerial from "../../public/temp/aerial.png";
import rocket from "../../public/temp/rocket.png";

const CatButton = ({ title, img, count }) => {
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
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        width: "100%",
        minWidth: "300px",
        height: "auto",
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
          <CatButton title="Flower Pots" count={5} img={flower} />
          <CatButton title="Ground Chakkar" count={5} img={chakkar} />
          <CatButton title="One Sound" count={5} img={sound} />
          <CatButton title="Special’s" count={5} img={special} />
          <CatButton title="Rockets" count={5} img={rocket} />
          <CatButton title="Aerials" count={5} img={aerial} />
        </Stack>
      </Stack>
    </Paper>
  );
}
