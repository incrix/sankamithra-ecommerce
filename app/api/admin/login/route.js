import { cookies, headers } from "next/headers";
import {
  verifyPassword, configProblem, loginThrottle, recordFailure, clearFailures,
} from "@/util/admin/auth";
import { signAdminToken, cookieOptions, COOKIE, TOKEN_TTL_SECONDS } from "@/util/admin/jwt";

export const dynamic = "force-dynamic";

/** Exchanges the admin password for a signed, httpOnly JWT session cookie. */
export async function POST(request) {
  const problem = configProblem();
  if (problem) return Response.json({ error: problem }, { status: 503 });

  // Throttle per client address. Behind a proxy this is the forwarded address.
  const h = headers();
  const key =
    (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "local";

  const throttle = loginThrottle(key);
  if (throttle.blocked) {
    return Response.json(
      { error: `Too many failed attempts. Try again in ${Math.ceil(throttle.retryInSeconds / 60)} minutes.` },
      { status: 429 }
    );
  }

  const { password } = await request.json().catch(() => ({}));

  if (!verifyPassword(password)) {
    recordFailure(key);
    // Constant-ish delay so a wrong password is never faster than a right one.
    await new Promise((r) => setTimeout(r, 600));
    const left = loginThrottle(key).remaining;
    return Response.json(
      { error: left > 0 ? `Incorrect password. ${left} attempts left.` : "Incorrect password." },
      { status: 401 }
    );
  }

  clearFailures(key);
  const token = await signAdminToken({ subject: "admin" });
  cookies().set({ name: COOKIE, value: token, ...cookieOptions() });

  return Response.json({ ok: true, expiresIn: TOKEN_TTL_SECONDS });
}
