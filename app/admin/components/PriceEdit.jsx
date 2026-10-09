"use client";
import { Stack, Typography, InputBase } from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { useEffect, useRef, useState } from "react";

/**
 * A bill line's unit price that can be changed on the spot.
 *
 * Counter sales are often settled at a price agreed across the table, so the
 * biller taps the price, types what was agreed and moves on. `base` is what
 * the catalogue would charge; an edited line shows it struck through so the
 * change is never invisible, and one tap puts it back.
 */
export default function PriceEdit({ value, base, edited, onChange, format }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const input = useRef(null);

  useEffect(() => { if (open) input.current?.select(); }, [open]);

  const start = () => { setDraft(String(value)); setOpen(true); };

  const commit = () => {
    setOpen(false);
    const n = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(n) || n < 0) return;
    // Typing the catalogue price back in is the same as resetting it.
    onChange(Math.abs(n - base) < 0.005 ? null : n);
  };

  if (open) {
    return (
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Typography fontSize={11} fontWeight={700} color="var(--text-color-secondary)">₹</Typography>
        <InputBase
          inputRef={input}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, "").slice(0, 9))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setOpen(false);
          }}
          inputProps={{ inputMode: "decimal", "aria-label": "price each" }}
          sx={{ width: 72, fontSize: 12, fontWeight: 800, px: 0.75, borderRadius: "6px",
                border: "1.5px solid var(--primary-color)", backgroundColor: "#fff" }}
        />
        <Typography fontSize={10.5} color="var(--text-color-secondary)">each</Typography>
      </Stack>
    );
  }

  return (
    <Stack direction="row" alignItems="center" gap={0.5} flexWrap="wrap">
      <Stack
        component="button"
        type="button"
        onClick={start}
        direction="row"
        alignItems="center"
        gap={0.4}
        aria-label="edit price"
        sx={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.4,
              "&:hover p, &:hover svg": { color: "var(--primary-color)" } }}
      >
        <Typography fontSize={10.5} fontWeight={edited ? 800 : 400}
          color={edited ? "var(--primary-color)" : "var(--text-color-secondary)"}
          sx={{ borderBottom: "1px dashed currentColor", lineHeight: 1.3 }}>
          {format(value)} each
        </Typography>
        <EditRoundedIcon sx={{ fontSize: 11, color: "var(--text-color-trinary)" }} />
      </Stack>
      {edited && (
        <>
          <Typography fontSize={10} color="var(--text-color-trinary)" sx={{ textDecoration: "line-through" }}>
            {format(base)}
          </Typography>
          <Typography
            component="button"
            type="button"
            onClick={() => onChange(null)}
            sx={{ all: "unset", cursor: "pointer", fontSize: 10, fontWeight: 800, color: "var(--text-color-secondary)",
                  "&:hover": { color: "var(--primary-color)" } }}
          >
            reset
          </Typography>
        </>
      )}
    </Stack>
  );
}
