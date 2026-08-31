"use client";
import { Stack, Typography, TextField, Button, Alert, Box } from "@mui/material";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { useState } from "react";

export default function LoginGate({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onSuccess();
      else setError(data.error || "Could not sign in");
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "70vh", px: 2 }}>
      <Stack
        component="form"
        onSubmit={submit}
        gap={2}
        sx={{
          width: "100%", maxWidth: 380, p: { xs: 3, md: 4 },
          border: "1px solid #ededed", borderRadius: "16px", backgroundColor: "#fff",
        }}
      >
        <Stack alignItems="center" gap={1}>
          <Box sx={{ width: 46, height: 46, borderRadius: "50%", display: "grid", placeItems: "center", backgroundColor: "#fff1ea" }}>
            <LockRoundedIcon sx={{ color: "var(--primary-color)" }} />
          </Box>
          <Typography fontSize={19} fontWeight={800} color="var(--text-color)">Admin panel</Typography>
          <Typography fontSize={12.5} color="var(--text-color-secondary)" textAlign="center">
            Sankamithra Thunder World — order management
          </Typography>
        </Stack>

        {error && <Alert severity="error" sx={{ fontSize: 12.5 }}>{error}</Alert>}

        <TextField
          type="password"
          label="Password"
          size="small"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
        />

        <Button
          type="submit"
          disabled={busy || !password}
          sx={{
            textTransform: "none", fontWeight: 800, py: 1.15, borderRadius: "10px",
            color: "#fff", backgroundColor: "var(--primary-color)",
            "&:hover": { backgroundColor: "#e34100" },
            "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" },
          }}
        >
          {busy ? "Checking..." : "Sign in"}
        </Button>
      </Stack>
    </Stack>
  );
}
