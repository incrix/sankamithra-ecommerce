"use client";
import { Stack, Typography, Box, LinearProgress, Tooltip, Chip } from "@mui/material";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import StatusChip from "./StatusChip";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const ago = (iso) => {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/** Compact list row - scannable at a glance, packing progress inline. */
export default function OrderRow({ order, selected, onClick }) {
  const done = order.items.filter((i) => i.packed).length;
  const pct = order.items.length ? (done / order.items.length) * 100 : 0;

  // Ageing: an order still waiting to be packed after two days is the thing
  // that gets lost when there are hundreds in the list.
  const days = (Date.now() - new Date(order.createdAt)) / 864e5;
  const waiting = ["new", "packing"].includes(order.status);
  const stale = waiting && days >= 2;
  const urgent = waiting && days >= 5;

  return (
    <Stack
      data-order-row={order.ref}
      onClick={onClick}
      gap={0.75}
      sx={{
        p: 1.5, cursor: "pointer", borderRadius: "12px",
        border: "1.5px solid",
        borderLeft: urgent ? "4px solid #c92a2a" : stale ? "4px solid #b26a00" : undefined,
        borderColor: selected ? "var(--primary-color)" : "#ededed",
        backgroundColor: selected ? "#fff8f5" : "#fff",
        transition: "border-color .12s, background-color .12s",
        "&:hover": { borderColor: selected ? "var(--primary-color)" : "#ffd9c9" },
      }}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography fontSize={13} fontWeight={800} color="var(--text-color)">{order.ref}</Typography>
        <StatusChip status={order.status} />
        {order.source === "pos" && (
          <Tooltip title="Billed at the counter">
            <Chip label="Counter" size="small"
              sx={{ height: 18, fontSize: 9, fontWeight: 800, backgroundColor: "#eaf1fb", color: "#1554ad" }} />
          </Tooltip>
        )}
        {stale && (
          <Tooltip title={`Waiting ${Math.floor(days)} days — pack this first`}>
            <Stack direction="row" alignItems="center" gap={0.25}
              sx={{ px: 0.6, py: 0.1, borderRadius: 99, backgroundColor: urgent ? "#ffeaea" : "#fff8e1" }}>
              <ScheduleRoundedIcon sx={{ fontSize: 12, color: urgent ? "#c92a2a" : "#b26a00" }} />
              <Typography fontSize={10} fontWeight={800} color={urgent ? "#c92a2a" : "#b26a00"}>
                {Math.floor(days)}d
              </Typography>
            </Stack>
          </Tooltip>
        )}
        <Box flex={1} />
        <Typography fontSize={11} color="var(--text-color-secondary)" fontWeight={600}>
          {ago(order.createdAt)}
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="baseline" gap={1}>
        <Typography fontSize={13.5} fontWeight={700} color="var(--text-color)" noWrap flex={1}>
          {order.customer.name}
        </Typography>
        <Typography fontSize={14} fontWeight={800} color="var(--text-color)">
          {inr(order.total)}
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" gap={1}>
        <Typography fontSize={11.5} color="var(--text-color-secondary)" fontWeight={600}>
          {/* A counter sale often has no city, so don't leave a dangling separator */}
          {[order.customer.city, `${order.items.length} lines`, `${order.itemCount} units`]
            .filter(Boolean)
            .join(" · ")}
        </Typography>
      </Stack>

      {(order.status === "packing" || (pct > 0 && pct < 100)) && (
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 4, borderRadius: 99, backgroundColor: "#f0f0f0",
            "& .MuiLinearProgress-bar": { borderRadius: 99, backgroundColor: "var(--primary-color)" },
          }}
        />
      )}
    </Stack>
  );
}
