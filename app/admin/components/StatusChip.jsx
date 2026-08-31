"use client";
import { Chip } from "@mui/material";

export const STATUS_STYLE = {
  new:        { label: "New",        bg: "#fff1ea", fg: "#d63c00" },
  packing:    { label: "Packing",    bg: "#fff8e1", fg: "#b26a00" },
  packed:     { label: "Packed",     bg: "#e9f8ef", fg: "#14713c" },
  dispatched: { label: "Dispatched", bg: "#eaf1fb", fg: "#1554ad" },
  cancelled:  { label: "Cancelled",  bg: "#f3f3f3", fg: "#777" },
};

export default function StatusChip({ status, size = "small" }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.new;
  return (
    <Chip
      label={s.label}
      size={size}
      sx={{ height: 21, fontSize: 10.5, fontWeight: 800, backgroundColor: s.bg, color: s.fg }}
    />
  );
}
