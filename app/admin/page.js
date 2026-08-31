"use client";
import { Box, Stack, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import Dashboard from "./components/Dashboard";
import { useAdmin } from "./AdminContext";

export default function AdminDashboardPage() {
  const { orders, loading } = useAdmin();
  const router = useRouter();

  if (loading) {
    return <Stack alignItems="center" py={8}><CircularProgress sx={{ color: "var(--primary-color)" }} /></Stack>;
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: { md: "auto" }, pr: { md: 0.5 } }}>
      {/* A stat tile jumps straight to that filter, now a real URL. */}
      <Dashboard orders={orders} onJump={(tab) => router.push(`/admin/orders?tab=${tab}`)} />
    </Box>
  );
}
