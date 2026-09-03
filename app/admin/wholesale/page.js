"use client";
import Wholesale from "../components/Wholesale";
import { useAdmin } from "../AdminContext";

export default function AdminWholesalePage() {
  // The dealer list is its own collection, so this page loads its own data
  // rather than waiting on the shop catalogue.
  const { notify } = useAdmin();
  return <Wholesale onToast={notify} />;
}
