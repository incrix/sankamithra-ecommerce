import { NextResponse } from "next/server";
import { COOKIE, verifyAdminToken } from "@/util/admin/jwt";

/**
 * Verifies the admin JWT at the edge, before a request reaches any route
 * handler. Each handler still calls requireAdmin() - defence in depth, so a
 * route added later is not left open if it is missed here.
 *
 * The /admin page itself is deliberately NOT blocked: it renders its own login
 * form and asks the API for session state.
 */

const PROTECTED = [
  // POST /api/orders is how a customer places an order - it must stay public.
  // Everything else about orders (reading them, changing them) is admin only.
  { path: "/api/orders", methods: ["GET", "PATCH", "DELETE", "PUT"] },
  { path: "/api/categories", methods: null },
  { path: "/api/products", methods: ["POST", "PATCH", "DELETE", "PUT"] }, // GET is the public catalogue
];

/**
 * Sub-paths under /api/orders are admin-only regardless of method: a customer
 * only ever POSTs to the collection itself.
 */
const ADMIN_ONLY_SUBPATHS = ["/api/orders/"];

function needsAuth(pathname, method) {
  if (ADMIN_ONLY_SUBPATHS.some((p) => pathname.startsWith(p))) return true;
  for (const rule of PROTECTED) {
    if (pathname === rule.path) {
      if (!rule.methods || rule.methods.includes(method)) return true;
    }
  }
  return false;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  // The admin's own catalogue view asks for everything, including hidden items.
  const wantsAll = request.nextUrl.searchParams.get("all") === "1";
  const guard = needsAuth(pathname, method) || (pathname === "/api/products" && wantsAll);
  if (!guard) return NextResponse.next();

  const token = request.cookies.get(COOKIE)?.value;
  const session = await verifyAdminToken(token).catch(() => null);

  if (!session) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  // Hands the verified subject to the route, so handlers never re-parse the JWT.
  const headers = new Headers(request.headers);
  headers.set("x-admin-subject", String(session.sub || "admin"));
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/api/orders/:path*", "/api/products/:path*", "/api/categories/:path*"],
};
