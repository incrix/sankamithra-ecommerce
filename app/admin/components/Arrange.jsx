"use client";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, verticalListSortingStrategy, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Stack, Box, Typography, Button, Chip, CircularProgress, Divider } from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import SortableRow from "./SortableRow";

/**
 * The order the shop appears in.
 *
 * Two lists, because they are two different decisions: which category a
 * customer meets first, and which product leads inside it. Reordering products
 * reuses the sort positions that category already occupies, so promoting a
 * rocket never pushes it past a sparkler in the all-products view.
 */

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const net = (p) => Math.round(p.price - (p.price * (p.discount || 0)) / 100);

export default function Arrange({ catalogue, loading, onReload, onToast }) {
  const products = useMemo(() => catalogue?.products || [], [catalogue]);
  const storedCats = useMemo(() => catalogue?.categories || [], [catalogue]);

  const [cats, setCats] = useState([]);
  const [active, setActive] = useState(null);
  const [items, setItems] = useState([]);
  const [savingCats, setSavingCats] = useState(false);
  const [savingItems, setSavingItems] = useState(false);

  // Touch first: this gets used on a phone at the counter. The small distance
  // constraint lets a tap still be a tap rather than starting a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { setCats(storedCats); }, [storedCats]);
  useEffect(() => {
    if (!active && storedCats.length) setActive(storedCats[0]);
  }, [storedCats, active]);

  useEffect(() => {
    if (!active) return;
    setItems(
      products
        .filter((p) => p.category === active)
        .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.id - b.id)
    );
  }, [active, products]);

  const catCounts = useMemo(() => {
    const m = new Map();
    products.forEach((p) => m.set(p.category, (m.get(p.category) || 0) + 1));
    return m;
  }, [products]);

  const catsDirty = cats.join("|") !== storedCats.join("|");
  const storedItemOrder = useMemo(
    () => products.filter((p) => p.category === active)
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.id - b.id)
      .map((p) => p.id).join("|"),
    [products, active]
  );
  const itemsDirty = items.map((p) => p.id).join("|") !== storedItemOrder;

  function onCatDragEnd({ active: a, over }) {
    if (!over || a.id === over.id) return;
    setCats((prev) => arrayMove(prev, prev.indexOf(a.id), prev.indexOf(over.id)));
  }
  function onItemDragEnd({ active: a, over }) {
    if (!over || a.id === over.id) return;
    setItems((prev) => {
      const from = prev.findIndex((p) => p.id === a.id);
      const to = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, from, to);
    });
  }

  async function saveCats() {
    setSavingCats(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", values: cats }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not save");
      onToast("Category order saved");
      onReload();
    } catch (e) { onToast(e.message, "error"); } finally { setSavingCats(false); }
  }

  async function saveItems() {
    setSavingItems(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", ids: items.map((p) => p.id) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not save");
      onToast(`${active} order saved`);
      onReload();
    } catch (e) { onToast(e.message, "error"); } finally { setSavingItems(false); }
  }

  if (loading) return <Stack alignItems="center" py={6}><CircularProgress size={22} /></Stack>;

  return (
    <Stack gap={1.5} sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
      <Typography fontSize={13} color="var(--text-color-secondary)">
        Drag to arrange. Categories set the order of the filter chips on the shop;
        products set the order inside a category. Each list saves separately.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} gap={1.5} sx={{ flex: 1, minHeight: 0 }}>
        {/* Categories */}
        <Panel
          title="Categories"
          subtitle={`${cats.length} on the shop`}
          dirty={catsDirty}
          saving={savingCats}
          onSave={saveCats}
          onReset={() => setCats(storedCats)}
          width={{ md: 320 }}
        >
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCatDragEnd}>
            <SortableContext items={cats} strategy={verticalListSortingStrategy}>
              {cats.map((c, i) => (
                <SortableRow key={c} id={c}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <Typography sx={{ width: 20, fontSize: 11.5, color: "var(--text-color-trinary)" }}>{i + 1}</Typography>
                    <Box flex={1} minWidth={0}>
                      <Typography
                        fontSize={13.5}
                        fontWeight={active === c ? 800 : 700}
                        color={active === c ? "var(--primary-color)" : "var(--text-color)"}
                        noWrap
                        onClick={() => setActive(c)}
                        sx={{ cursor: "pointer" }}
                      >
                        {c}
                      </Typography>
                    </Box>
                    <Chip label={catCounts.get(c) || 0} size="small"
                      sx={{ height: 18, fontSize: 10.5, fontWeight: 800, backgroundColor: "var(--surface-muted)" }} />
                  </Stack>
                </SortableRow>
              ))}
            </SortableContext>
          </DndContext>
        </Panel>

        {/* Products inside the selected category */}
        <Panel
          title={active || "Products"}
          subtitle={active ? `${items.length} products — tap a category to switch` : "Pick a category"}
          dirty={itemsDirty}
          saving={savingItems}
          onSave={saveItems}
          onReset={() => setItems(
            products.filter((p) => p.category === active)
              .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.id - b.id)
          )}
        >
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onItemDragEnd}>
            <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {items.map((p, i) => (
                <SortableRow key={p.id} id={p.id}>
                  <Stack direction="row" alignItems="center" gap={1.25}>
                    <Typography sx={{ width: 22, fontSize: 11.5, color: "var(--text-color-trinary)" }}>{i + 1}</Typography>
                    {p.image?.[0] && (
                      <Box component="img" src={p.image[0]} alt="" loading="lazy"
                        sx={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", objectFit: "cover",
                              flexShrink: 0, backgroundColor: "#f4f4f4" }} />
                    )}
                    <Box flex={1} minWidth={0}>
                      <Typography fontSize={13} fontWeight={700} color="var(--text-color)" noWrap>{p.name}</Typography>
                      <Typography fontSize={11} color="var(--text-color-secondary)">
                        {inr(net(p))}{p.active === false ? " · hidden" : ""}
                      </Typography>
                    </Box>
                  </Stack>
                </SortableRow>
              ))}
              {items.length === 0 && (
                <Typography fontSize={13} color="var(--text-color-secondary)" textAlign="center" py={4}>
                  Nothing in this category.
                </Typography>
              )}
            </SortableContext>
          </DndContext>
        </Panel>
      </Stack>
    </Stack>
  );
}

function Panel({ title, subtitle, dirty, saving, onSave, onReset, width, children }) {
  return (
    <Stack
      sx={{ flex: 1, minWidth: 0, minHeight: 0, width,
            border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}
    >
      <Stack direction="row" alignItems="center" gap={1} flexShrink={0}
        sx={{ px: 1.5, py: 1, backgroundColor: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
        <Stack flex={1} minWidth={0}>
          <Typography fontSize={13} fontWeight={800} color="var(--text-color)" noWrap>{title}</Typography>
          <Typography fontSize={11} color="var(--text-color-secondary)" noWrap>{subtitle}</Typography>
        </Stack>
        {dirty && (
          <>
            <Button size="small" onClick={onReset} disabled={saving}
              startIcon={<UndoRoundedIcon sx={{ fontSize: 14 }} />}
              sx={{ textTransform: "none", fontWeight: 700, fontSize: 11.5, color: "var(--text-color-secondary)" }}>
              Reset
            </Button>
            <Button size="small" onClick={onSave} disabled={saving}
              startIcon={saving ? <CircularProgress size={12} sx={{ color: "#fff" }} /> : <SaveRoundedIcon sx={{ fontSize: 14 }} />}
              sx={{ textTransform: "none", fontWeight: 800, fontSize: 11.5, px: 1.5,
                    borderRadius: "var(--radius-pill)", color: "#fff", backgroundColor: "var(--primary-color)",
                    "&:hover": { backgroundColor: "#e34100" } }}>
              Save order
            </Button>
          </>
        )}
      </Stack>
      <Stack sx={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: "auto", overflowX: "hidden",
                   overscrollBehavior: "contain", maxHeight: { xs: 420, md: "none" } }}>
        {children}
      </Stack>
    </Stack>
  );
}
