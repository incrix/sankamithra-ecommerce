"use client";
import { useEffect, useState } from "react";
import { Dialog, Stack, Typography, Button, Box } from "@mui/material";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import { activePoints, deliveryAreaText } from "@/util/minimumOrder";
import { useSales } from "@/app/components/commerce/useSales";

// Bumped when the notice changes, so customers who closed the old one see the new one.
const SEEN = "seasonNoticeSeen-lastDays";
// Its own key, so customers who closed the last-days notice still see that sales have closed.
const SEEN_CLOSED = "seasonNoticeSeen-closed";

/**
 * The season's notice, shown once per visit when a customer opens the site:
 * where we deliver, or that online sales are closed. Remembered for the browser session only, so a customer coming back
 * another day sees it again.
 */
export default function SeasonNotice() {
  const [open, setOpen] = useState(false);
  const sales = useSales();
  const closed = Boolean(sales) && !sales.open;

  useEffect(() => {
    if (!sales) return;
    try { if (!sessionStorage.getItem(closed ? SEEN_CLOSED : SEEN)) setOpen(true); } catch { setOpen(true); }
  }, [sales, closed]);

  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem(closed ? SEEN_CLOSED : SEEN, "1"); } catch {}
  };

  const point = (Icon, title, text) => (
    <Stack direction="row" gap={1.5} alignItems="flex-start">
      <Box sx={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", backgroundColor: "var(--primary-soft)" }}>
        <Icon sx={{ fontSize: 20, color: "var(--primary-color)" }} />
      </Box>
      <Stack gap={0.25}>
        <Typography fontSize={14.5} fontWeight={800} color="var(--text-color)">{title}</Typography>
        <Typography fontSize={13} lineHeight={1.55} color="var(--text-color-secondary)">{text}</Typography>
      </Stack>
    </Stack>
  );

  return (
    <Dialog
      open={open}
      onClose={close}
      aria-labelledby="season-notice-title"
      PaperProps={{ sx: { borderRadius: "16px", m: 2, maxWidth: 440, width: "calc(100% - 32px)" } }}
    >
      <Box sx={{ backgroundColor: "var(--primary-color)", px: 3, py: 2 }}>
        <Typography id="season-notice-title" fontSize={18} fontWeight={800} color="#fff">
          {closed ? "Online sales closed · Diwali 2026" : "Important notice · Diwali 2026"}
        </Typography>
      </Box>
      <Stack gap={2} sx={{ p: 3 }}>
        {closed && point(
          StorefrontRoundedIcon,
          "Online orders are closed",
          "Thank you for shopping with us this Diwali. Our shop counter is open as usual - please visit us to buy.",
        )}
        {!closed && point(
          LocalShippingRoundedIcon,
          "Orders only for selected places",
          `Online orders for other places are closed. We are delivering only to ${deliveryAreaText(activePoints(sales))}.`,
        )}
        <Button
          onClick={close}
          autoFocus
          sx={{
            mt: 0.5, textTransform: "none", fontWeight: 800, fontSize: 15,
            py: 1.2, borderRadius: "10px",
            color: "#fff", backgroundColor: "var(--primary-color)",
            "&:hover": { backgroundColor: "var(--primary-color)", filter: "brightness(0.92)" },
          }}
        >
          {closed ? "OK" : "OK, continue shopping"}
        </Button>
      </Stack>
    </Dialog>
  );
}
