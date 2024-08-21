"use client";
import { Stack, TextField, InputAdornment, Fab } from "@mui/material";
import Link from "next/link";
import logo from "../../public/images/logo.svg";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import useWindowSize from "@/util/windowSize";
import Badge, { BadgeProps } from "@mui/material/Badge";
import { styled } from "@mui/material/styles";
import { useState, useEffect } from "react";

const StyledBadge = styled(Badge)(() => ({
  "& .MuiBadge-badge": {
    border: `2px solid var(--primary-color)`,
    background: "var(--primary-color)",
    padding: "0 4px",
  },
}));

export default function NavBarOne() {
  const { width } = useWindowSize();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(
      localStorage.getItem("cart")
        ? JSON.parse(localStorage.getItem("cart")).length
        : 0
    );
    setInterval(() => {
      setCartCount(
        localStorage.getItem("cart")
          ? JSON.parse(localStorage.getItem("cart")).length
          : 0
      );
    }, 500);
  }, []);

  return (
    <nav
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
        height: "70px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: width < 1480 ? "0 40px" : "0",
      }}
    >
      <Stack
        direction="row"
        alignItems={"center"}
        justifyContent={"space-between"}
        width={"100%"}
        sx={{
          maxWidth: "var(--max-width)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src={logo.src}
            style={{
              width: "80px",
            }}
          />
          <Stack direction={"column"}>
            <span
              style={{
                marginLeft: "10px",
                fontSize: "24px",
                fontWeight: "bold",
                color: "#000",
              }}
            >
              Sankamithra
            </span>
            <span
              style={{
                marginLeft: "10px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#686868",
              }}
            >
              Fireworks & Crackers
            </span>
          </Stack>
        </Link>
        {width > 1024 && (
          <Stack>
            <TextField
              sx={{
                width: "500px",
              }}
              placeholder="Search"
              variant="outlined"
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )}
        <Stack
          direction={"row"}
          gap={"20px"}
          display={{
            xs: "none",
            sm: "flex",
            md: "flex",
          }}
        >
          <Link
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              color: "var(--text-color-secondary)",
            }}
            href={"/cart"}
          >
            <StyledBadge badgeContent={cartCount} color="secondary">
              <ShoppingCartOutlinedIcon
                sx={{
                  fontSize: "24px",
                  color: "var(--text-color)",
                }}
              />
            </StyledBadge>
            Cart
          </Link>
        </Stack>
      </Stack>
      <Fab
        sx={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "var(--primary-color)",
          color: "var(--text-color)",
          gap: "10px",
          "&:hover": {
            backgroundColor: "var(--primary-color)",
          },
        }}
      >
        <StyledBadge badgeContent={cartCount} color="secondary">
          <ShoppingCartOutlinedIcon
            sx={{
              fontSize: "24px",
              color: "white",
            }}
          />
        </StyledBadge>
        {/* Cart */}
      </Fab>
    </nav>
  );
}
