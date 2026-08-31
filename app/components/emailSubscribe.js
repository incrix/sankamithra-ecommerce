"use client";
import { Stack, Box, Typography, InputBase, Button, Snackbar, Alert } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useState } from "react";

/**
 * Newsletter strip. Kept as a shared component (home and cart both use it),
 * rebuilt on the design tokens with real validation and feedback - the previous
 * version accepted anything and gave no confirmation.
 */
export default function EmailSubscribe() {
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setToast({ msg: "Please enter a valid email address", severity: "error" });
      return;
    }
    setToast({ msg: "Thanks — we'll let you know about new offers.", severity: "success" });
    setEmail("");
  };

  return (
    <>
      <Stack
        component="form"
        onSubmit={submit}
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        gap={{ xs: 2, md: 4 }}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(120deg, #2a1a14 0%, #4a1f0d 60%, #7a2d0a 100%)",
          overflow: "hidden",
        }}
      >
        <Stack gap={0.5} minWidth={0}>
          <Typography fontSize={{ xs: 18, md: 23 }} fontWeight={800} color="#fff" lineHeight={1.25}>
            Get the new season&apos;s offers first
          </Typography>
          <Typography fontSize={{ xs: 13, md: 14 }} color="rgba(255,255,255,0.72)">
            Price drops and new arrivals, a few times a year. No spam.
          </Typography>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{
            backgroundColor: "#fff",
            borderRadius: "var(--radius-pill)",
            p: 0.6, pl: 2.25,
            width: { xs: "100%", md: 420 },
            flexShrink: 0,
          }}
        >
          <InputBase
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            type="email"
            inputProps={{ "aria-label": "email address" }}
            sx={{ flex: 1, fontSize: 14, fontWeight: 600, minWidth: 0 }}
          />
          <Button
            type="submit"
            endIcon={<SendRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none", fontWeight: 800, fontSize: 13.5,
              px: 2.25, py: 1, borderRadius: "var(--radius-pill)", flexShrink: 0,
              color: "#fff", backgroundColor: "var(--primary-color)",
              "&:hover": { backgroundColor: "var(--primary-dark)" },
            }}
          >
            Subscribe
          </Button>
        </Stack>
      </Stack>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast?.severity || "success"} variant="filled" sx={{ fontWeight: 700 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
