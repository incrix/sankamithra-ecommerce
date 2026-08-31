"use client";
import { Stack, Typography, LinearProgress, Box } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { MIN_ORDER } from "@/util/cart";

/**
 * The ₹3000 minimum, reframed.
 *
 * The old cart showed a disabled button and red "Minimum order amount is ₹3000"
 * text - a dead end with no next step. Here it's a progress bar with an exact
 * shortfall, so it reads as a goal to close rather than a rejection.
 */
export default function MinimumMeter({ total, shortBy, meetsMinimum }) {
  const pct = Math.min(100, (total / MIN_ORDER) * 100);

  if (meetsMinimum) {
    return (
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{
          backgroundColor: "#e9f8ef",
          border: "1px solid #b6e7c9",
          borderRadius: "10px",
          px: 1.5,
          py: 1,
        }}
      >
        <CheckCircleRoundedIcon sx={{ color: "#1d9b53", fontSize: 20 }} />
        <Typography fontSize={13} fontWeight={700} color="#14713c">
          Minimum order reached — you&apos;re ready to check out
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack
      gap={1}
      sx={{
        backgroundColor: "#fff7f3",
        border: "1px solid #ffe2d5",
        borderRadius: "10px",
        px: 1.5,
        py: 1.25,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography fontSize={13} fontWeight={800} color="var(--text-color)">
          Add{" "}
          <Box component="span" sx={{ color: "var(--primary-color)" }}>
            ₹{shortBy.toLocaleString("en-IN")}
          </Box>{" "}
          more to check out
        </Typography>
        <Typography fontSize={11} fontWeight={700} color="var(--text-color-secondary)">
          ₹{total.toLocaleString("en-IN")} / ₹{MIN_ORDER.toLocaleString("en-IN")}
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={pct}
        aria-label="progress toward minimum order"
        sx={{
          height: 7,
          borderRadius: 99,
          backgroundColor: "#ffe2d5",
          "& .MuiLinearProgress-bar": {
            borderRadius: 99,
            backgroundColor: "var(--primary-color)",
          },
        }}
      />
    </Stack>
  );
}
