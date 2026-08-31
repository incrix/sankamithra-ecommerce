"use client";
import { Suspense } from "react";
import { Stack, CircularProgress } from "@mui/material";
import Orders from "../components/Orders";

export default function AdminOrdersPage() {
  return (
    // Orders reads ?tab= via useSearchParams, which needs a boundary.
    <Suspense
      fallback={
        <Stack alignItems="center" py={8}>
          <CircularProgress sx={{ color: "var(--primary-color)" }} />
        </Stack>
      }
    >
      <Orders />
    </Suspense>
  );
}
