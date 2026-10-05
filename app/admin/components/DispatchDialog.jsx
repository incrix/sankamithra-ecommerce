"use client";
import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Typography, TextField, Button,
} from "@mui/material";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";

/**
 * Marks an order dispatched, with how it went.
 *
 * Asked at the one moment the packer has the LR slip in hand. Every field is
 * optional - a parcel handed to the customer's own driver has no LR - but when
 * given, the dispatch email carries it and saves the customer a phone call.
 */
export default function DispatchDialog({ open, order, busy, onClose, onConfirm }) {
  const [transport, setTransport] = useState("");
  const [lr, setLr] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setTransport(order?.dispatch?.transport || "");
    setLr(order?.dispatch?.lr || "");
    setNote(order?.dispatch?.note || "");
  }, [open, order?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const email = order?.customer?.email;
  const confirm = () => onConfirm({ transport, lr, note });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      PaperProps={{ sx: { borderRadius: "var(--radius-lg)" } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <LocalShippingRoundedIcon sx={{ color: "var(--primary-color)" }} />
          <Typography fontSize={16} fontWeight={800}>Dispatch {order?.ref}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack gap={1.75} pt={0.5}>
          <TextField size="small" label="Transport / courier" placeholder="e.g. KPN Parcel Service"
            value={transport} onChange={(e) => setTransport(e.target.value)} inputProps={{ maxLength: 60 }} sx={fld} autoFocus />
          <TextField size="small" label="LR / tracking number" value={lr}
            onChange={(e) => setLr(e.target.value)} inputProps={{ maxLength: 40 }} sx={fld} />
          <TextField size="small" label="Note for the customer (optional)" placeholder="e.g. Collect from the Madurai office"
            value={note} onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 160 }} multiline minRows={2} sx={fld} />
          <Typography fontSize={12} fontWeight={600} color="var(--text-color-secondary)">
            {email
              ? `${email} will be emailed that the order is on its way, with these details and the item list.`
              : "This order has no customer email — share the details by phone or WhatsApp."}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700, color: "var(--text-color-secondary)" }}>
          Cancel
        </Button>
        <Button onClick={confirm} disabled={busy}
          sx={{ textTransform: "none", fontWeight: 800, px: 2.5, borderRadius: "var(--radius)", color: "#fff",
                backgroundColor: "var(--primary-color)", "&:hover": { backgroundColor: "var(--primary-dark)" } }}>
          Mark dispatched
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const fld = {
  "& .MuiOutlinedInput-root": { borderRadius: "var(--radius)" },
  "& label.Mui-focused": { color: "var(--primary-color)" },
  "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "var(--primary-color)" },
};
