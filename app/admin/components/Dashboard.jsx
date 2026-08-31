"use client";
import { Stack, Box, Typography, LinearProgress, Chip } from "@mui/material";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import RevenueChart, { panel } from "./RevenueChart";
import { summary, dailySeries, topProducts } from "@/util/analytics";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/** Pipeline stages read as a progression, so a single hue stepped light -> dark. */
const STAGES = [
  { key: "new", label: "New", color: "#ffb08c" },
  { key: "packing", label: "Packing", color: "#ff8a5c" },
  { key: "packed", label: "Packed", color: "#ff6a2e" },
  { key: "dispatched", label: "Dispatched", color: "#d63c00" },
];

export default function Dashboard({ orders, onJump }) {
  const s = summary(orders);
  const series = dailySeries(orders, 14);
  const top = topProducts(orders, 6);
  const maxUnits = Math.max(1, ...top.map((t) => t.units));
  const pipelineMax = Math.max(1, ...STAGES.map((st) => s.by[st.key] || 0));

  return (
    <Stack gap={2}>
      {/* Headline numbers. Revenue leads because it's the question owners ask first. */}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(4,1fr)" } }}>
        <Kpi
          icon={<TrendingUpRoundedIcon />}
          label="Revenue"
          value={inr(s.revenue)}
          sub={`${inr(s.weekRevenue)} in the last 7 days`}
          accent
        />
        <Kpi
          icon={<ReceiptLongRoundedIcon />}
          label="Orders"
          value={s.liveOrders}
          sub={s.todayCount ? `${s.todayCount} today` : "none today"}
        />
        <Kpi
          icon={<Inventory2RoundedIcon />}
          label="Average order"
          value={inr(s.avgOrder)}
          sub={`${s.units} units sold`}
        />
        <Kpi
          icon={<LocalShippingRoundedIcon />}
          label="To pack"
          value={s.toPack}
          sub={`${s.readyToSend} ready to send`}
          onClick={() => onJump?.("active")}
        />
      </Box>

      {/* Things that need a human decision */}
      {(s.adjusted > 0 || s.unnotified > 0) && (
        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>
          {s.adjusted > 0 && (
            <Alert tone="warning" icon={<WarningAmberRoundedIcon />}>
              <b>{s.adjusted}</b> {s.adjusted === 1 ? "order has" : "orders have"} a changed total after
              substitutions — confirm with the customer.
            </Alert>
          )}
          {s.unnotified > 0 && (
            <Alert tone="warning" icon={<WarningAmberRoundedIcon />}>
              <b>{s.unnotified}</b> {s.unnotified === 1 ? "order" : "orders"} never got a notification
              email. Send one from the order.
            </Alert>
          )}
        </Stack>
      )}

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "1.55fr 1fr" } }}>
        <RevenueChart data={series} />

        {/* Pipeline. Discrete counts with a direct label on every row - identity
            is never carried by colour alone. */}
        <Stack gap={1.5} sx={panel}>
          <Stack>
            <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Order pipeline</Typography>
            <Typography fontSize={11.5} color="var(--text-color-secondary)">Where every open order sits</Typography>
          </Stack>

          <Stack gap={1.25}>
            {STAGES.map((st) => {
              const n = s.by[st.key] || 0;
              return (
                <Stack key={st.key} gap={0.5} onClick={() => onJump?.(st.key)} sx={{ cursor: "pointer" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography fontSize={12.5} fontWeight={700} color="var(--text-color)">{st.label}</Typography>
                    <Typography fontSize={13} fontWeight={800} color="var(--text-color)">{n}</Typography>
                  </Stack>
                  <Box sx={{ height: 8, borderRadius: 99, backgroundColor: "#f2f2f2", overflow: "hidden" }}>
                    <Box sx={{ width: `${(n / pipelineMax) * 100}%`, height: "100%", borderRadius: 99, backgroundColor: st.color, transition: "width var(--transition)" }} />
                  </Box>
                </Stack>
              );
            })}
          </Stack>

          {s.cancelled > 0 && (
            <Stack direction="row" justifyContent="space-between" sx={{ pt: 1, borderTop: "1px solid var(--border)" }}>
              <Typography fontSize={12} fontWeight={700} color="var(--text-color-secondary)">Cancelled</Typography>
              <Typography fontSize={12.5} fontWeight={800} color="var(--text-color-secondary)">{s.cancelled}</Typography>
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Top products - one hue, identity from the label beside each bar */}
      <Stack gap={1.5} sx={panel}>
        <Stack>
          <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Top products by units</Typography>
          <Typography fontSize={11.5} color="var(--text-color-secondary)">
            Counts what actually shipped, replacements included
          </Typography>
        </Stack>

        {top.length === 0 ? (
          <Typography fontSize={13} color="var(--text-color-secondary)" py={2} textAlign="center">
            No orders yet.
          </Typography>
        ) : (
          <Stack gap={1.25}>
            {top.map((t) => (
              <Stack key={t.name} gap={0.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
                  <Typography fontSize={12.5} fontWeight={700} color="var(--text-color)" noWrap>{t.name}</Typography>
                  <Typography fontSize={12} fontWeight={800} color="var(--text-color)" whiteSpace="nowrap">
                    {t.units} units · {inr(t.value)}
                  </Typography>
                </Stack>
                <Box sx={{ height: 8, borderRadius: 99, backgroundColor: "#f2f2f2", overflow: "hidden" }}>
                  <Box sx={{ width: `${(t.units / maxUnits) * 100}%`, height: "100%", borderRadius: 99, backgroundColor: "#ff4800" }} />
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

function Kpi({ icon, label, value, sub, accent, onClick }) {
  return (
    <Stack
      gap={0.5}
      onClick={onClick}
      sx={{
        ...panel,
        p: { xs: 1.75, md: 2 },
        cursor: onClick ? "pointer" : "default",
        borderColor: accent ? "var(--primary-border)" : "var(--border)",
        backgroundColor: accent ? "var(--primary-softer)" : "var(--surface)",
        "&:hover": onClick ? { borderColor: "var(--primary-color)" } : undefined,
      }}
    >
      <Stack direction="row" alignItems="center" gap={0.75}>
        <Box sx={{ display: "flex", color: accent ? "var(--primary-color)" : "var(--text-color-trinary)", "& svg": { fontSize: 16 } }}>
          {icon}
        </Box>
        <Typography fontSize={11} fontWeight={700} color="var(--text-color-secondary)">{label}</Typography>
      </Stack>
      <Typography fontSize={{ xs: 20, md: 23 }} fontWeight={800} color={accent ? "var(--primary-color)" : "var(--text-color)"} lineHeight={1.15}>
        {value}
      </Typography>
      <Typography fontSize={11} color="var(--text-color-secondary)">{sub}</Typography>
    </Stack>
  );
}

function Alert({ tone, icon, children }) {
  return (
    <Stack direction="row" gap={1} alignItems="center" flex={1}
      sx={{ p: 1.5, borderRadius: "var(--radius)", backgroundColor: "var(--warning-soft)", border: "1px solid #ffe4a3" }}>
      <Box sx={{ display: "flex", color: "var(--warning)", "& svg": { fontSize: 18 } }}>{icon}</Box>
      <Typography fontSize={12.5} color="var(--warning)" lineHeight={1.5}>{children}</Typography>
    </Stack>
  );
}
