import { Stack, Typography } from "@mui/material";

export default function AnnounceBar() {
  return (
    <Stack
      sx={{
        background: "var(--primary-color)",
        height: "38px",
      }}
    >
      <Typography
        variant="h6"
        fontSize={"14px"}
        textAlign={"center"}
        color={"#fff"}
        sx={{ m: 1 }}
      >
        Happy Diwali, up to 55% off all items. Only 3 days left
      </Typography>
    </Stack>
  );
}
