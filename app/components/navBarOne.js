"use client";
import {
  Stack,
  TextField,
  InputAdornment,
  Fab,
  IconButton,
  Box,
} from "@mui/material";
import Link from "next/link";
import logo from "../../public/images/logo.svg";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import useWindowSize from "@/util/windowSize";
import Badge from "@mui/material/Badge";
import { styled } from "@mui/material/styles";
import { useState, useEffect } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import FloatingPdf from "./floatingPdf";
import { useProducts } from "@/context/ProductContext";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useActivePath } from "./helperPath";

const StyledBadge = styled(Badge)(() => ({
  "& .MuiBadge-badge": {
    border: `2px solid var(--primary-color)`,
    background: "var(--primary-color)",
    padding: "0 4px",
  },
}));

export default function NavBarOne() {
  const { width } = useWindowSize();
  const [cartCount, setCartCount] = useState(1);
  const [open, setOpen] = useState(false);
  const { searchTerm, setSearchTerm } = useProducts();
  const router = useRouter();
  const pathname = usePathname();

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = () => {
    router.push("/shop#product");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleMenu = () => {
    setOpen(!open);
  };

  useEffect(() => {
    setCartCount(
      localStorage.getItem("cart")
        ? JSON.parse(localStorage.getItem("cart")).length
        : 0
    );
    const interval = setInterval(() => {
      setCartCount(
        localStorage.getItem("cart")
          ? JSON.parse(localStorage.getItem("cart")).length
          : 0
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const linkStyle = {
    color: "#000",
    fontSize: "18px",
    fontWeight: "bold",
    textDecoration: "none",
  };

  const activeLinkStyle = {
    color: "var(--primary-color)",
    textDecoration: "underline",
  };

  const isActiveLink = (href) => {
    const current = pathname.replace(/\/$/, ""); // remove trailing slash
    const linkPath = href.replace(/\/$/, "");
    return current === linkPath;
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
      {/* Drawer Menu */}
      {/* Drawer Menu */}
      <Stack
        sx={{
          position: "fixed",
          top: 0,
          right: open ? 0 : "-300px", // slide out
          width: "280px",
          height: "100vh",
          padding: 3,
          backgroundColor: "white",
          zIndex: 100,
          borderLeft: "1px solid #ECECEC",
          transition: "right 0.3s ease",
        }}
      >
        {/* Header with Logo + Close */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Link
            href="/"
            onClick={handleMenu}
            style={{ display: "flex", alignItems: "center" }}
          >
            <img
              src={logo.src}
              alt="Sankamithra"
              style={{ width: "90px", height: "auto" }}
            />
          </Link>

          <IconButton
            onClick={handleMenu}
            sx={{
              backgroundColor: "black",
              color: "#fff",
              "&:hover": { backgroundColor: "#222" },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        {/* Navigation Links */}
        <Stack spacing={2.5} mt={4}>
          {[
            { href: "/", label: "Home" },
            { href: "/shop", label: "Shop" },
            { href: "/factory", label: "Factory" },
            { href: "/contact", label: "Contact" },
          ].map((link) => {
            const active = useActivePath(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleMenu}
                style={{
                  color: active ? "var(--primary-color)" : "#000",
                  fontSize: "18px",
                  fontWeight: "bold",
                  textDecoration: active ? "underline" : "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </Stack>
      </Stack>

      {/* Main Nav */}
      <Stack
        direction="row"
        alignItems={"center"}
        justifyContent={"space-between"}
        width={"100%"}
        sx={{
          maxWidth: "var(--max-width)",
        }}
      >
        {/* Logo */}
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

        {/* Search (desktop only) */}
        <Stack
          display={{
            xs: "none",
            sm: "none",
            md: "flex",
          }}
        >
          <Box
            sx={{
              display: "flex",
              width: "500px",
            }}
          >
            <TextField
              placeholder="Search for products..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "4px 0 0 4px",
                  "& fieldset": {
                    borderColor: "#ccc",
                  },
                  "&:hover fieldset": {
                    borderColor: "var(--primary-color)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--primary-color)",
                  },
                },
              }}
            />
            <IconButton
              onClick={handleSearchSubmit}
              sx={{
                borderRadius: "0 4px 4px 0",
                backgroundColor: "#000",
                color: "white",
                px: 3,
                "&:hover": {
                  backgroundColor: "#000",
                  opacity: 0.8,
                },
              }}
            >
              <SearchOutlinedIcon />
            </IconButton>
          </Box>
        </Stack>

        {/* Right-side items */}
        <Stack direction={"row"} gap={"25px"} alignItems={"center"}>
          {/* Cart (desktop + tablet) */}
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

          {/* Hamburger (mobile only) */}
          <Stack display={{ xs: "flex", sm: "flex", md: "none" }}>
            <IconButton onClick={handleMenu}>
              <MenuRoundedIcon sx={{ fontSize: "30px" }} />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>

      {/* Floating Cart Button (mobile quick access) */}
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
      </Fab>

      <FloatingPdf />
    </nav>
  );
}
