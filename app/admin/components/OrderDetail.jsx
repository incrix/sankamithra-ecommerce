"use client";
import { Stack, Typography, Box, Button, Divider, Chip, IconButton, Tooltip } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import PackingList from "./PackingList";
import SubstitutePicker from "./SubstitutePicker";
import OrderActions from "./OrderActions";
import StatusChip from "./StatusChip";
import { useState } from "react";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const digits = (s) => String(s || "").replace(/\D/g, "");

/** The next single action for each state - one obvious button, no menus. */
const NEXT = {
  new: { to: "packing", label: "Start packing" },
  packing: { to: "packed", label: "Mark packed" },
  packed: { to: "dispatched", label: "Mark dispatched" },
};

export default function OrderDetail({ order, onClose, onPatch, onTogglePacked, busy, onToast }) {
  // Hooks must run before any early return, or the hook order changes between
  // renders as soon as `order` goes null.
  const [swapFor, setSwapFor] = useState(null);

  if (!order) return null;

  const c = order.customer;
  const next = NEXT[order.status];
  // A line the packer could not fill is settled too - it must not block the
  // order from being completed.
  const allSettled = order.items.every((i) => i.packed || (i.unavailable && !i.substitute));
  const adjusted = (order.originalTotal ?? order.total) !== order.total;

  const waText = encodeURIComponent(
    `Hello ${c.name}, this is Sankamithra Thunder World about your order ${order.ref} (${inr(order.total)}). `
  );

  const printSlip = () => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(`
      <html><head><title>Packing slip ${order.ref}</title>
      <style>
        body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#222}
        h1{font-size:20px;margin:0 0 4px} .muted{color:#666;font-size:12px}
        table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
        th,td{border:1px solid #ddd;padding:7px 9px;text-align:left}
        th{background:#f4f4f4} .qty{text-align:center;font-weight:700;width:60px}
        .tick{width:34px} tfoot td{font-weight:700} .out{color:#999;background:#fafafa}
      </style></head><body>
      <h1>Sankamithra Thunder World — Packing slip</h1>
      <div class="muted">Order ${order.ref} · ${new Date(order.createdAt).toLocaleString("en-IN")}</div>
      <p><b>${c.name}</b><br>${c.address}<br>${c.city}, ${c.state} — ${c.zip}<br>${c.phone}</p>
      <table><thead><tr><th class="tick">✓</th><th>Item</th><th class="qty">Qty</th></tr></thead>
      <tbody>${order.items.map((i) => {
        if (i.substitute) {
          return `<tr><td class="tick"></td><td><s>${i.name}</s><br><b>&#8594; ${i.substitute.name}</b> <i>(replacement)</i></td><td class="qty">${i.substitute.count}</td></tr>`;
        }
        if (i.unavailable) {
          return `<tr class="out"><td class="tick">&#10007;</td><td><s>${i.name}</s> <i>(out of stock &#8212; not supplied)</i></td><td class="qty">&#8212;</td></tr>`;
        }
        return `<tr><td class="tick"></td><td>${i.name}</td><td class="qty">${i.count}</td></tr>`;
      }).join("")}</tbody>
      <tfoot><tr><td></td><td>Total ${order.items.length} lines / ${order.itemCount} units${order.originalTotal && order.originalTotal !== order.total ? " &#183; adjusted from " + inr(order.originalTotal) : ""}</td><td class="qty">${inr(order.total)}</td></tr></tfoot>
      </table></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    // flex:1 + minHeight:0 inside the parent's flex column is what lets the
    // middle section scroll and keeps the action bar pinned in view.
    <Stack sx={{ flex: 1, minHeight: 0, height: "100%" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" gap={1} sx={{ p: 2, borderBottom: "1px solid #eee" }}>
        <Stack flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography fontSize={16} fontWeight={800} color="var(--text-color)">{order.ref}</Typography>
            <StatusChip status={order.status} />
            {!order.emailSent && (
              <Tooltip title="The notification email did not send for this order">
                <Chip label="No email" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, backgroundColor: "#fff4e5", color: "#b26a00" }} />
              </Tooltip>
            )}
          </Stack>
          <Typography fontSize={11.5} color="var(--text-color-secondary)">
            {new Date(order.createdAt).toLocaleString("en-IN")}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} aria-label="close order"><CloseRoundedIcon /></IconButton>
      </Stack>

      <Stack sx={{ flex: 1, overflowY: "auto", minHeight: 0, p: 2, gap: 2.5 }}>
        {/* Customer + one-tap contact: the owner confirms every order by phone */}
        <Stack gap={1}>
          <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Customer</Typography>
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

        </Stack>

        <OrderActions order={order} onToast={onToast} onPrint={printSlip} />

        <Divider />

        <PackingList
          items={order.items}
          busy={busy}
          onToggle={onTogglePacked}
          onUnavailable={(it, flag) => onPatch({ itemId: it.id, unavailable: flag })}
          onSubstitute={(it) => setSwapFor(it)}
        />

        <SubstitutePicker
          open={Boolean(swapFor)}
          item={swapFor}
          onClose={() => setSwapFor(null)}
          onChoose={(sub) => { onPatch({ itemId: swapFor.id, substitute: sub }); setSwapFor(null); }}
        />

        <Divider />

        <Stack gap={0.5}>
          <Row label={`Price (${order.itemCount} units)`} value={inr(order.mrp)} />
          <Row label="Discount" value={`− ${inr(order.mrp - order.total)}`} green />
          <Stack direction="row" justifyContent="space-between" pt={0.5}>
            <Typography fontSize={15} fontWeight={800} color="var(--text-color)">Total</Typography>
            <Stack alignItems="flex-end">
              <Typography fontSize={17} fontWeight={800} color="var(--text-color)">{inr(order.total)}</Typography>
              {adjusted && (
                <Typography fontSize={11} color="var(--text-color-secondary)" sx={{ textDecoration: "line-through" }}>
                  {inr(order.originalTotal)}
                </Typography>
              )}
            </Stack>
          </Stack>

          {/* The customer agreed to the original figure - the shop has to
              mention any change when it calls to confirm. */}
          {adjusted && (
            <Stack direction="row" gap={1} alignItems="center"
              sx={{ mt: 0.5, p: 1.25, borderRadius: "var(--radius)", backgroundColor: "var(--warning-soft)" }}>
              <ErrorOutlineRoundedIcon sx={{ fontSize: 17, color: "var(--warning)" }} />
              <Typography fontSize={11.5} fontWeight={700} color="var(--warning)">
                Total changed by {order.total > order.originalTotal ? "+" : "−"}
                {inr(Math.abs(order.total - order.originalTotal))} — confirm with the customer
              </Typography>
            </Stack>
          )}
        </Stack>

        {order.history?.length > 0 && (
          <Stack gap={0.5}>
            <Typography fontSize={12.5} fontWeight={800} color="var(--text-color)">History</Typography>
            {order.history.map((h, i) => (
              <Typography key={i} fontSize={11.5} color="var(--text-color-secondary)">
                {new Date(h.at).toLocaleString("en-IN")} — {h.event}
              </Typography>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Sticky action bar: the one thing to do next, always reachable */}
      <Stack direction="row" gap={1} sx={{ p: 2, borderTop: "1px solid #eee", backgroundColor: "#fff" }}>
        {order.status !== "cancelled" && order.status !== "dispatched" && (
          <Button
            fullWidth
            disabled={busy || (order.status === "packing" && !allSettled)}
            onClick={() => onPatch({ status: next?.to })}
            sx={{
              textTransform: "none", fontWeight: 800, fontSize: 14.5, py: 1.15, borderRadius: "10px",
              color: "#fff", backgroundColor: "var(--primary-color)",
              "&:hover": { backgroundColor: "#e34100" },
              "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" },
            }}
          >
            {order.status === "packing" && !allSettled
              ? `${order.items.filter((i) => !(i.packed || (i.unavailable && !i.substitute))).length} lines left`
              : next?.label}
          </Button>
        )}
        {order.status !== "cancelled" && (
          <Button
            onClick={() => onPatch({ status: "cancelled" })}
            disabled={busy}
            sx={{
              textTransform: "none", fontWeight: 700, fontSize: 13, borderRadius: "10px",
              color: "#c92a2a", flexShrink: 0,
              "&:hover": { backgroundColor: "#ffeaea" },
            }}
          >
            Cancel
          </Button>
        )}
        {order.status === "cancelled" && (
          <Button
            fullWidth onClick={() => onPatch({ status: "new" })} disabled={busy}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", color: "var(--primary-color)", border: "1.5px solid var(--primary-color)" }}
          >
            Reopen order
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

const btn = {
  textTransform: "none", fontWeight: 700, fontSize: 12.5,
  borderRadius: "8px", py: 0.5,
  color: "var(--text-color)", border: "1px solid #ddd",
  "&:hover": { backgroundColor: "#f7f7f7", borderColor: "#ccc" },
};

function Row({ label, value, green }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography fontSize={12.5} fontWeight={green ? 700 : 600} color={green ? "#1d9b53" : "var(--text-color-secondary)"}>{label}</Typography>
      <Typography fontSize={12.5} fontWeight={green ? 800 : 600} color={green ? "#1d9b53" : "var(--text-color-secondary)"}>{value}</Typography>
    </Stack>
  );
}
