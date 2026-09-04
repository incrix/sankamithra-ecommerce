"use client";
import {
  Stack, Box, Typography, Button, IconButton, Tooltip, Drawer,
  Snackbar, Alert, CircularProgress, Divider,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import PriceChangeRoundedIcon from "@mui/icons-material/PriceChangeRounded";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import { useEffect, useState } from "react";
import { useAdmin } from "../AdminContext";
import LoginGate from "./LoginGate";

/**
 * Chrome shared by every admin route: sign-in gate, sidebar, topbar and toasts.
 *
 * Navigation is real links now, so each section is bookmarkable and the browser
 * back button works — previously all four were one page swapping local state.
 */

export const NAV = [
  { href: "/admin",            label: "Dashboard",  blurb: "Revenue, pipeline and what needs attention", icon: <DashboardRoundedIcon /> },
  { href: "/admin/pos",        label: "New bill",   blurb: "Bill a walk-in customer at the counter",     icon: <PointOfSaleRoundedIcon /> },
  { href: "/admin/orders",     label: "Orders",     blurb: "Track, pack and dispatch every order",        icon: <ListAltRoundedIcon /> },
  { href: "/admin/products",   label: "Products",   blurb: "Edit titles, prices, stock and images",      icon: <Inventory2RoundedIcon /> },
  { href: "/admin/arrange",   label: "Arrange",     blurb: "Drag categories and products into the order you want", icon: <SwapVertRoundedIcon /> },
  { href: "/admin/pricing",    label: "Price lists", blurb: "Pricelist 1 and 2, side by side",             icon: <PriceChangeRoundedIcon /> },
  { href: "/admin/wholesale",  label: "Wholesale",   blurb: "Dealer rates, case sizes and the shareable link", icon: <WarehouseRoundedIcon /> },
  { href: "/admin/categories", label: "Categories", blurb: "Manage categories and run a discount sale",  icon: <SellRoundedIcon /> },
];

const TABS = ["/admin", "/admin/pos", "/admin/orders", "/admin/products"];
const BAR_H = 62;

export default function AdminShell({ children }) {
  const { authed, toast, setToast, loadOrders, loadCatalogue, catalogue, logout } = useAdmin();
  const pathname = usePathname() || "/admin";
  const [moreOpen, setMoreOpen] = useState(false);

  /**
   * Turns off the browser's pull-to-refresh while the panel is open.
   *
   * A packer scrolling a long order list on a phone overshoots the top
   * constantly, and every overshoot reloaded the page and threw away whatever
   * was half-typed. Scoped to the admin and undone on the way out, so the
   * storefront keeps the gesture customers expect.
   */
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = "none";
    return () => { root.style.overscrollBehaviorY = prev; };
  }, []);

  // Exact match for the dashboard, prefix for the rest, so /admin isn't
  // highlighted while you're on /admin/orders.
  const isActive = (href) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const current = [...NAV].reverse().find((n) => isActive(n.href)) || NAV[0];

  if (authed === null) {
    return (
      <Stack alignItems="center" py={10}>
        <CircularProgress sx={{ color: "var(--primary-color)" }} />
      </Stack>
    );
  }
  if (authed === false) return <LoginGate onSuccess={() => loadOrders()} />;

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: { md: "100dvh" }, backgroundColor: "var(--surface-muted)" }}>
      <SideNav isActive={isActive} />

      <Stack
        component="main"
        flex={1}
        minWidth={0}
        px={{ xs: 2, md: 3 }}
        py={{ xs: 2, md: 2.5 }}
        gap={2}
        sx={{
          height: { xs: "auto", md: "100dvh" },
          overflow: { xs: "visible", md: "hidden" },
          backgroundColor: "var(--surface)",
          // Clear the fixed bar, plus whatever the phone's home indicator takes.
          pb: { xs: `calc(${BAR_H}px + env(safe-area-inset-bottom) + 12px)`, md: 0 },
        }}
      >
        {/* Sticky on a phone so the section you are in is always named, the way
            a native screen keeps its title bar. */}
        <Stack direction="row" alignItems="center" gap={1.5} flexShrink={0}
          sx={{ pb: 0.5,
                position: { xs: "sticky", md: "static" }, top: 0, zIndex: 5,
                backgroundColor: "var(--surface)",
                borderBottom: { xs: "1px solid var(--border)", md: "none" },
                mx: { xs: -2, md: 0 }, px: { xs: 2, md: 0 }, pt: { xs: 1, md: 0 } }}>
          <Stack flex={1} minWidth={0}>
            <Typography fontSize={{ xs: 18, md: 21 }} fontWeight={800} color="var(--text-color)" noWrap>
              {current.label}
            </Typography>
            <Typography fontSize={12} color="var(--text-color-secondary)" noWrap>
              {current.blurb}
            </Typography>
          </Stack>

          <Tooltip title="Refresh">
            <IconButton onClick={() => { loadOrders(); if (catalogue) loadCatalogue(); }} aria-label="refresh">
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
          <Button onClick={logout} startIcon={<LogoutRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{ display: { xs: "none", md: "inline-flex" }, textTransform: "none",
                  fontWeight: 700, fontSize: 13, color: "var(--text-color-secondary)" }}>
            Sign out
          </Button>
        </Stack>

        {children}
      </Stack>

      <BottomBar isActive={isActive} onMore={() => setMoreOpen(true)} moreOpen={moreOpen} />

      <Drawer anchor="bottom" open={moreOpen} onClose={() => setMoreOpen(false)}
        PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16,
                            pb: "calc(env(safe-area-inset-bottom) + 8px)" } }}>
        <Stack sx={{ p: 1 }}>
          <Box sx={{ width: 36, height: 4, borderRadius: 99, backgroundColor: "var(--border)", mx: "auto", my: 1 }} />
          {NAV.filter((n) => !TABS.includes(n.href)).map((n) => (
            <Stack key={n.href} component={Link} href={n.href} onClick={() => setMoreOpen(false)}
              direction="row" alignItems="center" gap={1.5}
              sx={{ px: 2, py: 1.5, borderRadius: "var(--radius)",
                    color: isActive(n.href) ? "var(--primary-color)" : "var(--text-color)",
                    "& svg": { fontSize: 20 } }}>
              {n.icon}
              <Stack>
                <Typography fontSize={14} fontWeight={800} color="inherit">{n.label}</Typography>
                <Typography fontSize={11.5} color="var(--text-color-secondary)">{n.blurb}</Typography>
              </Stack>
            </Stack>
          ))}
          <Divider sx={{ my: 1 }} />
          <Stack component="button" onClick={() => { setMoreOpen(false); logout(); }}
            direction="row" alignItems="center" gap={1.5}
            sx={{ px: 2, py: 1.5, border: 0, background: "none", cursor: "pointer",
                  color: "var(--danger, #d33)", "& svg": { fontSize: 20 } }}>
            <LogoutRoundedIcon />
            <Typography fontSize={14} fontWeight={800} color="inherit">Sign out</Typography>
          </Stack>
        </Stack>
      </Drawer>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={toast?.severity === "error" ? 12000 : 2600}
        onClose={(_, reason) => { if (reason !== "clickaway") setToast(null); }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: `calc(${BAR_H}px + env(safe-area-inset-bottom) + 10px)`, md: 24 } }}
      >
        <Alert severity={toast?.severity || "success"} variant="filled"
          onClose={() => setToast(null)} sx={{ fontWeight: 700, maxWidth: 520 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function SideNav({ isActive }) {
  const items = (
    <Stack gap={0.4} sx={{ p: 1.5 }}>
      <Stack component={Link} href="/admin" sx={{ px: 1.25, py: 1.5 }}>
        <Typography fontSize={15} fontWeight={800} color="var(--text-color)" lineHeight={1.2}>
          Sankamithra
        </Typography>
        <Typography fontSize={10.5} fontWeight={700} color="var(--primary-color)" letterSpacing={0.4}>
          ADMIN CONSOLE
        </Typography>
      </Stack>

      {NAV.map((n) => {
        const on = isActive(n.href);
        return (
          <Stack
            key={n.href}
            component={Link}
            href={n.href}
            direction="row"
            alignItems="center"
            gap={1.25}
            aria-current={on ? "page" : undefined}
            sx={{
              px: 1.25, py: 1.1, borderRadius: "var(--radius)",
              color: on ? "var(--primary-color)" : "var(--text-color-secondary)",
              backgroundColor: on ? "var(--primary-soft)" : "transparent",
              fontWeight: on ? 800 : 600,
              transition: "background-color var(--transition), color var(--transition)",
              "&:hover": { backgroundColor: on ? "var(--primary-soft)" : "#f0f0f0" },
              "& svg": { fontSize: 19 },
            }}
          >
            {n.icon}
            <Typography fontSize={13.5} fontWeight="inherit" color="inherit">{n.label}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );

  return (
    <Box component="nav"
        sx={{
          display: { xs: "none", md: "block" }, width: 216, flexShrink: 0,
          borderRight: "1px solid var(--border)", backgroundColor: "var(--surface-muted)",
          height: "100dvh", position: "sticky", top: 0,
        }}>
      {items}
    </Box>
  );
}

/**
 * The phone's primary navigation.
 *
 * Fixed to the viewport rather than the page, so it stays put while a long
 * order list scrolls under it - the thing that makes a web panel feel like an
 * app rather than a website. Targets are a full quarter of the width and
 * 62px tall, which is a thumb, not a cursor.
 */
function BottomBar({ isActive, onMore, moreOpen }) {
  const tabs = NAV.filter((n) => TABS.includes(n.href));
  return (
    <Box
      component="nav"
      aria-label="Sections"
      sx={{
        display: { xs: "flex", md: "none" },
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1200,
        height: `calc(${BAR_H}px + env(safe-area-inset-bottom))`,
        pb: "env(safe-area-inset-bottom)",
        backgroundColor: "var(--surface)",
        borderTop: "1px solid var(--border)",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.05)",
      }}
    >
      {tabs.map((n) => {
        const on = isActive(n.href) && !moreOpen;
        return (
          <Stack
            key={n.href}
            component={Link}
            href={n.href}
            aria-current={on ? "page" : undefined}
            alignItems="center"
            justifyContent="center"
            gap={0.25}
            sx={{
              flex: 1, minWidth: 0, textDecoration: "none",
              color: on ? "var(--primary-color)" : "var(--text-color-trinary)",
              "& svg": { fontSize: 21 },
              // A tap should feel like it registered even before the route changes.
              "&:active": { backgroundColor: "var(--surface-muted)" },
              transition: "color var(--transition)",
            }}
          >
            {n.icon}
            <Typography fontSize={10} fontWeight={on ? 800 : 600} color="inherit" noWrap>
              {n.label}
            </Typography>
          </Stack>
        );
      })}

      <Stack
        component="button"
        onClick={onMore}
        aria-label="More sections"
        alignItems="center"
        justifyContent="center"
        gap={0.25}
        sx={{
          flex: 1, minWidth: 0, border: 0, background: "none", cursor: "pointer",
          color: moreOpen ? "var(--primary-color)" : "var(--text-color-trinary)",
          "& svg": { fontSize: 21 },
          "&:active": { backgroundColor: "var(--surface-muted)" },
        }}
      >
        <MoreHorizRoundedIcon />
        <Typography fontSize={10} fontWeight={moreOpen ? 800 : 600} color="inherit">More</Typography>
      </Stack>
    </Box>
  );
}
