"use client";
import { useEffect, useState } from "react";
import {
  Stack, Box, Typography, Button, TextField, Switch, Checkbox, IconButton,
  Tooltip, CircularProgress, FormControlLabel,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { panel } from "./RevenueChart";
import { activePoints, deliveryPointFor, MAX_DELIVERY_POINTS } from "@/util/minimumOrder";

/**
 * Turns online sales on and off, and picks the cities orders are taken for.
 *
 * Nothing reaches customers until Save, so a slip of the thumb on the switch
 * cannot close the shop, and several cities can be changed in one go. The order
 * route reads the saved setting on every order, so a save applies at once.
 * Counter bills are not affected.
 */
const pill = {
  textTransform: "none", fontWeight: 800, fontSize: 13, px: 2,
  borderRadius: "var(--radius-pill)", background: "var(--primary-color)", color: "#fff",
  "&:hover": { background: "var(--primary-color)", filter: "brightness(0.92)" },
  "&.Mui-disabled": { background: "var(--primary-color)", color: "#fff", opacity: 0.6 },
};

const smallLink = { textTransform: "none", fontWeight: 700, fontSize: 12.5, color: "var(--primary-color)", minWidth: 0 };

export default function SalesCard() {
  const [sales, setSales] = useState(null);
  const [saved, setSaved] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch("/api/sales", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((s) => { setSales(s); setSaved(s); })
      .catch(() => setMsg({ error: true, text: "Could not load the current settings. Refresh to try again." }));
  }, []);

  if (!sales) {
    return msg
      ? <Typography fontSize={12.5} fontWeight={600} color="#c62828">{msg.text}</Typography>
      : <Stack alignItems="center" py={8}><CircularProgress sx={{ color: "var(--primary-color)" }} /></Stack>;
  }

  const change = (next) => { setSales({ ...sales, ...next }); setMsg(null); };
  const setAll = (enabled) => change({ points: sales.points.map((p) => ({ ...p, enabled })) });
  const dirty = JSON.stringify(sales) !== JSON.stringify(saved);
  const names = sales.points.map((p) => p.name);

  const add = () => {
    const n = name.replace(/\s+/g, " ").trim();
    if (!n) return;
    if (deliveryPointFor(n, names)) {
      setMsg({ error: true, text: `${n} is already on the list` });
      return;
    }
    change({ points: [...sales.points, { name: n, enabled: true }] });
    setName("");
  };

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sales),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSales(data.sales);
      setSaved(data.sales);
      setMsg({ text: data.sales.open ? "Saved. Customers can order for the ticked cities." : "Saved. Online sales are off." });
    } catch (err) {
      setMsg({ error: true, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack gap={2} sx={{ maxWidth: 760 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={panel}>
        <Stack>
          <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Online sales</Typography>
          <Typography fontSize={12.5} color="var(--text-color-secondary)">
            {sales.open
              ? "Customers can place orders on the website"
              : "Customers cannot place orders. Counter bills still work."}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.5} flexShrink={0}>
          <Typography fontSize={13} fontWeight={800} color={sales.open ? "#2e7d32" : "#c62828"}>
            {sales.open ? "ON" : "OFF"}
          </Typography>
          <Switch
            checked={sales.open}
            onChange={(e) => change({ open: e.target.checked })}
            inputProps={{ "aria-label": "Online sales" }}
            sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--primary-color)" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--primary-color)" } }}
          />
        </Stack>
      </Stack>

      <Stack gap={1.5} sx={panel}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
          <Stack>
            <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Delivery cities</Typography>
            <Typography fontSize={12.5} color="var(--text-color-secondary)">
              {activePoints(sales).length} of {sales.points.length} taking orders. Only ticked cities show at checkout.
            </Typography>
          </Stack>
          <Stack direction="row" gap={0.5}>
            <Button size="small" onClick={() => setAll(true)} sx={smallLink}>Tick all</Button>
            <Button size="small" onClick={() => setAll(false)} sx={smallLink}>Clear all</Button>
          </Stack>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, columnGap: 1 }}>
          {sales.points.map((p) => (
            <Stack key={p.name} direction="row" alignItems="center" justifyContent="space-between" minWidth={0}>
              <FormControlLabel
                sx={{ m: 0, minWidth: 0, "& .MuiFormControlLabel-label": { fontSize: 13.5, fontWeight: 600 } }}
                label={p.name}
                control={(
                  <Checkbox
                    size="small"
                    checked={p.enabled}
                    onChange={(e) => change({ points: sales.points.map((x) => (x.name === p.name ? { ...x, enabled: e.target.checked } : x)) })}
                    sx={{ "&.Mui-checked": { color: "var(--primary-color)" } }}
                  />
                )}
              />
              <Tooltip title={`Remove ${p.name}`}>
                <IconButton
                  size="small"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => change({ points: sales.points.filter((x) => x.name !== p.name) })}
                >
                  <CloseRoundedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Box>

        <Stack direction="row" gap={1}>
          <TextField
            size="small"
            label="Add a city"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            sx={{ flex: 1, maxWidth: 280 }}
          />
          <Button
            onClick={add}
            disabled={!name.trim() || sales.points.length >= MAX_DELIVERY_POINTS}
            startIcon={<AddRoundedIcon sx={{ fontSize: 17 }} />}
            sx={pill}
          >
            Add
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
        <Button
          onClick={save}
          disabled={busy || !dirty}
          startIcon={busy ? <CircularProgress size={15} sx={{ color: "inherit" }} /> : null}
          sx={{ ...pill, px: 2.5 }}
        >
          {busy ? "Saving…" : "Save changes"}
        </Button>
        {dirty && !msg && (
          <Typography fontSize={12.5} fontWeight={700} color="#b26a00">
            Not saved yet. Customers still see the old settings.
          </Typography>
        )}
        {msg && (
          <Typography fontSize={12.5} fontWeight={600} color={msg.error ? "#c62828" : "#2e7d32"}>
            {msg.text}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
