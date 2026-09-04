"use client";
import { useEffect } from "react";
import Arrange from "../components/Arrange";
import { useAdmin } from "../AdminContext";

export default function AdminArrangePage() {
  const { catalogue, catLoading, loadCatalogue, notify } = useAdmin();
  useEffect(() => { if (!catalogue) loadCatalogue(); }, [catalogue, loadCatalogue]);
  return <Arrange catalogue={catalogue} loading={catLoading} onReload={loadCatalogue} onToast={notify} />;
}
