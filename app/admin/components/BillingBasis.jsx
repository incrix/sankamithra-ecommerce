"use client";
import { Stack, Typography, Box, Button, Chip, InputBase, Tooltip, CircularProgress } from "@mui/material";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PriceChangeRoundedIcon from "@mui/icons-material/PriceChangeRounded";
import { useState } from "react";
import { basisLabel } from "@/util/pricing";

/**
 * The rates an order is being edited against.
 *
 * Two different things are on show here and conflating them is what made the
 * old single chip confusing:
 *
 *   "Billed on"  - what the customer was originally charged. A fact about the
 *                  order, not a setting. For a bill written before the list was
 *                  recorded it is a reading taken off the bill's own lines, and
 *                  is labelled as such.
 *
 *   "Charge new  - what the NEXT line added will cost. Starts at whatever the
 *    items on"     bill was written on, because that is nearly always right,
 *                  but the biller can move it - a customer adding to an old
 *                  order at today's counter rate is an ordinary thing to want.
 *
 * Moving the second away from the first is called out rather than left to be
 * noticed, because the resulting bill would carry two rates at once.
 *
 * Repricing the whole order is deliberately a separate, confirmed action. It
 * restates what the customer owes for things they have already been quoted.
 */
export default function BillingBasis({
  primary,        // { recorded, inferred, list2, extra } - how the bill was written
  list2,          // current selection for new lines
  extra,          // current ExtraDiscount for new lines
  onList,         // (2 | 1) => void
  onExtra,        // (string) => void
  onReprice,      // ({ priceList, extraDiscount }) => void
  loading,
  busy,
}) {
  const [confirming, setConfirming] = useState(false);

  const primaryList = primary.list2 ? 2 : 1;
  const chosenList = list2 ? 2 : 1;
  const extraNum = Math.min(95, Math.max(0, Number(extra) || 0));
  const deviates = chosenList !== primaryList || extraNum !== (primary.extra || 0);

  return (
    <Stack
      gap={1.25}
      sx={{
        p: 1.5, borderRadius: "var(--radius)",
        border: `1px solid ${deviates ? "var(--warning)" : "var(--border)"}`,
        backgroundColor: deviates ? "#fffaf2" : "var(--surface-muted)",
      }}
    >
      {/* ---- what the bill was written on ---- */}
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
        <ReceiptLongRoundedIcon sx={{ fontSize: 16, color: "var(--text-color-trinary)" }} />
        <Typography fontSize={11} fontWeight={800} color="var(--text-color-trinary)"
          sx={{ textTransform: "uppercase", letterSpacing: .4 }}>
          Billed on
        </Typography>
        {loading ? (
          <Stack direction="row" alignItems="center" gap={0.75}>
            <CircularProgress size={11} sx={{ color: "var(--text-color-trinary)" }} />
            <Typography fontSize={12} color="var(--text-color-secondary)">checking…</Typography>
          </Stack>
        ) : (
          <Tooltip title={
            primary.recorded
              ? "Recorded on the order when the bill was written"
              : primary.inferred
                ? "Not recorded — read back from the rates on this bill's own lines. Wrong if a product was repriced since."
                : "This bill predates the price list being recorded, and it could not be read back from its lines."
          }>
            <Typography fontSize={13} fontWeight={800}
              color={primary.recorded ? "var(--text-color)" : "#b26a00"}
              sx={{ borderBottom: "1px dotted currentColor", cursor: "help" }}>
              {basisLabel(primary)}
            </Typography>
          </Tooltip>
        )}
      </Stack>

      {/* ---- what the next line will cost ---- */}
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
        <Typography fontSize={11} fontWeight={800} color="var(--text-color-trinary)"
          sx={{ textTransform: "uppercase", letterSpacing: .4, minWidth: 96 }}>
          Charge new on
        </Typography>

        <Stack direction="row" sx={{ borderRadius: "var(--radius-pill)", overflow: "hidden",
                                     border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
          {[1, 2].map((n) => (
            <Box
              key={n}
              component="button"
              type="button"
              disabled={busy}
              onClick={() => onList(n)}
              aria-pressed={chosenList === n}
              sx={{
                border: 0, cursor: busy ? "default" : "pointer", px: 1.5, py: 0.6,
                fontSize: 12, fontWeight: 800, fontFamily: "inherit",
                backgroundColor: chosenList === n ? "var(--primary-color)" : "transparent",
                color: chosenList === n ? "#fff" : "var(--text-color-secondary)",
                display: "flex", alignItems: "center", gap: 0.5,
              }}
            >
              Pricelist {n}
              {primaryList === n && (
                // Marks the bill's own list, so moving away from it is a visible
                // choice rather than something noticed afterwards.
                <Box component="span" sx={{
                  fontSize: 9, fontWeight: 800, px: 0.5, borderRadius: 4, lineHeight: 1.6,
                  backgroundColor: chosenList === n ? "rgba(255,255,255,.25)" : "var(--surface-muted)",
                  color: chosenList === n ? "#fff" : "var(--text-color-trinary)",
                }}>
                  primary
                </Box>
              )}
            </Box>
          ))}
        </Stack>

        <Stack direction="row" alignItems="center" gap={0.5}
          sx={{ px: 1, py: 0.35, borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
          <InputBase
            value={extra}
            disabled={busy}
            onChange={(e) => onExtra(e.target.value.replace(/[^0-9.]/g, "").slice(0, 5))}
            inputProps={{ inputMode: "decimal", "aria-label": "extra discount percent", style: { textAlign: "right" } }}
            sx={{ width: 34, fontSize: 12, fontWeight: 800 }}
          />
          <Typography fontSize={11.5} fontWeight={700} color="var(--text-color-secondary)">% extra</Typography>
        </Stack>
      </Stack>

      {/* ---- only when the two disagree ---- */}
      {deviates && !loading && (
        <Stack gap={0.75}>
          <Stack direction="row" alignItems="flex-start" gap={0.75}>
            <WarningAmberRoundedIcon sx={{ fontSize: 15, color: "var(--warning)", mt: "1px" }} />
            <Typography fontSize={11.5} fontWeight={600} color="#8a5a00" lineHeight={1.5}>
              New items will be charged on <b>Pricelist {chosenList}
              {extraNum > 0 ? ` · ${extraNum}% extra` : ""}</b>, which is not how the rest of
              this bill was written. The order will carry two different rates.
            </Typography>
          </Stack>

          {confirming ? (
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ pl: 2.5 }}>
              <Typography fontSize={11.5} fontWeight={700} color="var(--text-color)">
                Reprice every line on Pricelist {chosenList}?
              </Typography>
              <Button size="small" onClick={() => setConfirming(false)}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: 11.5, color: "var(--text-color-secondary)" }}>
                Keep as is
              </Button>
              <Button size="small" disabled={busy}
                onClick={() => { onReprice({ priceList: chosenList, extraDiscount: extraNum }); setConfirming(false); }}
                sx={{ textTransform: "none", fontWeight: 800, fontSize: 11.5, px: 1.5,
                      color: "#fff", backgroundColor: "var(--danger)",
                      "&:hover": { backgroundColor: "#c92a2a" } }}>
                Reprice the whole bill
              </Button>
            </Stack>
          ) : (
            <Button
              size="small"
              disabled={busy}
              onClick={() => setConfirming(true)}
              startIcon={<PriceChangeRoundedIcon sx={{ fontSize: 15 }} />}
              sx={{ alignSelf: "flex-start", ml: 2.5, textTransform: "none", fontWeight: 800,
                    fontSize: 11.5, color: "var(--primary-color)" }}
            >
              Put the whole bill on Pricelist {chosenList}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}
