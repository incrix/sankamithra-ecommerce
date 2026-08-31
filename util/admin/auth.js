import crypto from "crypto";
import { cookies } from "next/headers";
import { COOKIE, verifyAdminToken, isJwtConfigured } from "./jwt";

/**
 * Admin authentication.
 *
 * A single operator account behind a password, exchanged for a signed JWT
 * session. Two things are deliberately hardened over a plain string compare:
 *
 *  - the password is verified against a scrypt hash when ADMIN_PASSWORD_HASH is
 *    set, so the deployed environment never holds the password in the clear;
 *  - comparisons are constant-time, so a wrong password cannot be recovered by
 *    measuring how long the check takes.
 *
 * SCOPE: still one shared credential with no per-user accounts or audit trail.
 * Fine for a shop owner on a private link; add real accounts before exposing
 * this more widely.
 */

const HASH = () => process.env.ADMIN_PASSWORD_HASH || "";
const PLAIN = () => process.env.ADMIN_PASSWORD || "";

export const isConfigured = () => Boolean((HASH() || PLAIN()) && isJwtConfigured());

/** Reports what is missing, so a misconfigured deploy fails loudly not silently. */
export function configProblem() {
  if (!isJwtConfigured()) return "ADMIN_JWT_SECRET is missing or shorter than 32 characters";
  if (!HASH() && !PLAIN()) return "ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD) is not set";
  return null;
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  // Compare digests, so differing lengths don't leak through an early return.
  const ha = crypto.createHash("sha256").update(ba).digest();
  const hb = crypto.createHash("sha256").update(bb).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Hash format: scrypt:<saltHex>:<keyHex>
 *
 * Colon-separated, not "$"-separated as scrypt conventionally is: dotenv treats
 * `$name` in a .env value as variable expansion, so a `$` in the hash silently
 * truncated it to "scrypt" and every login failed.
 */
export function hashPassword(password, salt = crypto.randomBytes(16)) {
  const key = crypto.scryptSync(String(password), salt, 64);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

export function verifyPassword(input) {
  const stored = HASH();
  if (stored) {
    const [scheme, saltHex, keyHex] = stored.split(":");
    if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
    try {
      const derived = crypto.scryptSync(String(input || ""), Buffer.from(saltHex, "hex"), 64);
      return crypto.timingSafeEqual(derived, Buffer.from(keyHex, "hex"));
    } catch {
      return false;
    }
  }
  // Development fallback: a plaintext password in .env.local.
  const plain = PLAIN();
  return plain ? timingSafeEqual(input || "", plain) : false;
}

/* ------------------------------------------------------------ rate limiting */

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

/**
 * Blunt in-memory throttle on failed logins. Resets on restart and is per
 * instance - enough to stop opportunistic guessing of a shared password, not a
 * substitute for a real rate limiter at the edge.
 */
export function loginThrottle(key) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) {
    return { blocked: false, remaining: MAX_ATTEMPTS };
  }
  return {
    blocked: rec.count >= MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - rec.count),
    retryInSeconds: Math.ceil((rec.first + WINDOW_MS - now) / 1000),
  };
}

export function recordFailure(key) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) attempts.set(key, { first: now, count: 1 });
  else rec.count += 1;
}

export function clearFailures(key) {
  attempts.delete(key);
}

/* ----------------------------------------------------------------- sessions */

/** The verified JWT payload for this request, or null. */
export async function getSession() {
  if (!isConfigured()) return null;
  return verifyAdminToken(cookies().get(COOKIE)?.value);
}

export async function isAuthed() {
  return Boolean(await getSession());
}

/** Guard for admin API routes. Returns a Response to bail out with, or null. */
export async function requireAdmin() {
  const problem = configProblem();
  if (problem) return Response.json({ error: problem }, { status: 503 });
  if (!(await isAuthed())) {
    return Response.json({ error: "Not authorised" }, { status: 401 });
  }
  return null;
}
