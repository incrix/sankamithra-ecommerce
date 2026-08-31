"use client";
import { Stack, Typography, Box } from "@mui/material";
import { useState, useRef } from "react";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/**
 * Revenue over the last N days.
 *
 * One series, so no legend - the title names it. Inline SVG rather than a chart
 * library: it is a single path and keeps the admin bundle small.
 * Colour is the brand orange, validated at >= 3:1 against the white surface.
 */
export default function RevenueChart({ data, height = 190 }) {
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);

  const max = Math.max(1, ...data.map((d) => d.revenue));
  const W = 100; // viewBox units; the SVG scales to its container
  const H = 100;
  const padY = 8;

  const x = (i) => (data.length <= 1 ? 0 : (i / (data.length - 1)) * W);
  const y = (v) => H - padY - (v / max) * (H - padY * 2);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.revenue)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  const onMove = (e) => {
    const el = wrapRef.current;
    if (!el || data.length === 0) return;
    const r = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setHover(Math.round(ratio * (data.length - 1)));
  };

  const total = data.reduce((a, d) => a + d.revenue, 0);
  const peak = data.reduce((a, d) => (d.revenue > a.revenue ? d : a), data[0] || { revenue: 0 });

  return (
    <Stack gap={1.5} sx={panel}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
        <Stack>
          <Typography fontSize={14} fontWeight={800} color="var(--text-color)">
            Revenue, last {data.length} days
          </Typography>
          <Typography fontSize={11.5} color="var(--text-color-secondary)">
            Cancelled orders excluded
          </Typography>
        </Stack>
        <Stack alignItems="flex-end">
          <Typography fontSize={20} fontWeight={800} color="var(--text-color)">{inr(total)}</Typography>
          <Typography fontSize={11} color="var(--text-color-secondary)">
            best day {inr(peak?.revenue)}
          </Typography>
        </Stack>
      </Stack>

      <Box
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        sx={{ position: "relative", width: "100%", height, cursor: "crosshair" }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff4800" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ff4800" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Recessive gridlines */}
          {[0, 0.5, 1].map((t) => (
            <line key={t} x1="0" x2={W} y1={padY + t * (H - padY * 2)} y2={padY + t * (H - padY * 2)}
              stroke="#eeeeee" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
          ))}

          <path d={area} fill="url(#revFill)" />
          <path d={line} fill="none" stroke="#ff4800" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

          {hover != null && data[hover] && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={padY} y2={H} stroke="#ff4800" strokeWidth="1"
                strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity="0.5" />
              {/* 2px surface ring so the marker reads over the line */}
              <circle cx={x(hover)} cy={y(data[hover].revenue)} r="4" fill="#ff4800"
                stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>

        {hover != null && data[hover] && (
          <Box
            sx={{
              position: "absolute", top: 0, pointerEvents: "none",
              left: `${(hover / Math.max(1, data.length - 1)) * 100}%`,
              transform: `translateX(${hover > data.length / 2 ? "-105%" : "5%"})`,
              backgroundColor: "var(--text-color)", color: "#fff",
              px: 1.25, py: 0.75, borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow)", whiteSpace: "nowrap",
            }}
          >
            <Typography fontSize={11} sx={{ opacity: 0.75 }}>{data[hover].label}</Typography>
            <Typography fontSize={13} fontWeight={800}>{inr(data[hover].revenue)}</Typography>
            <Typography fontSize={10.5} sx={{ opacity: 0.75 }}>
              {data[hover].orders} {data[hover].orders === 1 ? "order" : "orders"}
            </Typography>
          </Box>
        )}
      </Box>

      <Stack direction="row" justifyContent="space-between">
        <Typography fontSize={10.5} color="var(--text-color-trinary)" fontWeight={600}>{data[0]?.label}</Typography>
        <Typography fontSize={10.5} color="var(--text-color-trinary)" fontWeight={600}>{data[data.length - 1]?.label}</Typography>
      </Stack>
    </Stack>
  );
}

export const panel = {
  p: { xs: 2, md: 2.5 },
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  backgroundColor: "var(--surface)",
};
