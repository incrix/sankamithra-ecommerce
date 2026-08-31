import { cookies } from "next/headers";
import { COOKIE } from "@/util/admin/jwt";

export const dynamic = "force-dynamic";

export async function POST() {
  // Clearing the cookie ends the session; the JWT also expires on its own.
  cookies().set({ name: COOKIE, value: "", path: "/", maxAge: 0 });
  return Response.json({ ok: true });
}
