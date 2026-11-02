"use client";
import { Box } from "@mui/material";
import SalesCard from "../components/SalesCard";

export default function AdminSalesPage() {
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: { md: "auto" }, pr: { md: 0.5 }, pb: { md: 2 } }}>
      <SalesCard />
    </Box>
  );
}
