"use client";
import { Stack, IconButton, InputBase } from "@mui/material";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useEffect, useState } from "react";

/**
 * Quantity control with a TYPEABLE field.
 *
 * The old cart only had +/- one at a time - ordering 20 of something meant 20
 * taps. Fireworks are bought in bulk, so the number itself is an input here.
 */
export default function QtyStepper({ value, onChange, onAdjust, size = "md", max = 999 }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (raw) => {
    const n = parseInt(String(raw).replace(/\D/g, ""), 10);
    onChange(Number.isNaN(n) ? 0 : Math.min(n, max));
  };

  const dim = size === "sm" ? 28 : 34;

  const btn = {
    width: dim,
    height: dim,
    borderRadius: "8px",
    color: "var(--primary-color)",
    backgroundColor: "#fff",
    border: "1px solid #ffd9c9",
    "&:hover": { backgroundColor: "#fff1ea", border: "1px solid var(--primary-color)" },
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.5}
      sx={{
        backgroundColor: "#fff7f3",
        border: "1px solid #ffe2d5",
        borderRadius: "10px",
        p: "3px",
        width: "fit-content",
      }}
    >
      <IconButton
        sx={btn}
        aria-label="decrease quantity"
        onClick={() => (onAdjust ? onAdjust(-1) : onChange(Math.max(0, value - 1)))}
      >
        <RemoveRoundedIcon fontSize="small" />
      </IconButton>

      <InputBase
        value={draft}
        // These must go through inputProps: set directly on InputBase they land
        // on the wrapper div, leaving the real <input> unlabelled and - worse
        // on a phone - without the numeric keypad.
        inputProps={{
          inputMode: "numeric",
          pattern: "[0-9]*",
          "aria-label": "quantity",
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        sx={{
          width: size === "sm" ? 34 : 44,
          "& input": {
            textAlign: "center",
            fontWeight: 800,
            fontSize: size === "sm" ? 13 : 15,
            color: "var(--text-color)",
            p: 0,
          },
        }}
      />

      <IconButton
        sx={btn}
        aria-label="increase quantity"
        onClick={() => (onAdjust ? onAdjust(1) : onChange(Math.min(max, value + 1)))}
      >
        <AddRoundedIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
