#!/usr/bin/env node
import crypto from "crypto";

/**
 * Generates the two values the admin login needs.
 *   node scripts/admin-secrets.mjs [password]
 */
const password = process.argv[2] || crypto.randomBytes(12).toString("base64url");
const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(password, salt, 64);

console.log("\nAdd these to .env.local:\n");
console.log(`ADMIN_JWT_SECRET=${crypto.randomBytes(48).toString("base64url")}`);
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${key.toString("hex")}`);
console.log(`\nSign in with this password:  ${password}`);
console.log("\nRemove ADMIN_PASSWORD once the hash is in place — the plaintext");
console.log("fallback exists only for local development.\n");
