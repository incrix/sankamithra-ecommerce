"use client";
import { useState } from "react";
import { Stack, Typography, InputBase, IconButton, Button, Tooltip } from "@mui/material";
import DriveFileRenameOutlineRoundedIcon from "@mui/icons-material/DriveFileRenameOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { CUSTOMER_FIELDS } from "@/util/orderCustomer";

/**
 * The customer on an order, and the form that corrects it.
 *
 * Every detail here is fixable after the fact: names are misheard on the phone,
 * addresses are mistyped at the counter, and a customer who rings back to have
 * the parcel sent somewhere else should not need the order cancelling and
 * rebuilding. Only fields the biller actually changed are sent, so a stray
 * click cannot rewrite the block, and the store records each change in the
 * order's history.
 */
export default function CustomerBlock({ customer, busy, onSave }) {
  // `null` means not editing; an object is the draft being typed.
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});

  const c = customer || {};

  const open = () => {
    setErrors({});
    setDraft(Object.fromEntries(CUSTOMER_FIELDS.map(({ key }) => [key, String(c[key] || "")])));
  };

  const close = () => { setDraft(null); setErrors({}); };

  const save = () => {
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length) return;

    // Only what actually moved: the store logs a history line per field, and
    // resending unchanged values would fill the history with noise.
    const changed = {};
    CUSTOMER_FIELDS.forEach(({ key }) => {
      const value = draft[key].trim();
      if (value !== String(c[key] || "")) changed[key] = value;
    });

    if (Object.keys(changed).length) onSave(changed);
    close();
  };

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  return (
    <Stack gap={1}>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Customer</Typography>
        {draft === null && (
          <Tooltip title="Correct the customer's details">
            <IconButton
              size="small"
              disabled={busy}
              onClick={open}
              aria-label="edit customer details"
              sx={{ p: 0.25, color: "var(--text-color-trinary)", "&:hover": { color: "var(--primary-color)" } }}
            >
              <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {draft === null ? (
        <Stack gap={0.25}>
          <Typography fontSize={13.5} fontWeight={800} color="var(--text-color)">{c.name}</Typography>
          <Typography fontSize={12.5} color="var(--text-color-secondary)">{c.address}</Typography>
          <Typography fontSize={12.5} color="var(--text-color-secondary)">{c.city}, {c.state} — {c.zip}</Typography>
          <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
            <Typography fontSize={12.5} color="var(--text-color-secondary)">{c.email}</Typography>
            <IconButton size="small" aria-label="copy email" onClick={() => navigator.clipboard?.writeText(c.email)}>
              <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Stack>
        </Stack>
      ) : (
        <Stack gap={1}>
          <Field label="Name" value={draft.name} error={errors.name} onChange={set("name")} max={80} autoFocus />
          <Stack direction="row" gap={1}>
            <Field label="Phone" value={draft.phone} error={errors.phone} onChange={set("phone")} max={20} />
            <Field label="PIN code" value={draft.zip} error={errors.zip} onChange={set("zip")} max={10} />
          </Stack>
          <Field label="Email" value={draft.email} error={errors.email} onChange={set("email")} max={120} />
          <Field label="Address" value={draft.address} error={errors.address} onChange={set("address")} max={200} multiline />
          <Stack direction="row" gap={1}>
            <Field label="City" value={draft.city} error={errors.city} onChange={set("city")} max={60} />
            <Field label="State" value={draft.state} error={errors.state} onChange={set("state")} max={60} />
          </Stack>

          <Stack direction="row" gap={1} pt={0.25}>
            <Button
              onClick={save}
              disabled={busy}
              sx={{ textTransform: "none", fontWeight: 800, fontSize: 12.5, px: 2,
                    borderRadius: "var(--radius-pill)", color: "#fff",
                    backgroundColor: "var(--primary-color)",
                    "&:hover": { backgroundColor: "#e34100" } }}
            >
              Save details
            </Button>
            <Button
              onClick={close}
              disabled={busy}
              sx={{ textTransform: "none", fontWeight: 700, fontSize: 12.5, px: 1.5,
                    borderRadius: "var(--radius-pill)", color: "var(--text-color-secondary)" }}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}

/**
 * Checks only what would cause real trouble later: a bill with no name on it,
 * an email the status mail cannot reach, a PIN code the courier cannot use.
 * A blank optional field is left alone - counter bills often have no email.
 */
function validate(draft) {
  const found = {};
  if (!draft.name.trim()) found.name = "The bill needs a name";

  const email = draft.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) found.email = "That email will not reach anyone";

  const phone = draft.phone.replace(/\D/g, "");
  if (draft.phone.trim() && (phone.length < 10 || phone.length > 12)) found.phone = "10 digits, please";

  const zip = draft.zip.trim();
  if (zip && !/^\d{6}$/.test(zip)) found.zip = "6 digits";

  return found;
}

function Field({ label, value, onChange, error, max, multiline, autoFocus }) {
  return (
    <Stack gap={0.25} flex={1} minWidth={0}>
      <Typography fontSize={11} fontWeight={800} color="var(--text-color-trinary)"
        sx={{ textTransform: "uppercase", letterSpacing: 0.3 }}>
        {label}
      </Typography>
      <InputBase
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        multiline={multiline}
        minRows={multiline ? 2 : undefined}
        inputProps={{ maxLength: max, "aria-label": label }}
        sx={{
          fontSize: 13, fontWeight: 600, px: 1, py: 0.5,
          borderRadius: "var(--radius-sm)",
          border: "1px solid", borderColor: error ? "var(--danger)" : "var(--border)",
          "&.Mui-focused": { borderColor: error ? "var(--danger)" : "var(--primary-color)" },
        }}
      />
      {error && (
        <Typography fontSize={10.5} fontWeight={700} color="var(--danger-ink)">{error}</Typography>
      )}
    </Stack>
  );
}
