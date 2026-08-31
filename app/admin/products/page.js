"use client";
import { useEffect } from "react";
import Products from "../components/Products";
import { useAdmin } from "../AdminContext";

export default function AdminProductsPage() {
  const { catalogue, catLoading, loadCatalogue, notify } = useAdmin();

  // Fetched on first visit to a catalogue route, then shared between them.
  useEffect(() => { if (!catalogue) loadCatalogue(); }, [catalogue, loadCatalogue]);

  return (
    <Products catalogue={catalogue} loading={catLoading} onReload={loadCatalogue} onToast={notify} />
  );
}
