"use client";
import {
  Stack, Box, Typography, Button, IconButton, Tooltip, Drawer,
  Snackbar, Alert, CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import { useState } from "react";
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
  { href: "/admin/categories", label: "Categories", blurb: "Manage categories and run a discount sale",  icon: <SellRoundedIcon /> },
];

export default function AdminShell({ children }) {
  const { authed, toast, setToast, loadOrders, loadCatalogue, catalogue, logout } = useAdmin();
  const pathname = usePathname() || "/admin";
  const [navOpen, setNavOpen] = useState(false);

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
      <SideNav isActive={isActive} open={navOpen} onClose={() => setNavOpen(false)} />

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
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.5} flexShrink={0} sx={{ pb: 0.5 }}>
          <IconButton onClick={() => setNavOpen(true)} aria-label="open menu"
            sx={{ display: { xs: "inline-flex", md: "none" }, color: "var(--text-color)" }}>
            <MenuRoundedIcon />
          </IconButton>

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
            sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, color: "var(--text-color-secondary)" }}>
            Sign out
          </Button>
        </Stack>

        {children}
      </Stack>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={toast?.severity === "error" ? 12000 : 2600}
        onClose={(_, reason) => { if (reason !== "clickaway") setToast(null); }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast?.severity || "success"} variant="filled"
          onClose={() => setToast(null)} sx={{ fontWeight: 700, maxWidth: 520 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function SideNav({ isActive, open, onClose }) {
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
            onClick={onClose}
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
    <>
      <Box component="nav"
        sx={{
          display: { xs: "none", md: "block" }, width: 216, flexShrink: 0,
          borderRight: "1px solid var(--border)", backgroundColor: "var(--surface-muted)",
          height: "100dvh", position: "sticky", top: 0,
        }}>
        {items}
      </Box>
      <Drawer anchor="left" open={open} onClose={onClose}
        sx={{ display: { xs: "block", md: "none" } }}
        PaperProps={{ sx: { width: 230, backgroundColor: "var(--surface-muted)" } }}>
        {items}
      </Drawer>
    </>
  );
}
