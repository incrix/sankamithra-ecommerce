"use client";
import { useState, useMemo } from "react";
import { Stack, Typography, Box, Checkbox, LinearProgress, Chip, Button, Tooltip, IconButton, InputBase } from "@mui/material";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import QtyStepper from "@/app/components/commerce/QtyStepper";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import RemoveShoppingCartRoundedIcon from "@mui/icons-material/RemoveShoppingCartRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import { assetUrl } from "@/util/config";
import { inr } from "@/util/pricing";


/**
 * The packing checklist - the screen the owner actually works from.
 *
 * Rows are large and tappable because this gets used standing at a table with
 * a phone in one hand. A line can be ticked, marked out of stock, or replaced
 * with another product; a line the packer can't fill never blocks the order
 * from being completed.
 *
 * Long bills run to dozens of lines, so there is a search that narrows the
 * rows to the item being looked for. It only hides rows - the progress bar,
 * the counts and "Tick all" keep working on the whole bill, because what is
 * typed in a search box should never change what gets ticked.
 */
export default function PackingList({ items, onToggle, onTickAll, onUnavailable, onSubstitute, onCount, onRemove, editing, busy, locked }) {
  // A line is settled once it's packed, or once the packer has recorded that
  // it couldn't be filled. Both count as "dealt with".
  const settled = items.filter((i) => i.packed || (i.unavailable && !i.substitute)).length;
  const pct = items.length ? (settled / items.length) * 100 : 0;
  const short = items.filter((i) => i.unavailable).length;
  // "Tick all" flips to "Clear all" once every fillable line is ticked.
  const tickable = items.filter((i) => !(i.unavailable && !i.substitute));
  const allTicked = tickable.length > 0 && tickable.every((i) => i.packed);

  // The box stays closed until asked for: most bills are short enough to read.
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return items;
    // Every word has to land somewhere, so "green rocket" finds the one line
    // rather than everything green plus everything rocket.
    return items.filter((it) => {
      const hay = `${it.name} ${it.category} ${it.substitute?.name || ""}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [items, query]);

  const filtered = shown.length !== items.length;

  return (
    <Stack gap={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Packing list</Typography>
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Typography fontSize={12} fontWeight={700} color="var(--text-color-secondary)">
            {settled}/{items.length} done{short ? ` · ${short} short` : ""}
          </Typography>
          <Tooltip title="Search this bill">
            <IconButton
              size="small"
              onClick={() => {
                // Closing clears the query - leaving rows hidden behind a shut
                // box is how a packer misses a line.
                if (searching) setQuery("");
                setSearching(!searching);
              }}
              aria-label={searching ? "close search" : "search this bill"}
              sx={{
                p: 0.5, borderRadius: "var(--radius-sm)",
                color: searching || query ? "var(--primary-color)" : "var(--text-color-trinary)",
                backgroundColor: searching || query ? "var(--primary-soft)" : "transparent",
              }}
            >
              {searching ? <CloseRoundedIcon sx={{ fontSize: 18 }} /> : <SearchRoundedIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
          {onTickAll && !locked && (
            <Button
              size="small"
              onClick={onTickAll}
              startIcon={<DoneAllRoundedIcon sx={{ fontSize: 15 }} />}
              sx={{
                textTransform: "none", fontWeight: 800, fontSize: 12, py: 0.25, px: 1.25,
                minWidth: 0, borderRadius: "var(--radius-pill)", color: "var(--primary-color)",
                border: "1px solid var(--primary-color)",
                "&:hover": { backgroundColor: "var(--primary-soft)" },
              }}
            >
              {allTicked ? "Clear all" : "Tick all"}
            </Button>
          )}
        </Stack>
      </Stack>

      {searching && (
        <Stack direction="row" alignItems="center" gap={1}
          sx={{ px: 1.25, py: 0.5, borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
          <SearchRoundedIcon sx={{ fontSize: 17, color: "var(--text-color-trinary)" }} />
          <InputBase
            autoFocus
            placeholder="Search in bill…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") { setQuery(""); setSearching(false); } }}
            inputProps={{ "aria-label": "search in bill" }}
            sx={{ flex: 1, fontSize: 13.5 }}
          />
          {query && (
            <Typography fontSize={11.5} fontWeight={700} color="var(--text-color-secondary)" sx={{ flexShrink: 0 }}>
              {shown.length} of {items.length}
            </Typography>
          )}
          {query && (
            <IconButton size="small" onClick={() => setQuery("")} aria-label="clear search" sx={{ p: 0.25 }}>
              <CloseRoundedIcon sx={{ fontSize: 15, color: "var(--text-color-trinary)" }} />
            </IconButton>
          )}
        </Stack>
      )}

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
        {shown.length === 0 && (
          <Typography fontSize={12.5} fontWeight={600} color="var(--text-color-secondary)" textAlign="center" py={3}>
            No line on this bill matches “{query.trim()}”.
          </Typography>
        )}
        {shown.map((it) => {
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
                {editing ? null : <Checkbox
                  checked={Boolean(it.packed)}
                  disabled={dropped}
                  onChange={() => onToggle(it)}
                  disableRipple
                  inputProps={{ "aria-label": `packed: ${it.name}` }}
                  sx={{ p: 0.5, color: "var(--text-color-trinary)", "&.Mui-checked": { color: "var(--success)" } }}
                />}

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

                {editing ? (
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <QtyStepper
                      size="sm"
                      value={it.count}
                      onChange={(q) => onCount(it, q)}
                      onAdjust={(d) => onCount(it, Math.max(0, it.count + d))}
                    />
                    <Tooltip title="Take this off the order">
                      <IconButton size="small" onClick={() => onRemove(it)} aria-label={`remove ${it.name}`}
                        sx={{ color: "var(--text-color-trinary)", "&:hover": { color: "var(--danger)" } }}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ) : (
                  <Chip
                    label={`× ${it.count}`}
                    sx={{
                      fontWeight: 800, fontSize: 13, height: 30, minWidth: 52,
                      backgroundColor: it.packed ? "var(--success-soft)" : "var(--primary-soft)",
                      color: it.packed ? "var(--success-ink)" : "var(--primary-color)",
                      opacity: dropped || swapped ? 0.5 : 1,
                    }}
                  />
                )}
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

      {filtered && shown.length > 0 && (
        <Typography fontSize={11.5} fontWeight={700} color="var(--text-color-secondary)" textAlign="center">
          {items.length - shown.length} more {items.length - shown.length === 1 ? "line is" : "lines are"} hidden by the search
        </Typography>
      )}
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
