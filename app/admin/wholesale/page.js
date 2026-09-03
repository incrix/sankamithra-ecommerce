"use client";
import { useEffect } from "react";
import Wholesale from "../components/Wholesale";
import { useAdmin } from "../AdminContext";

export default function AdminWholesalePage() {
  const { catalogue, catLoading, loadCatalogue, notify } = useAdmin();
  useEffect(() => { if (!catalogue) loadCatalogue(); }, [catalogue, loadCatalogue]);
  return <Wholesale catalogue={catalogue} loading={catLoading} onReload={loadCatalogue} onToast={notify} />;
}
