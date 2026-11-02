"use client";
import { useEffect, useState } from "react";
import { DEFAULT_SALES } from "@/util/minimumOrder";

/**
 * Whether online sales are on and the delivery points, or null while loading.
 *
 * Falls back to the defaults if the read fails. That only steers the screen:
 * the order route checks the real setting, and says why if it refuses.
 */
export function useSales() {
  const [sales, setSales] = useState(null);

  useEffect(() => {
    let live = true;
    fetch("/api/sales")
      .then((r) => (r.ok ? r.json() : DEFAULT_SALES))
      .catch(() => DEFAULT_SALES)
      .then((s) => { if (live) setSales(s); });
    return () => { live = false; };
  }, []);

  return sales;
}
