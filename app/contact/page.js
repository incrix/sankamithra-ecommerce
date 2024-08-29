import { Button, Stack, Typography, TextField } from "@mui/material";
import { Quicksand } from "next/font/google";
const quicksand = Quicksand({ subsets: ["latin"] });
import ContactPng from "@/public/images/contact.png";
import { CallButton, WhatsappButton } from "./clientComp";

export default function Contact() {
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
          gap: 20,
        }}
      >
        <AddressComponent />
        <ContactForm />
      </Stack>
    </main>
  );
}

function AddressComponent() {
  return (
    <Stack
      direction={{
        sm: "column",
        md: "row",
      }}
      gap={10}
    >
      <Stack
        width={{
          sm: "100%",
          md: "50%",
        }}
        gap={10}
      >
        <Typography
          className={quicksand.className}
          variant="h1"
          fontSize={40}
          fontWeight={800}
        >
          Contact Us
        </Typography>
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          gap={2}
          justifyContent={"space-between"}
        >
          <Stack gap={2}>
            <Typography
              className={quicksand.className}
              variant="h2"
              fontSize={24}
              color={"var(--primary-color)"}
              fontWeight={500}
            >
              Office
            </Typography>
            <Typography
              className={quicksand.className}
              fontSize={20}
              fontWeight={400}
            >
              3/1427/G6, <br /> Opposite PRC Bus Depot, <br />
              Sattur Road, <br />
              Sivakasi - 626123.
            </Typography>
            <Typography
              className={quicksand.className}
              fontSize={20}
              fontWeight={400}
            >
              Ph: +91 99446 95228 <br />
              &nbsp;&ensp;&emsp;+91 75488 20326
            </Typography>
          </Stack>
          <Stack gap={2}>
            <Typography
              className={quicksand.className}
              variant="h2"
              fontSize={24}
              color={"var(--primary-color)"}
              fontWeight={500}
            >
              Factory
            </Typography>
            <Typography
              className={quicksand.className}
              fontSize={20}
              fontWeight={400}
            >
              9/241, <br />
              Kanmaisurangudi Village, <br />
              Sattur-626203.
            </Typography>
            <Typography
              className={quicksand.className}
              fontSize={20}
              fontWeight={400}
            >
              Ph: +91 99620 66648 <br />
              &nbsp;&ensp;&emsp;+91 84892 92901
            </Typography>
          </Stack>
        </Stack>
        <Stack gap={2}>
          <CallButton />
          <WhatsappButton />
        </Stack>
      </Stack>
      <Stack
        width={{
          sm: "100%",
          md: "50%",
        }}
        height={{
          xs: "400px",
          sm: "400px",
          md: "500px",
        }}
      >
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1340.1052666001385!2d77.87118833935341!3d9.298856736284566!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b06b55da9401d09%3A0xb66acba031fbce0d!2sSankamithra%20Fireworks!5e1!3m2!1sen!2sin!4v1723530302527!5m2!1sen!2sin"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowfullscreen="true"
          loading="lazy"
          // referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </Stack>
    </Stack>
  );
}

function ContactForm() {
  return (
    <Stack
      direction={{
        sm: "column",
        md: "row",
      }}
      gap={5}
    >
      <Stack
        gap={5}
        width={{
          sm: "100%",
          md: "60%",
        }}
      >
        <Stack>
          <Typography
            className={quicksand.className}
            fontSize={20}
            color={"var(--primary-color)"}
            fontWeight={800}
          >
            Wholesalers Contact form
          </Typography>
          <Typography
            className={quicksand.className}
            fontWeight={800}
            fontSize={40}
          >
            Drop Us a Line
          </Typography>
          <Typography
            className={quicksand.className}
            color={"#B6B6B6"}
            fontSize={14}
          >
            Your email address will not be published.
          </Typography>
        </Stack>
        <Stack gap={2}>
          <Stack direction={"row"} gap={2}>
            <TextField type="text" fullWidth placeholder="Name" />
            <TextField type="email" placeholder="Email" fullWidth />
          </Stack>
          <Stack direction={"row"} gap={2}>
            <TextField type="text" placeholder="Phone" fullWidth />
            <TextField type="text" placeholder="Company" fullWidth />
          </Stack>
          <TextField
            placeholder="Message"
            multiline
            inputProps={{ style: { resize: "vertical" } }}
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: "var(--primary-color)",
              height: "50px",
              textTransform: "none",
              color: "white",
              "&:hover": {
                backgroundColor: "var(--primary-color)",
              },
            }}
          >
            Send Message
          </Button>
        </Stack>
      </Stack>
      <Stack
        width={{
          sm: "100%",
          md: "40%",
        }}
      >
        <img src={ContactPng.src} style={{ width: "100%" }} />
      </Stack>
    </Stack>
  );
}
