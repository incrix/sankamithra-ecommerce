"use client";
import { useEffect } from "react";
import Pricing from "../components/Pricing";
import { useAdmin } from "../AdminContext";

export default function AdminPricingPage() {
  const { catalogue, catLoading, loadCatalogue, notify } = useAdmin();
  useEffect(() => { if (!catalogue) loadCatalogue(); }, [catalogue, loadCatalogue]);
  return <Pricing catalogue={catalogue} loading={catLoading} onReload={loadCatalogue} onToast={notify} />;
}
