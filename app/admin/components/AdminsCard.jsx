"use client";
import { useState } from "react";
import { Stack, Typography, Button, TextField, Chip, CircularProgress } from "@mui/material";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import { panel } from "./RevenueChart";
import { useAdmin } from "../AdminContext";

/**
 * The team who call customers to confirm orders. These names fill the
 * "Taken by" dropdown on every order. Saved as soon as a name is added or
 * removed - there is nothing else on the card to wait for.
 */
export default function AdminsCard() {
  const { admins, setAdmins } = useAdmin();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function save(list) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admins: list }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setAdmins(data.admins);
      return true;
    } catch (err) {
      setMsg(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const add = async () => {
    const n = name.trim();
    if (!n) return;
    if (admins.some((a) => a.toLowerCase() === n.toLowerCase())) { setName(""); return; }
    if (await save([...admins, n])) setName("");
  };

  return (
    <Stack gap={1.5} sx={panel}>
      <Stack>
        <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Admins</Typography>
        <Typography fontSize={12.5} color="var(--text-color-secondary)">
          The people who take orders. Pick one in each order&apos;s &quot;Taken by&quot; so nobody calls the same customer twice.
        </Typography>
      </Stack>

      <Stack direction="row" gap={0.75} flexWrap="wrap">
        {admins.length === 0 && (
          <Typography fontSize={12.5} color="var(--text-color-trinary)">No admins added yet</Typography>
        )}
        {admins.map((a) => (
          <Chip
            key={a}
            label={a}
            onDelete={busy ? undefined : () => save(admins.filter((x) => x !== a))}
            sx={{ fontWeight: 700, fontSize: 13, border: "1px solid var(--border)", backgroundColor: "#fff" }}
          />
        ))}
      </Stack>

      <Stack direction="row" gap={1}>
        <TextField
          size="small"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 40))}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          sx={{ flex: 1, maxWidth: 280 }}
        />
        <Button
          onClick={add}
          disabled={busy || !name.trim()}
          startIcon={busy ? <CircularProgress size={15} sx={{ color: "inherit" }} /> : <PersonAddAlt1RoundedIcon sx={{ fontSize: 17 }} />}
          sx={{
            textTransform: "none", fontWeight: 800, fontSize: 13, px: 2,
            borderRadius: "var(--radius-pill)", background: "var(--primary-color)", color: "#fff",
            "&:hover": { background: "var(--primary-color)", filter: "brightness(0.92)" },
            "&.Mui-disabled": { background: "var(--primary-color)", color: "#fff", opacity: 0.6 },
          }}
        >
          Add
        </Button>
      </Stack>

      {msg && <Typography fontSize={12.5} fontWeight={600} color="#c62828">{msg}</Typography>}
    </Stack>
  );
}
