"use client";
import { Stack, Typography, Box, Button, Divider, Snackbar, Alert, CircularProgress } from "@mui/material";
import Link from "next/link";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import { useState } from "react";
import { useProducts } from "@/context/ProductContext";
import { useCart } from "@/util/cart";
import CartLine from "@/app/components/commerce/CartLine";
import MinimumMeter from "@/app/components/commerce/MinimumMeter";
import GapFillers from "@/app/components/commerce/GapFillers";
import EmailSubscribe from "../components/emailSubscribe";

/**
 * Full-page cart.
 *
 * Rebuilt on the shared cart engine: the old page kept its own copy of the
 * quantity/remove logic and its own total formula, which disagreed with
 * /checkout by a few rupees - enough to say "you qualify" at the ₹3000
 * boundary when checkout disagreed. It also rendered a 700px-min table that
 * scrolled sideways on every phone.
 */
export default function CartPage() {
  const c = useCart();
  const { productList } = useProducts();
  const [undo, setUndo] = useState(null);

  const handleRemove = (item, index) => {
    c.remove(item.id);
    setUndo({ item, index });
  };

  if (!c.ready) {
    return <Stack alignItems="center" py={10}><CircularProgress sx={{ color: "var(--primary-color)" }} /></Stack>;
  }

  const empty = c.cart.length === 0;

  return (
    <main style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Stack
        width="100%"
        maxWidth="var(--max-width)"
        px={{ xs: 2, sm: 3, md: 4 }}
        py={{ xs: 3, md: 5 }}
        gap={{ xs: 2.5, md: 4 }}
      >
        <Stack gap={0.5}>
          <Typography variant="h1" fontSize={{ xs: 26, md: 36 }} fontWeight={800} color="var(--text-color)">
            Your Cart
          </Typography>
          {!empty && (
            <Typography fontSize={13.5} color="var(--text-color-secondary)">
              {c.cart.length} {c.cart.length === 1 ? "product" : "products"} · {c.itemCount} units
            </Typography>
          )}
        </Stack>

        {empty ? (
          <Stack alignItems="center" gap={2} py={{ xs: 5, md: 8 }}>
            <Box sx={{ fontSize: 52, lineHeight: 1 }}>🎆</Box>
            <Stack alignItems="center" gap={0.5}>
              <Typography fontSize={19} fontWeight={800} color="var(--text-color)">Your cart is empty</Typography>
              <Typography fontSize={14} color="var(--text-color-secondary)" textAlign="center">
                Add some crackers and they&apos;ll show up here.
              </Typography>
            </Stack>
            <Button
              component={Link}
              href="/shop"
              startIcon={<ShoppingBagRoundedIcon />}
              sx={cta}
            >
              Start shopping
            </Button>
          </Stack>
        ) : (
          <Stack direction={{ xs: "column", md: "row" }} gap={{ xs: 2.5, md: 4 }} alignItems="flex-start">
            {/* Lines */}
            <Stack flex={1} gap={1.25} width="100%" minWidth={0}>
              {c.cart.map((item, i) => (
                <CartLine
                  key={item.id}
                  item={item}
                  onQty={(q) => c.setQty(item.id, q)}
                  onAdjust={(d) => c.adjust(item.id, d)}
                  onRemove={() => handleRemove(item, i)}
                />
              ))}

              <Button
                component={Link}
                href="/shop"
                sx={{
                  alignSelf: "flex-start", mt: 1,
                  textTransform: "none", fontWeight: 700, fontSize: 13.5,
                  color: "var(--primary-color)",
                  "&:hover": { backgroundColor: "var(--primary-soft)" },
                }}
              >
                ← Continue shopping
              </Button>
            </Stack>

            {/* Summary */}
            <Stack
              gap={1.5}
              sx={{
                width: { xs: "100%", md: 340 }, flexShrink: 0,
                position: { md: "sticky" }, top: { md: 24 },
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow)",
                p: { xs: 2, md: 2.5 },
              }}
            >
              <Typography fontSize={16} fontWeight={800} color="var(--text-color)">
                Order summary
              </Typography>

              <MinimumMeter total={c.total} shortBy={c.shortBy} meetsMinimum={c.meetsMinimum} />

              {!c.meetsMinimum && (
                <GapFillers
                  products={productList}
                  cart={c.cart}
                  shortBy={c.shortBy}
                  onAdd={(p) => c.add(p, 1)}
                />
              )}

              <Stack gap={0.75}>
                <Row label={`Price (${c.itemCount} units)`} value={`₹${c.mrp.toLocaleString("en-IN")}`} strike />
                <Row label="Discount" value={`− ₹${c.saved.toLocaleString("en-IN")}`} green />
                <Divider sx={{ my: 0.5 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                  <Typography fontSize={15.5} fontWeight={800} color="var(--text-color)">Total</Typography>
                  <Typography fontSize={20} fontWeight={800} color="var(--text-color)">
                    ₹{c.total.toLocaleString("en-IN")}
                  </Typography>
                </Stack>
              </Stack>

              <Button
                component={c.meetsMinimum ? Link : "button"}
                href={c.meetsMinimum ? "/checkout" : undefined}
                disabled={!c.meetsMinimum}
                endIcon={<ArrowForwardRoundedIcon />}
                sx={cta}
              >
                {c.meetsMinimum ? "Proceed to Checkout" : `₹${c.shortBy.toLocaleString("en-IN")} to go`}
              </Button>

              <Typography fontSize={11.5} textAlign="center" color="var(--success)" fontWeight={700}>
                You saved ₹{c.saved.toLocaleString("en-IN")} on this order 🎉
              </Typography>
            </Stack>
          </Stack>
        )}

        <EmailSubscribe />
      </Stack>

      <Snackbar
        open={Boolean(undo)}
        autoHideDuration={5000}
        onClose={() => setUndo(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={undo ? `${undo.item.name} removed` : ""}
        action={
          <Button
            size="small"
            onClick={() => { c.restore(undo.item, undo.index); setUndo(null); }}
            sx={{ color: "#ffb08c", fontWeight: 800, textTransform: "none" }}
          >
            UNDO
          </Button>
        }
      />
    </main>
  );
}

const cta = {
  textTransform: "none", fontWeight: 800, fontSize: 14.5,
  py: 1.2, px: 3, borderRadius: "var(--radius)",
  color: "#fff", backgroundColor: "var(--primary-color)",
  "&:hover": { backgroundColor: "var(--primary-dark)" },
  "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" },
};

function Row({ label, value, strike, green }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography fontSize={13} fontWeight={green ? 700 : 600} color={green ? "var(--success)" : "var(--text-color-secondary)"}>
        {label}
      </Typography>
      <Typography
        fontSize={13}
        fontWeight={green ? 800 : 600}
        color={green ? "var(--success)" : "var(--text-color-secondary)"}
        sx={strike ? { textDecoration: "line-through" } : undefined}
      >
        {value}
      </Typography>
    </Stack>
  );
}
