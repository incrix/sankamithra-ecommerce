"use client";
import {
  Stack, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PhoneDisabledRoundedIcon from "@mui/icons-material/PhoneDisabledRounded";
import { useState } from "react";
import { useAdmin } from "../AdminContext";
import { useMe, setMe, sameName, knownNames } from "@/util/teamMember";

const ago = (iso) => {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/**
 * Who is calling this customer, and whether they have confirmed.
 *
 * Sits above the phone buttons on purpose: the moment to look at it is just
 * before ringing, so two people never call the same customer about the same
 * order. See util/orderHandler.js for the rules the server enforces.
 */
export default function OrderHandler({ order, busy, onPatch }) {
  const { orders } = useAdmin();
  const me = useMe();
  // The action waiting on a name, when this device has not said who it is yet.
  const [asking, setAsking] = useState(null);
  const [draft, setDraft] = useState("");

  const holder = order.handledBy;
  const confirmed = order.confirmedBy;
  const mine = holder && sameName(holder.name, me);
  const closed = order.status === "cancelled";

  const send = (name, action, extra = {}) => onPatch({ handler: { action, name, ...extra } });

  const act = (action, extra) => {
    if (!me) { setDraft(""); setAsking({ action, extra }); return; }
    send(me, action, extra);
  };

  const takeOver = () => {
    if (!window.confirm(`${holder.name} is handling ${order.ref}. Take it over from them?`)) return;
    act("take", { takeOver: true });
  };

  const saveName = (value) => {
    const name = setMe(value);
    if (!name) return;
    const pending = asking;
    setAsking(null);
    if (pending?.action) send(name, pending.action, pending.extra);
  };

  const names = knownNames(orders);

  return (
    <Stack gap={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography fontSize={12.5} fontWeight={800} color="var(--text-color)">Taken by</Typography>
        <Typography
          component="button"
          onClick={() => { setDraft(me); setAsking({}); }}
          sx={{ all: "unset", cursor: "pointer", fontSize: 11.5, fontWeight: 700,
                color: "var(--text-color-secondary)", "&:hover": { color: "var(--primary-color)" } }}
        >
          {me ? `You are ${me} · change` : "Who are you?"}
        </Typography>
      </Stack>

      {!holder ? (
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap"
          sx={{ p: 1.25, borderRadius: "var(--radius)", backgroundColor: "var(--surface-muted)" }}>
          <Typography fontSize={12.5} fontWeight={700} color="var(--text-color-secondary)" flex={1} minWidth={140}>
            Nobody has taken this yet
          </Typography>
          <Button onClick={() => act("take")} disabled={busy || closed}
            startIcon={<PersonRoundedIcon sx={{ fontSize: 16 }} />} sx={primaryBtn}>
            I’ll take it
          </Button>
        </Stack>
      ) : mine ? (
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap"
          sx={{ p: 1.25, borderRadius: "var(--radius)", backgroundColor: "var(--primary-soft)" }}>
          <Typography fontSize={12.5} fontWeight={800} color="var(--primary-color)" flex={1} minWidth={140}>
            You’re handling this · {ago(holder.at)}
          </Typography>
          <Button onClick={() => act("release")} disabled={busy} sx={quietBtn}>Release</Button>
        </Stack>
      ) : (
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap"
          sx={{ p: 1.25, borderRadius: "var(--radius)", backgroundColor: "var(--warning-soft)" }}>
          <PhoneDisabledRoundedIcon sx={{ fontSize: 17, color: "var(--warning)" }} />
          <Typography fontSize={12.5} fontWeight={800} color="var(--warning)" flex={1} minWidth={140}>
            {holder.name} is handling this · {ago(holder.at)}
            {!confirmed && " — don’t call the customer"}
          </Typography>
          <Button onClick={takeOver} disabled={busy || closed} sx={quietBtn}>Take over</Button>
        </Stack>
      )}

      {confirmed ? (
        <Stack direction="row" alignItems="center" gap={0.75}
          sx={{ p: 1.25, borderRadius: "var(--radius)", backgroundColor: "var(--success-soft)" }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 17, color: "var(--success)" }} />
          <Typography fontSize={12.5} fontWeight={800} color="var(--success-ink)" flex={1}>
            Confirmed by {confirmed.name} · {new Date(confirmed.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </Typography>
          <Button onClick={() => act("unconfirm")} disabled={busy} sx={quietBtn}>Undo</Button>
        </Stack>
      ) : (!holder || mine) && !closed && (
        <Button onClick={() => act("confirm")} disabled={busy}
          startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{ ...primaryBtn, alignSelf: "flex-start", backgroundColor: "var(--success)",
                "&:hover": { backgroundColor: "var(--success-ink)" } }}>
          Customer confirmed
        </Button>
      )}

      <Dialog open={Boolean(asking)} onClose={() => setAsking(null)} fullWidth maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "var(--radius)" } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 800 }}>Who’s using this phone?</DialogTitle>
        <DialogContent>
          <Typography fontSize={12.5} color="var(--text-color-secondary)" mb={1.5}>
            Your name goes on the orders you take and confirm, so the others know not to call.
            It’s remembered on this device.
          </Typography>
          {names.length > 0 && (
            <Stack direction="row" gap={0.75} flexWrap="wrap" mb={1.5}>
              {names.map((n) => (
                <Chip key={n} label={n} onClick={() => saveName(n)}
                  sx={{ fontWeight: 700, fontSize: 12.5, border: "1px solid var(--border)", backgroundColor: "#fff" }} />
              ))}
            </Stack>
          )}
          <TextField
            autoFocus fullWidth size="small" label="Your name" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) saveName(draft); }}
            inputProps={{ maxLength: 40 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAsking(null)} sx={quietBtn}>Cancel</Button>
          <Button onClick={() => saveName(draft)} disabled={!draft.trim()} sx={primaryBtn}>
            {asking?.action ? "Save and continue" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

const primaryBtn = {
  textTransform: "none", fontWeight: 800, fontSize: 12.5, px: 1.5, py: 0.5,
  borderRadius: "var(--radius-pill)", color: "#fff", backgroundColor: "var(--primary-color)",
  "&:hover": { backgroundColor: "var(--primary-color)", filter: "brightness(.92)" },
  "&.Mui-disabled": { color: "#fff", opacity: 0.5 },
};
const quietBtn = {
  textTransform: "none", fontWeight: 700, fontSize: 12, px: 1.25, py: 0.25, minWidth: 0,
  borderRadius: "var(--radius-pill)", color: "var(--text-color)", border: "1px solid var(--border)",
  backgroundColor: "#fff",
};
