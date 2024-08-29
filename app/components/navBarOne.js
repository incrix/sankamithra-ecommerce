"use client";
import {
  Stack,
  TextField,
  InputAdornment,
  Fab,
  IconButton,
} from "@mui/material";
import Link from "next/link";
import logo from "../../public/images/logo.svg";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import useWindowSize from "@/util/windowSize";
import Badge, { BadgeProps } from "@mui/material/Badge";
import { styled } from "@mui/material/styles";
import { useState, useEffect } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

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
  const [open, setOpen] = useState(false);

  const handleMenu = () => {
    setOpen(!open);
  };

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
  const linkStyle = {
    color: "var(--primary-color)",
    fontSize: "18px",
    fontWeight: "bold",
  };

  return (
    <nav
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
        height: "70px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: width < 1480 ? "0 20px" : "0",
        position: "relative",
      }}
    >
      <Stack
        display={open ? "flex" : "none"}
        gap={10}
        width={"300px"}
        height={"100vh"}
        position={"fixed"}
        padding={"20px"}
        sx={{
          top: "0",
          right: "0",
          backgroundColor: "white",
          zIndex: "100",
          border: "1px solid #ECECEC",
        }}
      >
        <IconButton
          sx={{
            color: "var(--primary-color)",
            fontSize: "30px",
            width: "30px",
          }}
        >
          <CloseRoundedIcon onClick={handleMenu} />
        </IconButton>
        <Link style={linkStyle} href="/" onClick={handleMenu}>
          Home
        </Link>
        <Link style={linkStyle} href="/shop" onClick={handleMenu}>
          Shop
        </Link>

        <Link style={linkStyle} href="/factory" onClick={handleMenu}>
          Factory
        </Link>
        {/* <Link style={linkStyle} href="/wholesale">
            Wholesale
          </Link> */}
        <Link style={linkStyle} href="/contact" onClick={handleMenu}>
          Contact
        </Link>
      </Stack>
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
        <Stack
          display={{
            xs: "none",
            sm: "none",
            md: "flex",
          }}
        >
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
        <Stack direction={"row"} gap={"25px"} alignItems={"center"}>
          <Stack
            display={{
              xs: "none",
              sm: "flex",
            }}
          >
            <Link
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
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
          <Stack display={{ xs: "flex", sm: "flex", md: "none" }}>
            <IconButton onClick={handleMenu}>
              <MenuRoundedIcon sx={{ fontSize: "30px" }} />
            </IconButton>
          </Stack>
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
        onClick={() => {
          window.location.href = "/cart";
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
