import { SignJWT, jwtVerify } from "jose";

/**
 * JWT issuing and verification for the admin session.
 *
 * Edge-safe on purpose: this module uses only `jose` and Web Crypto, no Node
 * built-ins, so middleware.js can verify a token before a request ever reaches
 * a route handler.
 */

export const COOKIE = "sk_admin";
export const ISSUER = "sankamithra-admin";
export const AUDIENCE = "sankamithra-panel";

/** Session lifetime. Short enough to limit a stolen cookie, long enough for a shift. */
export const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours

/**
 * The signing key. A weak or missing secret makes every token forgeable, so we
 * refuse to sign rather than fall back to a default.
 */
function secretKey() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_JWT_SECRET is missing or too short (needs 32+ characters). Run: node scripts/admin-secrets.mjs"
    );
  }
  return new TextEncoder().encode(secret);
}

export function isJwtConfigured() {
  const s = process.env.ADMIN_JWT_SECRET;
  return Boolean(s && s.length >= 32);
}

/** Issues a signed session token. `jti` gives each session an id we can revoke. */
export async function signAdminToken({ subject = "admin", jti } = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(subject)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + TOKEN_TTL_SECONDS)
    .setJti(jti || crypto.randomUUID())
    .sign(secretKey());
}

/**
 * Verifies a token. Returns the payload, or null for anything invalid -
 * bad signature, wrong issuer/audience, expired, or not yet valid.
 * The algorithm is pinned so a token can't claim "alg": "none".
 */
export async function verifyAdminToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
      clockTolerance: 5,
    });
    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

/** Cookie options shared by login and refresh, so they can't drift apart. */
export const cookieOptions = () => ({
  httpOnly: true,          // unreadable from JavaScript, so XSS can't lift it
  sameSite: "strict",      // not sent on cross-site requests: CSRF protection
  path: "/",
  maxAge: TOKEN_TTL_SECONDS,
  secure: process.env.NODE_ENV === "production",
});
