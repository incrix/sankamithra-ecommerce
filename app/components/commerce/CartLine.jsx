"use client";
import { Stack, Typography, IconButton, Box } from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { assetUrl } from "@/util/config";
import QtyStepper from "./QtyStepper";
import { unitPrice, lineTotal } from "@/util/cart";

/**
 * One cart row. Unlike the old table (name + numbers only, 700px min-width and
 * therefore horizontally scrolling on every phone) this is a self-contained
 * card: thumbnail, name, live per-line maths, editable quantity.
 */
export default function CartLine({ item, onQty, onAdjust, onRemove }) {
  return (
    <Stack
      direction="row"
      gap={1.5}
      sx={{
        p: 1,
        borderRadius: "12px",
        border: "1px solid #eee",
        backgroundColor: "#fff",
        transition: "border-color .15s, box-shadow .15s",
        "&:hover": { borderColor: "#ffd9c9", boxShadow: "0 2px 10px rgba(0,0,0,.05)" },
      }}
    >
      <Box
        component="img"
        src={assetUrl(item.image?.[0])}
        alt=""
        sx={{
          width: 60,
          height: 60,
          borderRadius: "8px",
          objectFit: "cover",
          flexShrink: 0,
          backgroundColor: "#f6f6f6",
        }}
      />

      <Stack flex={1} gap={0.75} minWidth={0}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Typography
            fontSize={13.5}
            fontWeight={800}
            color="var(--text-color)"
            sx={{
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.name}
          </Typography>

          <IconButton
            size="small"
            aria-label={`remove ${item.name}`}
            onClick={onRemove}
            sx={{
              color: "var(--text-color-trinary)",
              flexShrink: 0,
              "&:hover": { color: "#e03131", backgroundColor: "#ffeaea" },
            }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
          <QtyStepper
            size="sm"
            value={item.count}
            onChange={(q) => onQty(q)}
            onAdjust={(d) => onAdjust(d)}
          />

          <Stack alignItems="flex-end">
            <Typography fontSize={14} fontWeight={800} color="var(--text-color)">
              ₹{lineTotal(item).toLocaleString("en-IN")}
            </Typography>
            <Typography fontSize={10.5} color="var(--text-color-secondary)" fontWeight={600}>
              ₹{unitPrice(item)} each
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
