"use client";
import { useEffect } from "react";
import Categories from "../components/Categories";
import { useAdmin } from "../AdminContext";

export default function AdminCategoriesPage() {
  const { catalogue, loadCatalogue, notify } = useAdmin();

  useEffect(() => { if (!catalogue) loadCatalogue(); }, [catalogue, loadCatalogue]);

  return <Categories catalogue={catalogue} onReload={loadCatalogue} onToast={notify} />;
}
