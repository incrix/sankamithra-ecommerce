import { Stack, Box, Typography } from "@mui/material";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";

/** The places the shop delivers to free of charge this season. */
export const FREE_DELIVERY_PLACES = ["Tirupur", "Dharapuram", "Coimbatore", "Palladam"];

/**
 * The free-delivery offer, at the top of the home page where every visitor
 * sees it before the catalogue. Remove it from ShopClient when the offer ends.
 */
export default function FreeDeliveryBanner() {
  const places = `${FREE_DELIVERY_PLACES.slice(0, -1).join(", ")} & ${FREE_DELIVERY_PLACES.at(-1)}`;
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={{ xs: 1.5, md: 2 }}
      role="note"
      sx={{
        mb: 1.5, px: { xs: 2, md: 2.5 }, py: { xs: 1.5, md: 1.75 },
        borderRadius: "12px", color: "#fff",
        background: "linear-gradient(100deg, #1d9b53 0%, #14713c 100%)",
        boxShadow: "0 6px 18px rgba(20, 113, 60, 0.22)",
      }}
    >
      <Box sx={{
        width: { xs: 42, md: 48 }, height: { xs: 42, md: 48 }, flexShrink: 0, borderRadius: "50%",
        display: "grid", placeItems: "center", backgroundColor: "rgba(255,255,255,0.18)",
      }}>
        <LocalShippingRoundedIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
      </Box>
      <Stack minWidth={0}>
        <Typography fontSize={{ xs: 11, md: 12 }} fontWeight={800} letterSpacing={1} sx={{ opacity: 0.9 }}>
          FREE DELIVERY
        </Typography>
        <Typography fontSize={{ xs: 15.5, md: 19 }} fontWeight={800} lineHeight={1.25}>
          {places}
        </Typography>
        <Typography fontSize={{ xs: 12, md: 13 }} fontWeight={600} sx={{ opacity: 0.9 }}>
          No delivery charge on your crackers order to these places.
        </Typography>
      </Stack>
    </Stack>
  );
}
