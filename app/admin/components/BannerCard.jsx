"use client";
import { useEffect, useState } from "react";
import { Stack, Box, Typography, Button, TextField, Switch, CircularProgress } from "@mui/material";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import { panel } from "./RevenueChart";

/**
 * Edits the announcement strip that runs across the top of every shop page.
 *
 * A live preview in the strip's real colours sits above the field, because the
 * text is short, always centred and read at a glance - what it looks like
 * matters more than what it says in an input box.
 */

const MAX = 120;

export default function BannerCard() {
  const [text, setText] = useState("");
  const [href, setHref] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch("/api/banner")
      .then((r) => r.json())
      .then((b) => {
        setText(b.text || "");
        setHref(b.href || "");
        setEnabled(b.enabled !== false);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, href, enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg({ text: "Saved. The strip is updated across the site." });
    } catch (err) {
      setMsg({ error: true, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack gap={1.5} sx={panel}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
        <Stack>
          <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Top banner</Typography>
          <Typography fontSize={12.5} color="var(--text-color-secondary)">
            The strip across the top of every shop page
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Typography fontSize={12} fontWeight={700} color="var(--text-color-secondary)">
            {enabled ? "Showing" : "Hidden"}
          </Typography>
          <Switch
            size="small"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            sx={{ "& .Mui-checked": { color: "var(--primary-color)" }, "& .Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--primary-color)" } }}
          />
        </Stack>
      </Stack>

      {/* Preview, in the strip's real colours */}
      <Box
        sx={{
          borderRadius: "var(--radius)",
          overflow: "hidden",
          border: "1px solid var(--border)",
          opacity: enabled ? 1 : 0.4,
        }}
      >
        <Box sx={{ backgroundColor: "var(--primary-color)", py: 0.85, px: 2 }}>
          <Typography textAlign="center" fontSize={12.5} fontWeight={800} color="#fff" letterSpacing={0.2}>
            {text || " "}
          </Typography>
        </Box>
      </Box>

      <TextField
        label="Banner text"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX))}
        disabled={!loaded}
        size="small"
        fullWidth
        helperText={`${text.length}/${MAX}`}
        InputProps={{ startAdornment: <CampaignRoundedIcon sx={{ fontSize: 17, color: "var(--text-color-trinary)", mr: 1 }} /> }}
      />

      <TextField
        label="Link (optional)"
        placeholder="/wholesale"
        value={href}
        onChange={(e) => setHref(e.target.value)}
        disabled={!loaded}
        size="small"
        fullWidth
        helperText="A path on this site. Leave blank for a strip that isn't clickable."
      />

      <Button
        onClick={save}
        disabled={busy || !loaded}
        startIcon={busy ? <CircularProgress size={15} sx={{ color: "inherit" }} /> : null}
        sx={{
          alignSelf: "flex-start",
          textTransform: "none",
          fontWeight: 800,
          fontSize: 13,
          px: 2.5,
          borderRadius: "var(--radius-pill)",
          background: "var(--primary-color)",
          color: "#fff",
          "&:hover": { background: "var(--primary-color)", filter: "brightness(0.92)" },
          "&.Mui-disabled": { background: "var(--primary-color)", color: "#fff", opacity: 0.6 },
        }}
      >
        {busy ? "Saving…" : "Save banner"}
      </Button>

      {msg && (
        <Typography fontSize={12.5} fontWeight={600} color={msg.error ? "#c62828" : "#2e7d32"}>
          {msg.text}
        </Typography>
      )}
    </Stack>
  );
}
