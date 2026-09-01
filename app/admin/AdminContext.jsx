"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
/** Status changes that email the customer, and so need a current proforma. */
const NOTIFYING = ["packed", "dispatched", "cancelled"];

/**
 * Shared admin state.
 *
 * Each section is its own route now, so orders and the catalogue can't live in
 * a single page component any more. Holding them here — in a provider mounted
 * by the admin layout — means moving between Dashboard, Orders and Products
 * doesn't refetch everything, and the sign-in gate is evaluated once.
 */
const AdminContext = createContext(null);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
};

export function AdminProvider({ children }) {
  const [authed, setAuthed] = useState(null); // null = still checking
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const [catalogue, setCatalogue] = useState(null);
  const [catLoading, setCatLoading] = useState(false);

  const notify = useCallback((msg, severity = "success") => setToast({ msg, severity }), []);

  const loadOrders = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (res.status === 401 || res.status === 503) { setAuthed(false); return; }
      const data = await res.json();
      setOrders(data.orders || []);
      setStats(data.stats || null);
      setAuthed(true);
    } catch {
      notify("Could not load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const loadCatalogue = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await fetch("/api/products?all=1", { cache: "no-store" });
      if (res.ok) setCatalogue(await res.json());
      else if (res.status === 401) setAuthed(false);
    } catch {
      notify("Could not load the catalogue", "error");
    } finally {
      setCatLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Light polling so a counter screen stays current without a refresh.
  useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => loadOrders(true), 20000);
    return () => clearInterval(t);
  }, [authed, loadOrders]);

  const patchOrder = useCallback(async (id, body) => {
    setBusy(true);
    try {
      // Re-issue the proforma with the status mail, so a customer whose order
      // was substituted receives a document matching what actually ships —
      // built here because the PDF template only renders in the browser.
      let payload = body;
      if (NOTIFYING.includes(body.status)) {
        const order = orders.find((o) => o.id === id);
        if (order?.customer?.email) {
          try {
            // Imported on demand: @react-pdf/renderer is a large, browser-only
            // dependency, and pulling it in at module scope breaks the admin
            // layout's server render and bloats the initial bundle.
            const { buildProformaBase64 } = await import("@/util/proforma");
            payload = { ...body, invoice: await buildProformaBase64(order) };
          } catch (err) {
            console.error("could not attach the proforma:", err);
          }
        }
      }

      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const { order, mail } = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      if (body.status) {
        // Say whether the customer was actually told, not just that we saved it.
        if (mail?.sent) notify(`${order.ref} → ${body.status} · customer emailed`);
        else if (mail && !mail.sent) notify(`${order.ref} → ${body.status}, but the email failed: ${mail.error}`, "error");
        else notify(`${order.ref} → ${body.status}`);
      }
    } catch {
      notify("Update failed", "error");
    } finally {
      setBusy(false);
    }
  }, [notify, orders]);

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setOrders([]);
    setCatalogue(null);
  }, []);

  const value = {
    authed, setAuthed, orders, stats, loading, busy, toast, setToast, notify,
    catalogue, catLoading, loadOrders, loadCatalogue, patchOrder, logout,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
