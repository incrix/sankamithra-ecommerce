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
        {/* Diwali sales has been closed. Thank you for your support. */}

        <strong>Diwali 2025 Sale LIVE – Up to 90% OFF!</strong>
      </Typography>
    </Stack>
  );
}
