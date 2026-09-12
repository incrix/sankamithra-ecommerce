"use client";
import { useMemo, useState } from "react";
import {
  Dialog, Stack, Box, Typography, InputBase, IconButton, Button, Chip, CircularProgress,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { assetUrl } from "@/util/config";
import { unitOf, basisLabel } from "@/util/pricing";
import QtyStepper from "@/app/components/commerce/QtyStepper";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/**
 * Adds a product to an order that already exists.
 *
 * Deliberately shows what is already on the bill rather than hiding it: the
 * common case is a customer ringing back to add two more of something they
 * already bought, and quietly filtering it out would look like the shop had
 * stopped selling it. Picking one that is on the bill tops up its quantity.
 *
 * Prices come from the list the bill was written on, not the website list.
 * Adding to a Pricelist 2 bill at the Pricelist 1 rate silently overcharges
 * the customer against every other line on the same bill.
 *
 * `products` must come from the ADMIN catalogue (/api/products?all=1), not the
 * ProductContext the storefront uses: that response strips mrp2, so every
 * Pricelist 2 lookup silently fell back to the Pricelist 1 MRP.
 */
export default function AddItemPicker({ open, order, onClose, onAdd, busy, products = [], loading = false, basis = { recorded: false, list2: false, extra: 0 } }) {
  const { list2, extra } = basis;
  const priceOf = (p) => unitOf(p, list2, extra);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);
  const [qty, setQty] = useState(1);

  const onBill = useMemo(
    () => new Map((order?.items || []).map((i) => [i.id, i.count])),
    [order]
  );

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .slice(0, 60);
  }, [products, query]);

  const close = () => { setPicked(null); setQty(1); setQuery(""); onClose(); };

  return (
    <Dialog open={open} onClose={busy ? undefined : close} fullWidth maxWidth="sm"
      PaperProps={{ sx: { borderRadius: "var(--radius)" } }}>
      <Stack sx={{ p: 2, gap: 1.5 }}>
        <Stack direction="row" alignItems="flex-start" gap={1}>
          <Stack flex={1} minWidth={0}>
            <Typography fontSize={15} fontWeight={800} color="var(--text-color)">Add to this order</Typography>
            <Typography fontSize={12.5} color="var(--text-color-secondary)" noWrap>
              {order?.ref} · {order?.customer?.name}
            </Typography>
            {/* Which rates these prices are on. The biller is about to charge
                against it, so it is stated rather than left to be inferred. */}
            <Typography fontSize={11} fontWeight={700}
              color={basis.recorded ? "var(--text-color-trinary)" : "var(--warning)"}>
              {basisLabel(basis)}
            </Typography>
          </Stack>
          <IconButton size="small" onClick={close} disabled={busy}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>

        <Stack direction="row" alignItems="center" gap={1}
          sx={{ px: 1.5, py: 0.75, borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
          <SearchRoundedIcon sx={{ fontSize: 18, color: "var(--text-color-trinary)" }} />
          <InputBase autoFocus placeholder="Search the catalogue…" value={query}
            onChange={(e) => setQuery(e.target.value)} sx={{ flex: 1, fontSize: 14 }} />
        </Stack>

        <Stack sx={{ maxHeight: 320, overflowY: "auto", overscrollBehavior: "contain",
                     border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
          {loading && options.length === 0 && (
            <Stack alignItems="center" py={4}><CircularProgress size={20} sx={{ color: "var(--primary-color)" }} /></Stack>
          )}
          {!loading && options.length === 0 && (
            <Typography fontSize={13} color="var(--text-color-secondary)" textAlign="center" py={4}>
              Nothing matches that.
            </Typography>
          )}
          {options.map((p) => {
            const already = onBill.get(p.id);
            const on = picked?.id === p.id;
            return (
              <Stack key={p.id} direction="row" alignItems="center" gap={1.25}
                onClick={() => setPicked(p)}
                sx={{ px: 1.25, py: 1, cursor: "pointer", borderBottom: "1px solid var(--border)",
                      backgroundColor: on ? "var(--primary-soft)" : "transparent",
                      "&:hover": { backgroundColor: on ? "var(--primary-soft)" : "var(--surface-muted)" } }}>
                <Box component="img" src={assetUrl(p.image?.[0])} alt="" loading="lazy"
                  sx={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", objectFit: "cover",
                        flexShrink: 0, backgroundColor: "#f4f4f4" }} />
                <Stack flex={1} minWidth={0}>
                  <Typography fontSize={13} fontWeight={700} color="var(--text-color)" noWrap>{p.name}</Typography>
                  <Typography fontSize={11} color="var(--text-color-secondary)">{p.category}</Typography>
                </Stack>
                {already != null && (
                  <Chip label={`${already} on bill`} size="small"
                    sx={{ height: 18, fontSize: 9.5, fontWeight: 800,
                          backgroundColor: "var(--surface-muted)", color: "var(--text-color-secondary)" }} />
                )}
                <Typography fontSize={13} fontWeight={800} color="var(--text-color)" sx={{ minWidth: 54, textAlign: "right" }}>
                  {inr(priceOf(p))}
                </Typography>
              </Stack>
            );
          })}
        </Stack>

        {picked && (
          <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap"
            sx={{ p: 1.25, borderRadius: "var(--radius)", backgroundColor: "var(--surface-muted)" }}>
            <Stack flex={1} minWidth={0}>
              <Typography fontSize={13} fontWeight={800} color="var(--text-color)" noWrap>{picked.name}</Typography>
              <Typography fontSize={11.5} color="var(--text-color-secondary)">
                {inr(priceOf(picked))} each
                {onBill.has(picked.id) ? ` · already ${onBill.get(picked.id)} on the bill` : ""}
              </Typography>
            </Stack>
            <QtyStepper size="sm" value={qty} onChange={setQty} onAdjust={(d) => setQty((q) => Math.max(1, q + d))} />
            <Typography fontSize={14} fontWeight={800} color="var(--primary-color)" sx={{ minWidth: 70, textAlign: "right" }}>
              + {inr(priceOf(picked) * qty)}
            </Typography>
          </Stack>
        )}

        <Stack direction="row" justifyContent="flex-end" gap={1}>
          <Button onClick={close} disabled={busy}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, color: "var(--text-color-secondary)" }}>
            Cancel
          </Button>
          <Button
            onClick={() => onAdd(picked, qty)}
            disabled={!picked || busy}
            startIcon={busy ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : null}
            sx={{ textTransform: "none", fontWeight: 800, fontSize: 13, px: 2.5,
                  borderRadius: "var(--radius-pill)", color: "#fff", backgroundColor: "var(--primary-color)",
                  "&:hover": { backgroundColor: "#e34100" },
                  "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" } }}>
            {busy ? "Adding…" : picked && onBill.has(picked.id) ? "Add to line" : "Add to order"}
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}
