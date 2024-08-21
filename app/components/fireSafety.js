import { Stack, Paper, Typography } from "@mui/material";
import { Quicksand } from "next/font/google";
const quicksand = Quicksand({ subsets: ["latin"] });
import shopVector from "../../public/images/shop-vector.svg";
import adultVextor from "../../public/images/adult-vector.svg";
import cleanVector from "../../public/images/clean-vector.svg";
import waterVector from "../../public/images/water-vector.svg";
import lightVector from "../../public/images/light-vector.svg";
import instructVector from "../../public/images/instruct-vector.svg";

import illegalVector from "../../public/images/illegal-vector.svg";
import childVector from "../../public/images/child-vector.svg";
import bombVector from "../../public/images/bomb-vector.svg";
import pocketVector from "../../public/images/pocket-vector.svg";
import animalVector from "../../public/images/animal-vector.svg";
import glassVector from "../../public/images/glass-vector.svg";

export default function FireSafety() {
  const doList = [
    {
      imgURL: shopVector.src,
      title: "Purchase Fireworks from Licensed merchants.",
    },
    {
      imgURL: adultVextor.src,
      title: "Have a responsible adult in charge.",
    },
    {
      imgURL: cleanVector.src,
      title:
        "Prepare a safe, outdoor environment clear of other fireworks., dried wood, long grass and buildings.",
    },
    {
      imgURL: waterVector.src,
      title:
        "Have water, such as a garden hose, bucket or portable water pump, readily available in case of fire.",
    },
    {
      imgURL: lightVector.src,
      title:
        "Light fireworks one at a time and away from your body (and other people).",
    },
    {
      imgURL: instructVector.src,
      title:
        "Display fireworks as per the warnings and instructions mentioned on the pack.",
    },
  ];
  const dontList = [
    {
      imgURL: illegalVector.src,
      title: "Never discharge illegal fireworks.",
    },
    {
      imgURL: childVector.src,
      title: "Never give fireworks to children.",
    },
    {
      imgURL: bombVector.src,
      title: "Never try to extinguish live fireworks that are on fire.",
    },
    {
      imgURL: pocketVector.src,
      title: "Never carry fireworks in your pocket.",
    },
    {
      imgURL: animalVector.src,
      title: "Do not point fireworks on people or animals.",
    },
    {
      imgURL: glassVector.src,
      title: "Never use metal or glass containers to launch fireworks.",
    },
  ];
  return (
    <Stack
      width={"100%"}
      padding={{
        xs: "20px",
        sm: "20px",
        md: "50px",
        lg: "50px",
        xl: "0",
      }}
    >
      <h4
        style={{
          color: "var(--text-color)",
          fontSize: "32px",
          fontWeight: "bold",
          marginBottom: "40px",
        }}
      >
        Fire Safety
      </h4>
      <Paper
        sx={{
          background: "#F4F6FA",
          width: "100%",
          padding: {
            xs: "20px",
            sm: "20px",
            md: "50px",
            lg: "50px",
          },
          display: {
            md: "block",
            lg: "flex",
          },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack
          width={{
            md: "100%",
            lg: "40%",
          }}
          gap={2}
        >
          <Typography
            variant="h6"
            className={quicksand.className}
            sx={{
              color: "var(--primary-color)",
              fontSize: {
                xs: "40px",
                sm: "60px",
                md: "80px",
                lg: "80px",
              },
              fontWeight: "bold",
            }}
          >
            Do
          </Typography>
          <Stack gap={3} margin={"20px 0"}>
            {doList.map((item, index) => {
              return <SafetyCard key={index} {...item} />;
            })}
          </Stack>
        </Stack>
        <hr
          style={{
            width: "5px",
            backgroundColor: "var(--primary-color)",
            border: "none",
            padding: "0 !important",
            margin: "0 0 0 90px",
          }}
        />
        <Stack
          width={{
            md: "100%",
            lg: "40%",
          }}
          gap={2}
        >
          <Typography
            variant="h6"
            className={quicksand.className}
            sx={{
              color: "var(--primary-color)",
              fontSize: {
                xs: "40px",
                sm: "60px",
                md: "80px",
                lg: "80px",
              },
              fontWeight: "bold",
            }}
          >
            Don&apos;t
          </Typography>
          <Stack gap={3} margin={"20px 0"}>
            {dontList.map((item, index) => {
              return <SafetyCard key={index} {...item} />;
            })}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}

const SafetyCard = ({ imgURL, title }) => {
  return (
    <Stack
      flexDirection={"row"}
      alignItems={"flex-start"}
      height={{
        sm: "100px",
        md: "auto",
      }}
      gap={2}
    >
      <img
        src={imgURL}
        style={{
          width: "35px",
        }}
      />
      <Typography
        className={quicksand.className}
        sx={{
          fontSize: {
            xs: "14px",
            sm: "16px",
            md: "24px",
            lg: "24px",
          },
          fontWeight: "600",
        }}
      >
        {title}
      </Typography>
    </Stack>
  );
};
