"use client";
import { Stack, Typography, Box } from "@mui/material";
import { useAdmin } from "../AdminContext";

/**
 * Which admin is calling this customer. Sits above the phone buttons so it is
 * checked before anyone rings - the names come from the dashboard's Admins card.
 */
export default function TakenBy({ order, busy, onPatch }) {
  const { admins } = useAdmin();
  const current = order.takenBy || "";
  // Someone removed from the list still shows on the orders they took.
  const options = current && !admins.includes(current) ? [current, ...admins] : admins;

  return (
    <Stack direction="row" alignItems="center" gap={1.25}
      sx={{ p: 1.25, borderRadius: "var(--radius)",
            backgroundColor: current ? "var(--success-soft)" : "var(--warning-soft)" }}>
      <Typography fontSize={12.5} fontWeight={800} color={current ? "var(--success-ink)" : "var(--warning)"} flexShrink={0}>
        Taken by
      </Typography>
      <Box
        component="select"
        aria-label="taken by"
        value={current}
        disabled={busy}
        onChange={(e) => onPatch({ takenBy: e.target.value })}
        sx={{
          flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, fontFamily: "inherit",
          color: "var(--text-color)", backgroundColor: "#fff",
          border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", py: 0.75, px: 1,
          cursor: "pointer",
        }}
      >
        <option value="">— Not taken yet —</option>
        {options.map((a) => <option key={a} value={a}>{a}</option>)}
      </Box>
      {admins.length === 0 && (
        <Typography fontSize={11} color="var(--text-color-secondary)" flexShrink={0}>
          Add names on the Dashboard
        </Typography>
      )}
    </Stack>
  );
}
