"use client";
import { useEffect, useRef, useState } from "react";
import { Stack, Box, Typography, Button, CircularProgress } from "@mui/material";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { panel } from "./RevenueChart";

/**
 * Replaces the price list PDF that every "Download price list" link on the
 * site points at.
 *
 * The links themselves are a fixed /api/price-list, which redirects to the
 * current file - so a new upload takes effect everywhere at once with nothing
 * else to change.
 */

const kb = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
const when = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function PriceListCard() {
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const input = useRef(null);

  useEffect(() => {
    fetch("/api/price-list?info=1")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, []);

  async function upload(file) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setMsg({ error: true, text: "That is not a PDF." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/price-list", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setInfo({ ...data, custom: true });
      setMsg({ text: "Price list updated. Every download link now serves this file." });
    } catch (err) {
      setMsg({ error: true, text: err.message });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <Stack gap={1.5} sx={panel}>
      <Stack>
        <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Price list PDF</Typography>
        <Typography fontSize={12.5} color="var(--text-color-secondary)">
          Shared from the header, the wholesale page and WhatsApp enquiries
        </Typography>
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={1.5}
        sx={{ p: 1.5, borderRadius: "var(--radius)", background: "var(--surface-muted)", border: "1px solid var(--border)" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: "var(--radius)", background: "#fff", border: "1px solid var(--border)", flexShrink: 0 }}>
          <PictureAsPdfRoundedIcon sx={{ fontSize: 20, color: "var(--primary-color)" }} />
        </Box>

        <Stack flex={1} minWidth={0}>
          <Typography fontSize={13} fontWeight={800} color="var(--text-color)" noWrap>
            {info?.custom ? info.name : "The file that shipped with the site"}
          </Typography>
          <Typography fontSize={12} color="var(--text-color-secondary)">
            {info?.custom
              ? `${kb(info.size)} · uploaded ${when(info.uploadedAt)}`
              : "No upload yet - the original 2025 list is being served"}
          </Typography>
        </Stack>

        <Button
          href="/api/price-list"
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          startIcon={<OpenInNewRoundedIcon />}
          sx={{ textTransform: "none", fontWeight: 700, fontSize: 12.5, color: "var(--text-color-secondary)", flexShrink: 0 }}
        >
          View
        </Button>
      </Stack>

      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />

      <Button
        onClick={() => input.current?.click()}
        disabled={busy}
        startIcon={busy ? <CircularProgress size={15} sx={{ color: "inherit" }} /> : <FileUploadRoundedIcon />}
        sx={{
          alignSelf: "flex-start",
          textTransform: "none",
          fontWeight: 800,
          fontSize: 13,
          px: 2,
          borderRadius: "var(--radius-pill)",
          background: "var(--primary-color)",
          color: "#fff",
          "&:hover": { background: "var(--primary-color)", filter: "brightness(0.92)" },
          "&.Mui-disabled": { background: "var(--primary-color)", color: "#fff", opacity: 0.6 },
        }}
      >
        {busy ? "Uploading…" : "Upload new PDF"}
      </Button>

      {msg && (
        <Typography fontSize={12.5} fontWeight={600} color={msg.error ? "#c62828" : "#2e7d32"}>
          {msg.text}
        </Typography>
      )}
    </Stack>
  );
}
