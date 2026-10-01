"use client";
import {
  Dialog, DialogTitle, DialogContent, Stack, Box, Typography, InputBase,
  IconButton, Chip, Button, Divider,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useCallback, useMemo, useState } from "react";
import { assetUrl } from "@/util/config";
import { basisMrp, unitOf, inr, paise } from "@/util/pricing";
import QtyStepper from "@/app/components/commerce/QtyStepper";


/**
 * Pick a replacement for a line the packer can't fill.
 *
 * Defaults to the same category and sorts by how close the line value lands to
 * the original, because the practical question at the packing table is "what
 * can I put in the box that keeps this order roughly whole?" - not "what else
 * do we sell". The value difference is shown before anything is committed.
 */
export default function SubstitutePicker({ open, item, onClose, onChoose, products = [], basis = { recorded: false, list2: false, extra: 0 } }) {
  // A replacement is charged on the same list as the line it replaces - see
  // util/pricing.js. Pricing it off the website list understated or overstated
  // the swap on every counter bill written on Pricelist 2.
  //
  // `products` is the admin catalogue, which carries mrp2. The storefront
  // ProductContext strips it, which made every Pricelist 2 swap fall back to
  // the Pricelist 1 MRP without anything looking wrong.
  const { list2, extra } = basis;
  const priceOf = useCallback((p) => unitOf(p, list2, extra), [list2, extra]);
  const [query, setQuery] = useState("");
  const [sameCategory, setSameCategory] = useState(true);
  const [picked, setPicked] = useState(null);
  const [qty, setQty] = useState(item?.count || 1);

  const targetValue = paise((item?.unitPrice || 0) * (item?.count || 0));

  const options = useMemo(() => {
    if (!item) return [];
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.id !== item.id && p.countInStock > 0)
      .filter((p) => (sameCategory && !q ? p.category === item.category : true))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .map((p) => ({ p, price: priceOf(p) }))
      .sort((a, b) => {
        // closest achievable line value to what's being replaced
        const da = Math.abs(a.price * (item.count || 1) - targetValue);
        const db = Math.abs(b.price * (item.count || 1) - targetValue);
        return da - db;
      })
      .slice(0, 40);
  }, [products, item, query, sameCategory, targetValue, priceOf]);

  if (!item) return null;

  const newValue = picked ? paise(priceOf(picked) * qty) : 0;
  const diff = newValue - targetValue;

  const choose = () => {
    if (!picked) return;
    onChoose({
      id: picked.id,
      name: picked.name,
      image: picked.image?.[0] || null,
      unitPrice: priceOf(picked),
      mrp: basisMrp(picked, list2),
      count: qty,
    });
    reset();
  };

  const reset = () => { setPicked(null); setQuery(""); setSameCategory(true); onClose(); };

  return (
    <Dialog open={open} onClose={reset} fullWidth maxWidth="sm"
      PaperProps={{ sx: { borderRadius: "var(--radius-lg)" } }}>
      <DialogTitle sx={{ p: 2, pb: 1 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Stack minWidth={0}>
            <Typography fontSize={16} fontWeight={800} color="var(--text-color)">
              Replace &ldquo;{item.name}&rdquo;
            </Typography>
            <Typography fontSize={12.5} color="var(--text-color-secondary)">
              {item.count} × {inr(item.unitPrice)} = {inr(targetValue)} to make up
            </Typography>
          </Stack>
          <IconButton onClick={reset} aria-label="close"><CloseRoundedIcon /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2, pt: 0 }}>
        <Stack gap={1.5}>
          <Stack direction="row" alignItems="center" gap={1}
            sx={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius)", px: 1.5, py: 0.75,
                  "&:focus-within": { borderColor: "var(--primary-color)" } }}>
            <SearchRoundedIcon sx={{ fontSize: 19, color: "var(--text-color-trinary)" }} />
            <InputBase
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all products..."
              sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}
            />
          </Stack>

          <Stack direction="row" gap={0.75}>
            <Chip
              label={`Same category (${item.category})`}
              onClick={() => setSameCategory((v) => !v)}
              sx={{
                fontWeight: 700, fontSize: 11.5, border: "1px solid",
                borderColor: sameCategory ? "var(--primary-color)" : "var(--border)",
                backgroundColor: sameCategory ? "var(--primary-color)" : "#fff",
                color: sameCategory ? "#fff" : "var(--text-color)",
              }}
            />
          </Stack>

          <Stack gap={0.75} sx={{ maxHeight: 300, overflowY: "auto", pr: 0.5 }}>
            {options.length === 0 && (
              <Typography fontSize={13} color="var(--text-color-secondary)" textAlign="center" py={3}>
                Nothing in stock matches.
              </Typography>
            )}
            {options.map(({ p, price }) => {
              const on = picked?.id === p.id;
              return (
                <Stack
                  key={p.id}
                  direction="row" alignItems="center" gap={1.25}
                  onClick={() => { setPicked(p); setQty(item.count || 1); }}
                  sx={{
                    p: 1, borderRadius: "var(--radius)", cursor: "pointer",
                    border: "1.5px solid",
                    borderColor: on ? "var(--primary-color)" : "var(--border)",
                    backgroundColor: on ? "var(--primary-softer)" : "#fff",
                  }}
                >
                  <Box component="img" src={assetUrl(p.image?.[0])} alt=""
                    sx={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", objectFit: "cover", flexShrink: 0, backgroundColor: "#f6f6f6" }} />
                  <Stack flex={1} minWidth={0}>
                    <Typography fontSize={13} fontWeight={800} color="var(--text-color)" noWrap>{p.name}</Typography>
                    <Typography fontSize={11} color="var(--text-color-secondary)" fontWeight={600}>
                      {p.category} · {p.countInStock} in stock
                    </Typography>
                  </Stack>
                  <Typography fontSize={13.5} fontWeight={800} color="var(--text-color)">{inr(price)}</Typography>
                </Stack>
              );
            })}
          </Stack>

          {picked && (
            <>
              <Divider />
              <Stack gap={1.25}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Typography fontSize={13} fontWeight={700} color="var(--text-color)">
                    How many {picked.name}?
                  </Typography>
                  <QtyStepper value={qty} onChange={(q) => setQty(Math.max(1, q))} onAdjust={(d) => setQty((v) => Math.max(1, v + d))} />
                </Stack>

                <Stack direction="row" justifyContent="space-between"
                  sx={{ p: 1.25, borderRadius: "var(--radius)",
                        backgroundColor: Math.abs(diff) <= 25 ? "var(--success-soft)" : "var(--warning-soft)" }}>
                  <Typography fontSize={12.5} fontWeight={700}
                    color={Math.abs(diff) <= 25 ? "var(--success-ink)" : "var(--warning)"}>
                    {diff === 0 ? "Same value" : diff > 0 ? `Order goes up ${inr(diff)}` : `Order comes down ${inr(-diff)}`}
                  </Typography>
                  <Typography fontSize={12.5} fontWeight={800}
                    color={Math.abs(diff) <= 25 ? "var(--success-ink)" : "var(--warning)"}>
                    {inr(targetValue)} → {inr(newValue)}
                  </Typography>
                </Stack>

                <Button onClick={choose}
                  sx={{ textTransform: "none", fontWeight: 800, fontSize: 14, py: 1.1, borderRadius: "var(--radius)",
                        color: "#fff", backgroundColor: "var(--primary-color)",
                        "&:hover": { backgroundColor: "var(--primary-dark)" } }}>
                  Use this replacement
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
