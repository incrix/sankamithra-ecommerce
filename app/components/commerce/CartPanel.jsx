"use client";
import { Stack, Typography, Button, Box, Divider, Chip } from "@mui/material";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import Link from "next/link";
import MinimumMeter from "./MinimumMeter";
import GapFillers from "./GapFillers";
import CartLine from "./CartLine";

/**
 * The always-visible cart. On desktop it's a sticky rail beside the grid; on
 * mobile the same component fills a bottom sheet. Either way the customer edits
 * quantities and keeps adding products WITHOUT leaving the catalogue - the
 * round trip to /cart and back was where the old flow lost people.
 */
export default function CartPanel({
  cart, total, mrp, saved, itemCount, shortBy, meetsMinimum,
  products, onQty, onAdjust, onRemove, onAdd, onKeepShopping, embedded = false,
}) {
  const empty = cart.length === 0;

  return (
    <Stack
      gap={1.5}
      sx={{
        backgroundColor: "#fff",
        borderRadius: embedded ? 0 : "16px",
        border: embedded ? "none" : "1px solid #ededed",
        boxShadow: embedded ? "none" : "0 4px 24px rgba(0,0,0,.06)",
        p: 2,
        pb: 2,
        height: "100%",
        minHeight: 0,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        <ShoppingCartRoundedIcon sx={{ color: "var(--primary-color)", fontSize: 20 }} />
        <Typography fontSize={16} fontWeight={800} color="var(--text-color)">
          Your Cart
        </Typography>
        {itemCount > 0 && (
          <Chip
            label={itemCount}
            size="small"
            sx={{
              height: 20,
              fontWeight: 800,
              fontSize: 11,
              color: "#fff",
              backgroundColor: "var(--primary-color)",
            }}
          />
        )}
      </Stack>

      {empty ? (
        <Stack alignItems="center" justifyContent="center" gap={1} sx={{ py: 5, px: 2 }}>
          <Box sx={{ fontSize: 34, lineHeight: 1 }}>🎆</Box>
          <Typography fontSize={13.5} fontWeight={800} color="var(--text-color)">
            Your cart is empty
          </Typography>
          <Typography fontSize={12} color="var(--text-color-secondary)" textAlign="center">
            Add crackers from the list and they&apos;ll show up here.
          </Typography>
        </Stack>
      ) : (
        <>
          {/* Scrolls independently so the totals below never leave the screen */}
          <Stack
            gap={1}
            sx={{
              flex: 1,
              overflowY: "auto",
              minHeight: 0,
              maxHeight: embedded ? "none" : 340,
              pr: 0.5,
              "&::-webkit-scrollbar": { width: 5 },
              "&::-webkit-scrollbar-thumb": { background: "#e6e6e6", borderRadius: 99 },
            }}
          >
            {cart.map((item, i) => (
              <CartLine
                key={item.id}
                item={item}
                onQty={(q) => onQty(item.id, q)}
                onAdjust={(d) => onAdjust(item.id, d)}
                onRemove={() => onRemove(item, i)}
              />
            ))}
          </Stack>

          <Divider />

          <MinimumMeter total={total} shortBy={shortBy} meetsMinimum={meetsMinimum} />

          {!meetsMinimum && (
            <GapFillers products={products} cart={cart} shortBy={shortBy} onAdd={onAdd} />
          )}

          <Stack gap={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography fontSize={12.5} color="var(--text-color-secondary)" fontWeight={600}>
                Price ({itemCount} {itemCount === 1 ? "item" : "items"})
              </Typography>
              <Typography
                fontSize={12.5}
                color="var(--text-color-secondary)"
                fontWeight={600}
                sx={{ textDecoration: "line-through" }}
              >
                ₹{mrp.toLocaleString("en-IN")}
              </Typography>
            </Stack>

            {/* The whole site sells on 58-80% off, yet the old cart never showed it */}
            <Stack direction="row" justifyContent="space-between">
              <Typography fontSize={12.5} color="#1d9b53" fontWeight={700}>
                Discount
              </Typography>
              <Typography fontSize={12.5} color="#1d9b53" fontWeight={800}>
                − ₹{saved.toLocaleString("en-IN")}
              </Typography>
            </Stack>

            <Divider sx={{ my: 0.5 }} />

            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography fontSize={15} fontWeight={800} color="var(--text-color)">
                Total
              </Typography>
              <Typography fontSize={19} fontWeight={800} color="var(--text-color)">
                ₹{total.toLocaleString("en-IN")}
              </Typography>
            </Stack>
          </Stack>

          <Button
            component={meetsMinimum ? Link : "button"}
            href={meetsMinimum ? "/checkout" : undefined}
            disabled={!meetsMinimum}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              fontSize: 14.5,
              py: 1.15,
              borderRadius: "10px",
              color: "#fff",
              backgroundColor: "var(--primary-color)",
              "&:hover": { backgroundColor: "#e34100" },
              "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" },
            }}
          >
            {meetsMinimum ? "Proceed to Checkout" : `₹${shortBy.toLocaleString("en-IN")} to go`}
          </Button>

          <Button
            onClick={onKeepShopping}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--primary-color)",
              "&:hover": { backgroundColor: "#fff1ea" },
            }}
          >
            Keep shopping
          </Button>

          <Typography fontSize={11} color="var(--text-color-secondary)" textAlign="center">
            You saved ₹{saved.toLocaleString("en-IN")} on this order 🎉
          </Typography>
        </>
      )}
    </Stack>
  );
}
