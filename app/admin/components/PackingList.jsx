"use client";
import { Stack, Typography, Box, Checkbox, LinearProgress, Chip, Button, Tooltip } from "@mui/material";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import RemoveShoppingCartRoundedIcon from "@mui/icons-material/RemoveShoppingCartRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import { assetUrl } from "@/util/config";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/**
 * The packing checklist - the screen the owner actually works from.
 *
 * Rows are large and tappable because this gets used standing at a table with
 * a phone in one hand. A line can be ticked, marked out of stock, or replaced
 * with another product; a line the packer can't fill never blocks the order
 * from being completed.
 */
export default function PackingList({ items, onToggle, onUnavailable, onSubstitute, busy }) {
  // A line is settled once it's packed, or once the packer has recorded that
  // it couldn't be filled. Both count as "dealt with".
  const settled = items.filter((i) => i.packed || (i.unavailable && !i.substitute)).length;
  const pct = items.length ? (settled / items.length) * 100 : 0;
  const short = items.filter((i) => i.unavailable).length;

  return (
    <Stack gap={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
        <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Packing list</Typography>
        <Typography fontSize={12} fontWeight={700} color="var(--text-color-secondary)">
          {settled}/{items.length} done{short ? ` · ${short} short` : ""}
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 8, borderRadius: 99, backgroundColor: "#f0f0f0",
          "& .MuiLinearProgress-bar": {
            borderRadius: 99,
            backgroundColor: pct === 100 ? "var(--success)" : "var(--primary-color)",
          },
        }}
      />

      <Stack gap={0.75}>
        {items.map((it) => {
          const dropped = it.unavailable && !it.substitute;
          const swapped = Boolean(it.substitute);

          return (
            <Stack
              key={it.id}
              gap={1}
              sx={{
                p: 1, borderRadius: "var(--radius)",
                border: "1px solid",
                borderColor: dropped ? "#ffd4d4" : swapped ? "#ffe2b0" : it.packed ? "#b6e7c9" : "var(--border)",
                backgroundColor: dropped ? "#fff6f6" : swapped ? "#fffaf0" : it.packed ? "#f3fbf6" : "#fff",
                opacity: busy ? 0.6 : 1,
              }}
            >
              <Stack direction="row" alignItems="center" gap={1.25}>
                <Checkbox
                  checked={Boolean(it.packed)}
                  disabled={busy || dropped}
                  onChange={() => onToggle(it)}
                  disableRipple
                  inputProps={{ "aria-label": `packed: ${it.name}` }}
                  sx={{ p: 0.5, color: "var(--text-color-trinary)", "&.Mui-checked": { color: "var(--success)" } }}
                />

                <Box component="img" src={assetUrl(it.image)} alt=""
                  sx={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", objectFit: "cover", flexShrink: 0, backgroundColor: "#f6f6f6" }} />

                <Stack flex={1} minWidth={0}>
                  <Typography
                    fontSize={13.5} fontWeight={800} color="var(--text-color)"
                    sx={{ lineHeight: 1.3, textDecoration: it.packed || dropped || swapped ? "line-through" : "none",
                          opacity: dropped || swapped ? 0.65 : 1 }}
                  >
                    {it.name}
                  </Typography>
                  <Typography fontSize={11.5} color="var(--text-color-secondary)" fontWeight={600}>
                    {it.category} · {inr(it.unitPrice)} each
                  </Typography>
                </Stack>

                <Chip
                  label={`× ${it.count}`}
                  sx={{
                    fontWeight: 800, fontSize: 13, height: 30, minWidth: 52,
                    backgroundColor: it.packed ? "var(--success-soft)" : "var(--primary-soft)",
                    color: it.packed ? "var(--success-ink)" : "var(--primary-color)",
                    opacity: dropped || swapped ? 0.5 : 1,
                  }}
                />
              </Stack>

              {/* Replacement chosen for this line */}
              {swapped && (
                <Stack direction="row" alignItems="center" gap={1.25}
                  sx={{ ml: 4.5, p: 1, borderRadius: "var(--radius-sm)", backgroundColor: "#fff", border: "1px dashed var(--border-strong)" }}>
                  <SwapHorizRoundedIcon sx={{ fontSize: 17, color: "var(--warning)", flexShrink: 0 }} />
                  <Box component="img" src={assetUrl(it.substitute.image)} alt=""
                    sx={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0, backgroundColor: "#f6f6f6" }} />
                  <Stack flex={1} minWidth={0}>
                    <Typography fontSize={12.5} fontWeight={800} color="var(--text-color)" noWrap>
                      {it.substitute.name}
                    </Typography>
                    <Typography fontSize={11} color="var(--text-color-secondary)" fontWeight={600}>
                      Replacement · {inr(it.substitute.unitPrice)} each
                    </Typography>
                  </Stack>
                  <Chip label={`× ${it.substitute.count}`}
                    sx={{ fontWeight: 800, fontSize: 12, height: 26, backgroundColor: "var(--warning-soft)", color: "var(--warning)" }} />
                </Stack>
              )}

              {dropped && (
                <Typography fontSize={11.5} fontWeight={700} color="var(--danger-ink)" sx={{ ml: 4.5 }}>
                  Out of stock — removed from the order ({inr(it.total)} off the total)
                </Typography>
              )}

              {/* Actions */}
              <Stack direction="row" gap={0.75} sx={{ ml: 4.5 }} flexWrap="wrap">
                {!it.unavailable ? (
                  <Tooltip title="Shelf is empty for this item">
                    <Button size="small" disabled={busy} onClick={() => onUnavailable(it, true)}
                      startIcon={<RemoveShoppingCartRoundedIcon sx={{ fontSize: 14 }} />} sx={miniBtn}>
                      Out of stock
                    </Button>
                  </Tooltip>
                ) : (
                  <Button size="small" disabled={busy} onClick={() => onUnavailable(it, false)}
                    startIcon={<UndoRoundedIcon sx={{ fontSize: 14 }} />} sx={miniBtn}>
                    Back in stock
                  </Button>
                )}

                <Button size="small" disabled={busy} onClick={() => onSubstitute(it)}
                  startIcon={<SwapHorizRoundedIcon sx={{ fontSize: 14 }} />}
                  sx={{ ...miniBtn, color: "var(--primary-color)", borderColor: "#ffd9c9" }}>
                  {swapped ? "Change replacement" : "Replace"}
                </Button>
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}

const miniBtn = {
  textTransform: "none", fontWeight: 700, fontSize: 11.5,
  py: 0.25, px: 1, borderRadius: "var(--radius-sm)", minWidth: 0,
  color: "var(--text-color-secondary)",
  border: "1px solid var(--border)",
  "&:hover": { backgroundColor: "var(--surface-muted)" },
};
