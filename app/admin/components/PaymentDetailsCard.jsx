"use client";
import { useEffect, useState } from "react";
import { Stack, Box, Typography, Button, TextField, Switch, CircularProgress, IconButton, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { panel } from "./RevenueChart";
import { DEFAULT_PAYMENT_DETAILS, EMPTY_UPI_ACCOUNT, MAX_UPI_ACCOUNTS, normalisePaymentDetails, paymentDetailsProblem, paymentOptions } from "@/util/paymentDetails";

/**
 * Where customers send their money.
 *
 * These go out in every order-received email and on the order-placed screen,
 * so a typo here sends real money to the wrong place. The preview shows the
 * details exactly as the customer will see them, and nothing saves until the
 * switched-on options are complete.
 */
export default function PaymentDetailsCard() {
  const [d, setD] = useState(DEFAULT_PAYMENT_DETAILS);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch("/api/payment-details")
      .then((r) => r.json())
      .then((v) => setD(normalisePaymentDetails(v)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const set = (section, key) => (e) => {
    const value = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setMsg(null);
    setD((prev) => (section ? { ...prev, [section]: { ...prev[section], [key]: value } } : { ...prev, [key]: value }));
  };

  const setUpi = (accounts) => {
    setMsg(null);
    setD((prev) => ({ ...prev, upi: { ...prev.upi, accounts } }));
  };
  const setAccount = (i, key) => (e) =>
    setUpi(d.upi.accounts.map((a, j) => (j === i ? { ...a, [key]: e.target.value } : a)));
  const addAccount = () => setUpi([...d.upi.accounts, { ...EMPTY_UPI_ACCOUNT }]);
  const removeAccount = (i) => setUpi(d.upi.accounts.filter((_, j) => j !== i));

  const clean = normalisePaymentDetails(d);
  const problem = paymentDetailsProblem(clean);
  const options = paymentOptions(clean);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/payment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setD(data.details);
      setMsg({ text: "Saved. New order emails and the order-placed screen use these now." });
    } catch (err) {
      setMsg({ error: true, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack gap={1.75} sx={panel}>
      <Stack>
        <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Payment details</Typography>
        <Typography fontSize={12.5} color="var(--text-color-secondary)">
          Sent in the order-received email and shown after checkout, so customers know where to pay
        </Typography>
      </Stack>

      {!loaded ? (
        <Stack alignItems="center" py={3}><CircularProgress size={22} sx={{ color: "var(--primary-color)" }} /></Stack>
      ) : (
        <>
          <Section title="UPI" on={d.upi.enabled} onToggle={set("upi", "enabled")}
            action={d.upi.accounts.length < MAX_UPI_ACCOUNTS && (
              <Tooltip title="Add another UPI number">
                <IconButton size="small" onClick={addAccount} aria-label="Add UPI number"
                  sx={{ color: "var(--primary-color)", border: "1px solid var(--primary-border)" }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}>
            {d.upi.accounts.map((a, i) => (
              <Stack key={i} gap={1.25} sx={{ gridColumn: "1 / -1" }}>
                {d.upi.accounts.length > 1 && (
                  <Stack direction="row" alignItems="center" justifyContent="space-between"
                    sx={{ borderTop: i > 0 ? "1px dashed var(--border)" : "none", pt: i > 0 ? 1.25 : 0 }}>
                    <Typography fontSize={12} fontWeight={800} color="var(--text-color-secondary)">UPI {i + 1}</Typography>
                    <Button size="small" onClick={() => removeAccount(i)} startIcon={<DeleteOutlineIcon fontSize="small" />}
                      sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, color: "var(--danger-ink)" }}>
                      Remove
                    </Button>
                  </Stack>
                )}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }, gap: 1.5 }}>
                  <TextField size="small" label="App name" value={a.app} onChange={setAccount(i, "app")}
                    placeholder="PhonePe" sx={fld} />
                  <TextField size="small" label="UPI phone number" value={a.number} onChange={setAccount(i, "number")}
                    inputProps={{ inputMode: "numeric", maxLength: 10 }} sx={fld} />
                  <TextField size="small" label="UPI ID (optional)" value={a.upiId} onChange={setAccount(i, "upiId")}
                    placeholder="name@ybl" sx={fld} />
                  <TextField size="small" label="Name shown to the payer" value={a.payee} onChange={setAccount(i, "payee")} sx={fld} />
                </Box>
              </Stack>
            ))}
          </Section>

          <Section title="Bank deposit" on={d.bank.enabled} onToggle={set("bank", "enabled")}>
            <TextField size="small" label="Account name" value={d.bank.accountName} onChange={set("bank", "accountName")} sx={fld} />
            <TextField size="small" label="Account number" value={d.bank.accountNumber} onChange={set("bank", "accountNumber")}
              inputProps={{ inputMode: "numeric" }} sx={fld} />
            <TextField size="small" label="IFSC" value={d.bank.ifsc} onChange={set("bank", "ifsc")}
              inputProps={{ style: { textTransform: "uppercase" } }} sx={fld} />
            <TextField size="small" label="Bank name" value={d.bank.bankName} onChange={set("bank", "bankName")} sx={fld} />
            <TextField size="small" label="Branch" value={d.bank.branch} onChange={set("bank", "branch")} sx={fld} />
          </Section>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }, gap: 1.5 }}>
            <TextField size="small" label="WhatsApp number for payment screenshots" value={d.confirmTo}
              onChange={set(null, "confirmTo")} inputProps={{ inputMode: "numeric", maxLength: 12 }} sx={fld} />
            <TextField size="small" label="Extra instructions (optional)" value={d.note} onChange={set(null, "note")}
              placeholder="e.g. Orders are packed within a day of payment" inputProps={{ maxLength: 300 }} sx={fld} />
          </Box>

          {/* What the customer sees */}
          <Stack gap={1} sx={{ p: 1.5, borderRadius: "var(--radius)", backgroundColor: "var(--primary-softer)", border: "1px solid var(--primary-border)" }}>
            <Typography fontSize={11} fontWeight={800} color="var(--text-color-trinary)" letterSpacing={0.4}>
              CUSTOMER SEES
            </Typography>
            {options.length === 0 && (
              <Typography fontSize={12.5} color="var(--danger-ink)" fontWeight={700}>No way to pay is switched on.</Typography>
            )}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }, gap: 1 }}>
              {options.map((o) => (
                <Stack key={o.key} gap={0.25} sx={{ p: 1.25, borderRadius: "var(--radius-sm)", backgroundColor: "#fff", border: "1px solid var(--primary-border)" }}>
                  <Typography fontSize={13} fontWeight={800}>{o.title}</Typography>
                  {o.rows.map(([k, v]) => (
                    <Stack key={k} direction="row" gap={1}>
                      <Typography fontSize={12} color="var(--text-color-secondary)" sx={{ minWidth: 84 }}>{k}</Typography>
                      <Typography fontSize={12.5} fontWeight={800} sx={{ wordBreak: "break-all" }}>{v}</Typography>
                    </Stack>
                  ))}
                </Stack>
              ))}
            </Box>
            {clean.confirmTo && (
              <Typography fontSize={12} color="var(--text-color-secondary)">
                …then send the payment screenshot on WhatsApp to <b>{clean.confirmTo}</b>.
                {clean.note ? ` ${clean.note}` : ""}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
            <Button onClick={save} disabled={busy || Boolean(problem)}
              sx={{ textTransform: "none", fontWeight: 800, px: 2.5, borderRadius: "var(--radius)", color: "#fff",
                    backgroundColor: "var(--primary-color)", "&:hover": { backgroundColor: "var(--primary-dark)" },
                    "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" } }}>
              {busy ? "Saving..." : "Save payment details"}
            </Button>
            {(problem || msg) && (
              <Typography fontSize={12.5} fontWeight={700}
                color={problem || msg?.error ? "var(--danger-ink)" : "var(--success-ink)"}>
                {problem || msg.text}
              </Typography>
            )}
          </Stack>
        </>
      )}
    </Stack>
  );
}

function Section({ title, on, onToggle, action, children }) {
  return (
    <Stack gap={1.25} sx={{ p: 1.5, borderRadius: "var(--radius)", border: "1px solid var(--border)", opacity: on ? 1 : 0.7 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography fontSize={13} fontWeight={800}>{title}</Typography>
          {on && action}
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Typography fontSize={12} fontWeight={700} color="var(--text-color-secondary)">{on ? "Shown" : "Hidden"}</Typography>
          <Switch size="small" checked={on} onChange={onToggle}
            sx={{ "& .Mui-checked": { color: "var(--primary-color)" }, "& .Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--primary-color)" } }} />
        </Stack>
      </Stack>
      {on && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }, gap: 1.5 }}>
          {children}
        </Box>
      )}
    </Stack>
  );
}

const fld = {
  "& .MuiOutlinedInput-root": { borderRadius: "var(--radius)" },
  "& label.Mui-focused": { color: "var(--primary-color)" },
  "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "var(--primary-color)" },
};
