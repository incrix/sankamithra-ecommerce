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

        <strong>
          Diwali sales has been closed. Thank you for your support.
        </strong>
      </Typography>
    </Stack>
  );
}
