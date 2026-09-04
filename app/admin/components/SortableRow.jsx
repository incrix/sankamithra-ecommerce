"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Stack, Box } from "@mui/material";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";

/**
 * One draggable row.
 *
 * The whole row is the handle rather than just the grip: this is used on a
 * phone as much as a desktop, and a 20px grip is not a thumb target. The grip
 * stays as the visual cue that the row moves.
 */
export default function SortableRow({ id, children, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  return (
    <Stack
      ref={setNodeRef}
      direction="row"
      alignItems="center"
      gap={1}
      {...attributes}
      {...listeners}
      sx={{
        transform: CSS.Transform.toString(transform),
        transition,
        // Lifted off the page while held, so it is obvious what is moving.
        zIndex: isDragging ? 2 : 1,
        position: "relative",
        opacity: isDragging ? 0.9 : 1,
        boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.18)" : "none",
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        px: 1.25, py: 1,
        cursor: disabled ? "default" : "grab",
        "&:active": { cursor: disabled ? "default" : "grabbing" },
        // Without this the browser scrolls the page instead of dragging the row.
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {!disabled && (
        <DragIndicatorRoundedIcon sx={{ fontSize: 18, color: "var(--text-color-trinary)", flexShrink: 0 }} />
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Stack>
  );
}
