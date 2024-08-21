"use client";
import { Stack, InputBase, Button } from "@mui/material";
import emailBg from "../../public/images/email-bg.png";
import TelegramIcon from "@mui/icons-material/Telegram";
import useWindowSize from "@/util/windowSize";

export default function EmailSubscribe() {
  const { width } = useWindowSize();
  return (
    <Stack
      position={"relative"}
      // width={"100%"}
      p={{
        xs: "20px",
        sm: "40px",
        md: "60px",
        lg: "80px",
        xl: "100px",
      }}
      gap={2}
      sx={{
        background: "black",
        height: "100%",
        borderRadius: "20px",
        overflow: "hidden",
        // margin: width > 1480 ? "80px 0 0 0" : "80px 40px 0 40px",
        margin: {
          xs: "80px 20px",
          sm: "80px 20px",
          md: "80px 50px",
          lg: "80px 50px",
          xl: "80px 0",
        },
      }}
    >
      <h3
        style={{
          color: "white",
          fontSize: "30px",
          zIndex: "1",
        }}
      >
        Stay home & Celebrate
        <br />
        your festivals from us
      </h3>
      <p
        style={{
          color: "white",
          zIndex: "1",
        }}
      >
        Start You&apos;r Shopping with{" "}
        <font style={{ color: "var(--primary-color)" }}>Sankamithra</font>
      </p>
      <Stack
        flexDirection={"row"}
        justifyContent={"space-between"}
        zIndex={1}
        sx={{
          background: "white",
          borderRadius: "40px",
          width: {
            xs: "100%",
            xs: "400px",
            sm: "400px",
            md: "400px",
            lg: "400px",
          },
          height: "50px",
          paddingLeft: "20px",
        }}
      >
        <Stack
          direction={"row"}
          gap={1}
          alignItems={"center"}
          // width={{
          //   xs: "70%",
          //   sm: "80%",
          //   md: "90%",
          //   lg: "100%",
          // }}
        >
          <TelegramIcon sx={{ color: "var(--text-color-secondary)" }} />
          <InputBase
            placeholder="Your emaill address"
            sx={{
              fontSize: "14px",
              width: "100%",
              height: "100%",
              zIndex: "1",
            }}
          />
        </Stack>

        <Button
          variant="contained"
          sx={{
            color: "white",
            borderRadius: "40px",
            fontSize: "14px",
            fontWeight: "bold",
            textTransform: "none",
            backgroundColor: "var(--primary-color)",
            padding: "0 25px !important",
            "&:hover": {
              backgroundColor: "var(--primary-color)",
            },
          }}
        >
          Subscribe
        </Button>
      </Stack>
      <img
        src={emailBg.src}
        alt=""
        style={{
          position: "absolute",
          right: "0",
          top: "0",
          height: "100%",
          zIndex: "0",
        }}
      />
    </Stack>
  );
}
