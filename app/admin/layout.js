import { AdminProvider } from "./AdminContext";
import AdminShell from "./components/AdminShell";

export const metadata = {
  title: "Admin Console",
  // A management tool has no business in search results.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
