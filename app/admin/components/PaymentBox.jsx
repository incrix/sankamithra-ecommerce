"use client";
import { useState } from "react";
import { Stack, Typography, InputBase, Button, Chip, IconButton, Tooltip, Checkbox, FormControlLabel } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { inr } from "@/util/pricing";
import { PAYMENT_METHODS, methodLabel, paymentState, paymentsOf } from "@/util/orderPayments";

/**
 * What has been collected on this order, and the form that records more.
 *
 * Sits above the packing list on purpose: the shop needs to know what is still
 * owed while the parcel is being filled, not after it has gone out of the
 * door. Each receipt is entered on its own - an advance on GPay, the balance
 * deposited into the account later - so the order carries the full story of
 * how it was paid rather than one figure that lost the detail.
 */
export default function PaymentBox({ order, busy, onAdd, onRemove }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("gpay");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  // null = follow the default (email once the bill is settled); a boolean is
  // the biller's own choice and sticks while the form is open.
  const [mailChoice, setMailChoice] = useState(null);

  const s = paymentState(order);
  const payments = paymentsOf(order);
  const tone = TONE[s.state] || TONE.unpaid;

  const start = () => {
    // Prefilled with what is left, because collecting the balance in full is
    // what usually happens - the biller only edits it for a part payment.
    setAmount(s.balance > 0 ? String(s.balance) : "");
    setMethod(payments[payments.length - 1]?.method || "gpay");
    setNote("");
    setError("");
    setMailChoice(null);
    setOpen(true);
  };

  const hasEmail = Boolean(order.customer?.email);
  // Settling the bill is what confirms an order, so that is when the customer
  // hears about it by default. An advance alone does not tell them anything.
  const settles = Number(amount) > 0 && Number(amount) >= s.balance;
  const emailIt = hasEmail && (mailChoice ?? settles);

  const submit = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setError("Enter the amount received");
    onAdd({ amount: value, method, note }, emailIt);
    setOpen(false);
  };

  return (
    <Stack gap={1.25}
      sx={{ p: 1.5, borderRadius: "var(--radius)", border: "1px solid", borderColor: tone.border,
            backgroundColor: tone.bg }}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Payment</Typography>
        <Chip label={s.label} size="small"
          sx={{ height: 20, fontSize: 10.5, fontWeight: 800, backgroundColor: tone.chipBg, color: tone.ink }} />
        <Stack flex={1} />
        {!open && order.status !== "cancelled" && (
          <Button size="small" onClick={start} disabled={busy}
            startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: "none", fontWeight: 800, fontSize: 12, py: 0.25, px: 1.25, minWidth: 0,
                  borderRadius: "var(--radius-pill)", color: "var(--primary-color)",
                  border: "1px solid var(--primary-color)",
                  "&:hover": { backgroundColor: "var(--primary-soft)" } }}>
            Record payment
          </Button>
        )}
      </Stack>

      {/* The two figures the shop actually argues about, side by side. */}
      <Stack direction="row" gap={2} alignItems="flex-end" flexWrap="wrap">
        <Stack>
          <Typography fontSize={10.5} fontWeight={800} color="var(--text-color-trinary)"
            sx={{ textTransform: "uppercase", letterSpacing: 0.3 }}>Received</Typography>
          <Typography fontSize={16} fontWeight={800} color="var(--text-color)">{inr(s.paid)}</Typography>
        </Stack>
        <Stack>
          <Typography fontSize={10.5} fontWeight={800} color="var(--text-color-trinary)"
            sx={{ textTransform: "uppercase", letterSpacing: 0.3 }}>
            {s.balance < 0 ? "Overpaid" : "Still to collect"}
          </Typography>
          <Typography fontSize={16} fontWeight={800} color={tone.ink}>
            {inr(Math.abs(s.balance))}
          </Typography>
        </Stack>
        <Stack>
          <Typography fontSize={10.5} fontWeight={800} color="var(--text-color-trinary)"
            sx={{ textTransform: "uppercase", letterSpacing: 0.3 }}>Bill</Typography>
          <Typography fontSize={13.5} fontWeight={700} color="var(--text-color-secondary)">{inr(s.total)}</Typography>
        </Stack>
      </Stack>

      {open && (
        <Stack gap={1} sx={{ p: 1.25, borderRadius: "var(--radius-sm)", backgroundColor: "#fff", border: "1px solid var(--border)" }}>
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {PAYMENT_METHODS.map((m) => (
              <Chip
                key={m.key}
                label={m.label}
                size="small"
                onClick={() => setMethod(m.key)}
                sx={{ fontWeight: 800, fontSize: 11.5, height: 26, border: "1px solid",
                      cursor: "pointer",
                      borderColor: method === m.key ? "var(--primary-color)" : "var(--border)",
                      backgroundColor: method === m.key ? "var(--primary-soft)" : "#fff",
                      color: method === m.key ? "var(--primary-color)" : "var(--text-color-secondary)" }}
              />
            ))}
          </Stack>

          <Stack direction="row" gap={1} alignItems="flex-start">
            <Stack gap={0.25} sx={{ width: 130 }}>
              <Typography fontSize={10.5} fontWeight={800} color="var(--text-color-trinary)"
                sx={{ textTransform: "uppercase", letterSpacing: 0.3 }}>Amount ₹</Typography>
              <InputBase
                autoFocus
                value={amount}
                onChange={(e) => { setAmount(e.target.value.replace(/[^\d.]/g, "")); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
                inputProps={{ inputMode: "decimal", "aria-label": "amount received" }}
                sx={{ fontSize: 15, fontWeight: 800, px: 1, py: 0.5, borderRadius: "var(--radius-sm)",
                      border: "1px solid", borderColor: error ? "var(--danger)" : "var(--border)",
                      "&.Mui-focused": { borderColor: error ? "var(--danger)" : "var(--primary-color)" } }}
              />
            </Stack>
            <Stack gap={0.25} flex={1} minWidth={0}>
              <Typography fontSize={10.5} fontWeight={800} color="var(--text-color-trinary)"
                sx={{ textTransform: "uppercase", letterSpacing: 0.3 }}>Reference (optional)</Typography>
              <InputBase
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
                placeholder={method === "bank" ? "Depositor, slip no." : "UPI ref, who paid"}
                inputProps={{ maxLength: 80, "aria-label": "payment reference" }}
                sx={{ fontSize: 13, fontWeight: 600, px: 1, py: 0.5, borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      "&.Mui-focused": { borderColor: "var(--primary-color)" } }}
              />
            </Stack>
          </Stack>

          {error && <Typography fontSize={11} fontWeight={700} color="var(--danger-ink)">{error}</Typography>}
          {Number(amount) > s.balance && s.balance >= 0 && (
            <Typography fontSize={11} fontWeight={700} color="var(--warning)">
              That is {inr(Number(amount) - s.balance)} more than the bill is owed.
            </Typography>
          )}

          <FormControlLabel
            disabled={!hasEmail}
            control={
              <Checkbox size="small" checked={emailIt} onChange={(e) => setMailChoice(e.target.checked)}
                sx={{ py: 0.25, "&.Mui-checked": { color: "var(--primary-color)" } }} />
            }
            label={
              <Typography fontSize={12} fontWeight={700} color="var(--text-color-secondary)">
                {hasEmail
                  ? `Email ${order.customer.name?.split(" ")[0] || "the customer"} a payment confirmation with the item list`
                  : "No customer email on this order — confirm by phone or WhatsApp"}
              </Typography>
            }
            sx={{ ml: -0.5, mr: 0 }}
          />

          <Stack direction="row" gap={1}>
            <Button onClick={submit} disabled={busy}
              sx={{ textTransform: "none", fontWeight: 800, fontSize: 12.5, px: 2,
                    borderRadius: "var(--radius-pill)", color: "#fff",
                    backgroundColor: "var(--primary-color)", "&:hover": { backgroundColor: "#e34100" } }}>
              Save payment
            </Button>
            <Button onClick={() => setOpen(false)} disabled={busy}
              sx={{ textTransform: "none", fontWeight: 700, fontSize: 12.5, px: 1.5,
                    borderRadius: "var(--radius-pill)", color: "var(--text-color-secondary)" }}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      )}

      {payments.length > 0 && (
        <Stack gap={0.5}>
          {payments.map((p) => (
            <Stack key={p.id} direction="row" alignItems="center" gap={1}
              sx={{ px: 1, py: 0.6, borderRadius: "var(--radius-sm)", backgroundColor: "#fff",
                    border: "1px solid var(--border)" }}>
              <Typography fontSize={13} fontWeight={800} color="var(--text-color)" sx={{ minWidth: 72 }}>
                {inr(p.amount)}
              </Typography>
              <Stack flex={1} minWidth={0}>
                <Typography fontSize={11.5} fontWeight={700} color="var(--text-color-secondary)" noWrap>
                  {methodLabel(p.method)}{p.note ? ` · ${p.note}` : ""}
                </Typography>
                <Typography fontSize={10.5} color="var(--text-color-trinary)" fontWeight={600}>
                  {new Date(p.at).toLocaleString("en-IN")}
                </Typography>
              </Stack>
              <Tooltip title="Remove this receipt">
                <IconButton size="small" disabled={busy} onClick={() => onRemove(p.id)}
                  aria-label={`remove payment of ${p.amount}`}
                  sx={{ p: 0.5, color: "var(--text-color-trinary)", "&:hover": { color: "var(--danger)" } }}>
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      )}

      {payments.length === 0 && !open && (
        <Typography fontSize={11.5} fontWeight={600} color="var(--text-color-secondary)">
          Nothing recorded against this bill yet.
        </Typography>
      )}
    </Stack>
  );
}

/** One palette per state, so the box says how the bill stands before it is read. */
const TONE = {
  unpaid: { bg: "#fff8f6", border: "#ffd9c9", chipBg: "var(--primary-soft)", ink: "var(--primary-color)" },
  part:   { bg: "#fffaf0", border: "#ffe2b0", chipBg: "var(--warning-soft)", ink: "var(--warning)" },
  paid:   { bg: "#f3fbf6", border: "#b6e7c9", chipBg: "var(--success-soft)", ink: "var(--success-ink)" },
  over:   { bg: "#fffaf0", border: "#ffe2b0", chipBg: "var(--warning-soft)", ink: "var(--warning)" },
  cancelled: { bg: "var(--surface-muted)", border: "var(--border)", chipBg: "var(--surface-muted)", ink: "var(--text-color-secondary)" },
};
