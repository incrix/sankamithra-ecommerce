"use client";
import { Button } from "@mui/material";
import LocalPhoneRoundedIcon from "@mui/icons-material/LocalPhoneRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

export function CallButton() {
  return (
    <Button
      variant="contained"
      onClick={() => {
        window.open("tel:+919489239970", "_self");
      }}
      sx={{
        backgroundColor: "var(--primary-color)",
        height: "50px",
        textTransform: "none",
        color: "white",
        "&:hover": {
          backgroundColor: "var(--primary-color)",
        },
      }}
      startIcon={<LocalPhoneRoundedIcon />}
    >
      Call now!
    </Button>
  );
}

export function WhatsappButton() {
  return (
    <Button
      variant="outlined"
      sx={{
        borderColor: "var(--primary-color)",
        height: "50px",
        textTransform: "none",
        color: "var(--primary-color)",
        "&:hover": {
          borderColor: "var(--primary-color)",
        },
      }}
      startIcon={<SendRoundedIcon />}
      onClick={() => {
        window.open(
          "https://wa.me/+919489239970?text=I'm%20interested%20in%20your%20products.",
          "_blank"
        );
      }}
    >
      Whatsapp
    </Button>
  );
}
