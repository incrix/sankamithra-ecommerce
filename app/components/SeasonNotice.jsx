"use client";
import { useEffect, useState } from "react";
import { Dialog, Stack, Typography, Button, Box } from "@mui/material";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { DELIVERY_AREA, SALES_CLOSE, SALES_CLOSE_DATE } from "@/util/minimumOrder";

// Bumped when the notice changes, so customers who closed the old one see the new one.
const SEEN = "seasonNoticeSeen-lastDays";

/** Days left to order, counting today and the closing day. */
const daysLeft = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((SALES_CLOSE_DATE - today) / 86400000) + 1;
};

/**
 * The season's notice, shown once per visit when a customer opens the site:
 * how many days of sale are left, where we deliver, and when Diwali sales
 * close. Remembered for the browser session only, so a customer coming back
 * another day sees it again.
 */
export default function SeasonNotice() {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(0);

  useEffect(() => {
    setDays(daysLeft());
    try { if (!sessionStorage.getItem(SEEN)) setOpen(true); } catch { setOpen(true); }
  }, []);

  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem(SEEN, "1"); } catch {}
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
          Important notice · Diwali 2026
        </Typography>
      </Box>
      <Stack gap={2} sx={{ p: 3 }}>
        {days > 0 && point(
          TrendingUpRoundedIcon,
          days === 1 ? "Last day of sale!" : `Last ${days} days of sale!`,
          "Old and current prices may differ, and prices may rise. Please order your crackers as soon as possible.",
        )}
        {point(
          LocalShippingRoundedIcon,
          `Orders only for ${DELIVERY_AREA}`,
          "Orders for delivery to other states are closed. We are delivering only within Tamil Nadu and Puducherry.",
        )}
        {point(
          EventBusyRoundedIcon,
          `Diwali sales close on ${SALES_CLOSE}`,
          "Please place your order before then.",
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
          OK, continue shopping
        </Button>
      </Stack>
    </Dialog>
  );
}
