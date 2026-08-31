"use client";
import { useState } from "react";
import {
  Stack, Box, Typography, InputBase, IconButton, Badge, Drawer, Button, Divider,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import { useProducts } from "@/context/ProductContext";
import { useCart } from "@/util/cart";
import { PRICE_LIST_URL, DEFAULT_BANNER } from "@/util/config";
import logo from "../../public/images/logo.svg";

/**
 * Site header: announcement strip, brand bar, search, cart and navigation.
 *
 * Replaces announceBar + navBarOne + navBarTwo + searchBarMobile, which between
 * them duplicated the search, drove layout from useWindowSize() and called the
 * useActivePath hook inside a .map() callback - a rules-of-hooks violation that
 * made `npm run build` fail. The active route is now resolved once, here.
 *
 * The price list and cart also move out of floating action buttons and into the
 * bar, so they stop covering page content in the bottom corners.
 */

const LINKS = [
  { href: "/", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/factory", label: "Why Sivakasi" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/safety", label: "Safety" },
  { href: "/contact", label: "Contact" },
];

export default function Header({ banner = DEFAULT_BANNER }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { searchTerm, setSearchTerm } = useProducts();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/product") : pathname.startsWith(href);

  const submitSearch = () => {
    setMenuOpen(false);
    router.push("/");
  };

  const search = (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      sx={{
        flex: 1, minWidth: 0, maxWidth: 460,
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius-pill)",
        px: 2, py: 0.75,
        backgroundColor: "var(--surface)",
        transition: "border-color var(--transition)",
        "&:focus-within": { borderColor: "var(--primary-color)" },
      }}
    >
      <SearchRoundedIcon sx={{ fontSize: 19, color: "var(--text-color-trinary)" }} />
      <InputBase
        value={searchTerm || ""}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submitSearch()}
        placeholder="Search crackers..."
        inputProps={{ "aria-label": "search products" }}
        sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}
      />
      {searchTerm && (
        <IconButton size="small" aria-label="clear search" onClick={() => setSearchTerm("")}>
          <CloseRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}
    </Stack>
  );

  return (
    <Box component="header" sx={{ position: "sticky", top: 0, zIndex: 1100, backgroundColor: "var(--surface)" }}>
      {/* Announcement - text, link and visibility are set in the admin panel */}
      {banner?.enabled !== false && banner?.text ? (
        <Box
          {...(banner.href ? { component: Link, href: banner.href } : {})}
          sx={{ display: "block", backgroundColor: "var(--primary-color)", py: 0.85, px: 2 }}
        >
          <Typography textAlign="center" fontSize={{ xs: 11.5, md: 13 }} fontWeight={800} color="#fff" letterSpacing={0.2}>
            {banner.text}
          </Typography>
        </Box>
      ) : null}

      {/* Brand bar */}
      <Box sx={{ borderBottom: "1px solid var(--border)" }}>
        <Stack
          direction="row"
          alignItems="center"
          gap={{ xs: 1, md: 3 }}
          width="100%"
          maxWidth="var(--max-width)"
          mx="auto"
          px={{ xs: 2, sm: 3, md: 4 }}
          py={{ xs: 1.25, md: 1.5 }}
        >
          <Stack component={Link} href="/" direction="row" alignItems="center" gap={1.25} sx={{ flexShrink: 0 }}>
            <Box component="img" src={logo.src} alt="" sx={{ width: { xs: 44, md: 54 } }} />
            <Stack minWidth={0}>
              {/* The full trading name. It's long, so it steps down and is
                  allowed to wrap to two lines on a phone rather than
                  squeezing the search and menu out of the bar. */}
              <Typography
                fontSize={{ xs: 14.5, sm: 17, md: 20 }}
                fontWeight={800}
                color="var(--text-color)"
                lineHeight={1.15}
                sx={{ maxWidth: { xs: 150, sm: "none" } }}
              >
                Sankamithra Thunder World
              </Typography>
              <Typography fontSize={{ xs: 9.5, md: 11 }} fontWeight={600} color="var(--text-color-secondary)">
                Fireworks &amp; Crackers
              </Typography>
            </Stack>
          </Stack>

          <Box sx={{ flex: 1, display: { xs: "none", md: "flex" }, justifyContent: "center" }}>{search}</Box>
          <Box sx={{ flex: 1, display: { xs: "block", md: "none" } }} />

          <Stack direction="row" alignItems="center" gap={{ xs: 0.5, md: 1 }} flexShrink={0}>
            <Button
              href={PRICE_LIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: 17 }} />}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                textTransform: "none", fontWeight: 700, fontSize: 13,
                borderRadius: "var(--radius-pill)", px: 1.75,
                color: "var(--text-color)",
                border: "1px solid var(--border)",
                "&:hover": { borderColor: "var(--primary-color)", color: "var(--primary-color)", backgroundColor: "var(--primary-soft)" },
              }}
            >
              Price list
            </Button>

            <IconButton component={Link} href="/cart" aria-label={`cart, ${itemCount} items`}
              sx={{ color: "var(--text-color)", "&:hover": { color: "var(--primary-color)" } }}>
              <Badge
                badgeContent={itemCount}
                sx={{ "& .MuiBadge-badge": { backgroundColor: "var(--primary-color)", color: "#fff", fontWeight: 800, fontSize: 10 } }}
              >
                <ShoppingCartOutlinedIcon />
              </Badge>
            </IconButton>

            <IconButton
              onClick={() => setMenuOpen(true)}
              aria-label="open menu"
              sx={{ display: { xs: "inline-flex", md: "none" }, color: "var(--text-color)" }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Stack>
        </Stack>

        {/* Mobile search sits under the brand bar so the logo keeps its room */}
        <Box sx={{ display: { xs: "flex", md: "none" }, px: 2, pb: 1.25 }}>{search}</Box>
      </Box>

      {/* Desktop navigation */}
      <Box sx={{ display: { xs: "none", md: "block" }, borderBottom: "1px solid var(--border)" }}>
        <Stack direction="row" justifyContent="center" gap={{ md: 3, lg: 4.5 }} maxWidth="var(--max-width)" mx="auto" px={4}>
          {LINKS.map((l) => (
            <Typography
              key={l.href}
              component={Link}
              href={l.href}
              fontSize={14.5}
              fontWeight={isActive(l.href) ? 800 : 700}
              sx={{
                py: 1.5,
                color: isActive(l.href) ? "var(--primary-color)" : "var(--text-color)",
                borderBottom: "2px solid",
                borderColor: isActive(l.href) ? "var(--primary-color)" : "transparent",
                transition: "color var(--transition), border-color var(--transition)",
                "&:hover": { color: "var(--primary-color)" },
              }}
            >
              {l.label}
            </Typography>
          ))}
        </Stack>
      </Box>

      {/* Mobile menu */}
      <Drawer
        anchor="right"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        PaperProps={{ sx: { width: "82%", maxWidth: 330, p: 2.5 } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontSize={17} fontWeight={800} color="var(--text-color)">Menu</Typography>
          <IconButton onClick={() => setMenuOpen(false)} aria-label="close menu"><CloseRoundedIcon /></IconButton>
        </Stack>

        <Stack gap={0.5}>
          {LINKS.map((l) => (
            <Typography
              key={l.href}
              component={Link}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              fontSize={16}
              fontWeight={800}
              sx={{
                py: 1.35, px: 1.5, borderRadius: "var(--radius)",
                color: isActive(l.href) ? "var(--primary-color)" : "var(--text-color)",
                backgroundColor: isActive(l.href) ? "var(--primary-soft)" : "transparent",
              }}
            >
              {l.label}
            </Typography>
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack gap={1}>
          <Button
            component={Link} href="/cart" onClick={() => setMenuOpen(false)}
            startIcon={<ShoppingCartOutlinedIcon sx={{ fontSize: 18 }} />}
            sx={outlineBtn}
          >
            Cart{itemCount ? ` (${itemCount})` : ""}
          </Button>
          <Button
            href={PRICE_LIST_URL} target="_blank" rel="noopener noreferrer"
            startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: 18 }} />}
            sx={outlineBtn}
          >
            Price list
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
}

const outlineBtn = {
  justifyContent: "flex-start",
  textTransform: "none", fontWeight: 700, fontSize: 14,
  py: 1.1, px: 1.75, borderRadius: "var(--radius)",
  color: "var(--text-color)", border: "1px solid var(--border)",
  "&:hover": { borderColor: "var(--primary-color)", color: "var(--primary-color)", backgroundColor: "var(--primary-soft)" },
};
