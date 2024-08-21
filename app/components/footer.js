"use client";
import { Stack } from "@mui/material";
import logo from "../../public/images/logo.svg";
import green from "../../public/images/green.png";
import iso from "../../public/images/iso.png";
import Link from "next/link";
import useWindowSize from "@/util/windowSize";

export default function Footer() {
  const { width } = useWindowSize();
  return (
    <footer
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        margin: "80px 0 20px 0",
        padding: width < 1480 ? "0 40px" : "0",
      }}
    >
      <Stack width={"100%"} gap={2} maxWidth={"var(--max-width)"}>
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          flexWrap={width < 1024 ? "wrap" : "nowrap"}
        >
          <Stack maxWidth={"300px"} gap={2}>
            <Stack direction={"row"} gap={1}>
              <img
                src={logo.src}
                style={{
                  width: "80px",
                }}
              />
              <Stack direction={"column"}>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#000",
                  }}
                >
                  Sankamithra
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#686868",
                  }}
                >
                  Fireworks & Crackers
                </span>
              </Stack>
            </Stack>
            <p>High quality fireworks manufacturer in TamilNadu</p>
          </Stack>
          <Stack gap={2}>
            <h6
              style={{
                color: "var(--text-color)",
                fontSize: "24px",
                fontWeight: "800",
              }}
            >
              Company
            </h6>
            <Link href={"/"}>Home</Link>
            <Link href={"/shop"}>Shop</Link>
            <Link href={"/factory"}>Factory</Link>
            <Link href={"/contact"}>Contact Us</Link>
          </Stack>
          <Stack gap={2}>
            <h6
              style={{
                color: "var(--text-color)",
                fontSize: "24px",
                fontWeight: "800",
              }}
            >
              Account
            </h6>
            <Link href={"/login"}>Login</Link>
            <Link href={"/register"}>Register</Link>
          </Stack>
          <Stack gap={2}>
            <h6
              style={{
                color: "var(--text-color)",
                fontSize: "24px",
                fontWeight: "800",
              }}
            >
              Categories
            </h6>
            <Link href={"/"}>Flowerpots</Link>
            <Link href={"/"}>Groundchakkar</Link>
            <Link href={"/"}>Onesound</Link>
            <Link href={"/"}>Aerials</Link>
            <Link href={"/"}>Special’s</Link>
            <Link href={"/"}>Rockets</Link>
            <Link href={"/"}>Sparklers</Link>
          </Stack>
          <Stack gap={2}>
            <h6
              style={{
                color: "var(--text-color)",
                fontSize: "24px",
                fontWeight: "800",
              }}
            >
              Certified
            </h6>
            <img
              style={{
                width: "100px",
              }}
              src={green.src}
              alt="Green"
            />
            <img
              style={{
                width: "100px",
              }}
              src={iso.src}
              alt="ISO"
            />
          </Stack>
        </Stack>
        <hr />
        <Stack flexDirection={"row"} justifyContent={"space-between"}>
          <p>
            © 2024,{" "}
            <span
              style={{
                color: "var(--primary-color)",
                fontWeight: "600",
                display: "inline",
              }}
            >
              Sankamithra Fireworks
            </span>
            <br />
            All rights reserved
          </p>
          <p>
            Designed by{" "}
            <a href="https://incrix.com/" target="_blank">
              <img
                style={{ width: "80px" }}
                src="https://incrix.com/logo.png"
                alt="Incrix Logo"
              />
            </a>
          </p>
        </Stack>
      </Stack>
    </footer>
  );
}
