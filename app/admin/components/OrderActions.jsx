"use client";
import { Stack, Typography, Button, Menu, MenuItem, CircularProgress, Divider } from "@mui/material";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useState } from "react";
import { buildProformaBlob } from "@/util/proforma";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const digits = (s) => String(s || "").replace(/\D/g, "");

/**
 * Everything you can do to an order besides move its status.
 *
 * Message templates are pre-written because the shop sends the same three
 * notes over and over, and typing them by hand on a phone at the packing table
 * is where mistakes and delays come from.
 */
export default function OrderActions({ order, onToast, onPrint }) {
  const [mailAnchor, setMailAnchor] = useState(null);
  const [waAnchor, setWaAnchor] = useState(null);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const c = order.customer;
  const adjusted = order.originalTotal != null && order.originalTotal !== order.total;

  const lines = (order.items || [])
    .map((i) => {
      if (i.substitute) return `• ${i.name} → ${i.substitute.name} × ${i.substitute.count} (replacement)`;
      if (i.unavailable) return `• ${i.name} — out of stock, removed`;
      return `• ${i.name} × ${i.count}`;
    })
    .join("\n");

  const WA_TEMPLATES = [
    {
      key: "confirm",
      label: "Confirm the order",
      text: `Hello ${c.name}, this is Sankamithra Thunder World.\n\nWe've received your order ${order.ref} for ${inr(order.total)}. Please confirm and we'll start packing.\n\n${lines}\n\nThank you!`,
    },
    {
      key: "substitution",
      label: "Explain a replacement",
      text: `Hello ${c.name}, about your order ${order.ref}.\n\nSome items were out of stock, so we've adjusted your order:\n\n${lines}\n\nYour new total is ${inr(order.total)}${adjusted ? ` (was ${inr(order.originalTotal)})` : ""}. Is that okay?`,
    },
    {
      key: "dispatch",
      label: "Say it's dispatched",
      text: `Hello ${c.name}, your Sankamithra order ${order.ref} (${inr(order.total)}) has been dispatched. We'll share delivery details shortly.\n\nThank you for shopping with us!`,
    },
  ];

  const sendMail = async (kind) => {
    setMailAnchor(null);
    if (!c.email) { onToast("This order has no customer email", "error"); return; }
    setSending(true);
    try {
      // Rendered here, not on the server - see the note in the email route.
      const blob = await buildInvoice();
      const invoice = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onloadend = () => res(String(r.result).split(",")[1]);
        r.onerror = () => rej(r.error);
        r.readAsDataURL(blob);
      });

      const res = await fetch(`/api/orders/${order.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, invoice }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onToast(`Email sent to ${data.sentTo}`, "success");
      else onToast(data.error || "Could not send the email", "error");
    } catch {
      onToast("Could not reach the mail service", "error");
    } finally {
      setSending(false);
    }
  };

  const buildInvoice = () => buildProformaBlob(order);

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      const blob = await buildInvoice();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sankamithra-Proforma-${order.ref}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      onToast("Proforma downloaded", "success");
    } catch (e) {
      console.error(e);
      onToast("Could not build the proforma", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Stack gap={1}>
      <Typography fontSize={12.5} fontWeight={800} color="var(--text-color)">Contact &amp; documents</Typography>

      <Stack direction="row" gap={0.75} flexWrap="wrap">
        <Button href={`tel:${digits(c.phone)}`} startIcon={<PhoneRoundedIcon sx={{ fontSize: 15 }} />} sx={btn}>
          {c.phone}
        </Button>

        <Button
          onClick={(e) => setWaAnchor(e.currentTarget)}
          startIcon={<WhatsAppIcon sx={{ fontSize: 15 }} />}
          endIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 14 }} />}
          sx={{ ...btn, color: "#128c7e", borderColor: "#bfe6df" }}
        >
          WhatsApp
        </Button>

        <Button
          onClick={(e) => setMailAnchor(e.currentTarget)}
          disabled={sending}
          startIcon={sending ? <CircularProgress size={13} /> : <MailOutlineRoundedIcon sx={{ fontSize: 15 }} />}
          endIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 14 }} />}
          sx={btn}
        >
          {sending ? "Sending..." : "Email"}
        </Button>

        <Button
          onClick={downloadInvoice}
          disabled={downloading}
          startIcon={downloading ? <CircularProgress size={13} /> : <DownloadRoundedIcon sx={{ fontSize: 15 }} />}
          sx={btn}
        >
          Proforma
        </Button>

        <Button onClick={onPrint} startIcon={<PrintRoundedIcon sx={{ fontSize: 15 }} />} sx={btn}>
          Print slip
        </Button>
      </Stack>

      <Menu anchorEl={waAnchor} open={Boolean(waAnchor)} onClose={() => setWaAnchor(null)}
        PaperProps={{ sx: { borderRadius: "var(--radius)", minWidth: 230 } }}>
        <Typography fontSize={11} fontWeight={800} color="var(--text-color-trinary)" sx={{ px: 2, py: 1 }}>
          SEND ON WHATSAPP
        </Typography>
        <Divider />
        {WA_TEMPLATES.map((t) => (
          <MenuItem
            key={t.key}
            onClick={() => {
              window.open(`https://wa.me/91${digits(c.phone)}?text=${encodeURIComponent(t.text)}`, "_blank", "noopener");
              setWaAnchor(null);
            }}
            sx={{ fontSize: 13.5, fontWeight: 600 }}
          >
            {t.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={mailAnchor} open={Boolean(mailAnchor)} onClose={() => setMailAnchor(null)}
        PaperProps={{ sx: { borderRadius: "var(--radius)", minWidth: 250 } }}>
        <Typography fontSize={11} fontWeight={800} color="var(--text-color-trinary)" sx={{ px: 2, py: 1 }}>
          EMAIL {c.email ? c.email.toUpperCase() : "— NO ADDRESS"}
        </Typography>
        <Divider />
        <MenuItem onClick={() => sendMail("confirm")} sx={mi}>Order confirmation</MenuItem>
        <MenuItem onClick={() => sendMail("dispatch")} sx={mi}>Dispatch notice</MenuItem>
        <MenuItem onClick={() => sendMail("invoice")} sx={mi}>Proforma only</MenuItem>
      </Menu>
    </Stack>
  );
}

const btn = {
  textTransform: "none", fontWeight: 700, fontSize: 12.5,
  borderRadius: "var(--radius-sm)", py: 0.5, px: 1.25, minWidth: 0,
  color: "var(--text-color)", border: "1px solid var(--border)",
  "&:hover": { backgroundColor: "var(--surface-muted)", borderColor: "var(--border-strong)" },
};
const mi = { fontSize: 13.5, fontWeight: 600 };
