"use client";
import { Stack } from "@mui/material";
import Link from "next/link";
import useWindowSize from "@/util/windowSize";

export default function NavBarTwo() {
  const linkStyle = {
    color: "var(--text-color)",
    fontSize: "16px",
    fontWeight: "bold",
  };
  return (
    <Stack
      display={{
        xs: "none",
        sm: "none",
        md: "flex",
        lg: "flex",
      }}
    >
      <nav
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          border: "1px solid #ECECEC",
        }}
      >
        <Stack
          direction="row"
          width={"600px"}
          height={"50px"}
          justifyContent="space-between"
          alignItems="center"
        >
          <Link style={linkStyle} href="/">
            Home
          </Link>
          <Link style={linkStyle} href="/shop">
            Shop
          </Link>

          <Link style={linkStyle} href="/factory">
            Factory
          </Link>

          {/* <Link style={linkStyle} href="/wholesale">
            Wholesale
          </Link> */}
          <Link style={linkStyle} href="/contact">
            Contact
          </Link>
        </Stack>
      </nav>
    </Stack>
  );
}
