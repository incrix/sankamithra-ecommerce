import { MongoClient } from "mongodb";

/**
 * MongoDB connection, shaped for serverless.
 *
 * On Vercel each invocation may reuse a warm container, so the client is cached
 * on globalThis. Without that, every request opens a new connection pool and
 * the cluster hits its connection limit under any real traffic.
 */

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "sankamithra";

export const isDbConfigured = () => Boolean(URI);

let cached = globalThis.__sankamithraMongo;
if (!cached) cached = globalThis.__sankamithraMongo = { conn: null, promise: null };

export async function getDb() {
  if (!URI) throw new Error("MONGODB_URI is not set");
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = new MongoClient(URI, {
      // Each serverless instance gets its own pool, and the free tier allows
      // 500 connections in total - so the pool is kept small deliberately.
      // 5 per instance leaves room for ~100 concurrent instances; a single
      // instance never handles enough parallel work to need more.
      maxPoolSize: 5,
      minPoolSize: 0,
      // The important one. Without it a pooled connection is held open for the
      // life of the process, so idle instances (and, locally, every dev server
      // and build worker) keep accumulating sockets until the cluster hits its
      // limit. Idle connections now hand themselves back after a minute.
      maxIdleTimeMS: 60_000,
      serverSelectionTimeoutMS: 8000,
      // Fail a request that cannot get a connection rather than let callers
      // queue up behind an exhausted pool.
      waitQueueTimeoutMS: 5000,
      retryWrites: true,
    })
      .connect()
      .then(async (client) => {
        const db = client.db(DB_NAME);
        await ensureIndexes(db);
        return { client, db };
      })
      .catch((err) => {
        // Clear the cached promise so the next request retries, rather than
        // permanently reusing a rejected connection.
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function collection(name) {
  const { db } = await getDb();
  return db.collection(name);
}

/** Indexes the queries actually rely on. Safe to run repeatedly. */
async function ensureIndexes(db) {
  await Promise.all([
    db.collection("orders").createIndex({ id: 1 }, { unique: true }),
    db.collection("orders").createIndex({ ref: 1 }, { unique: true }),
    db.collection("orders").createIndex({ createdAt: -1 }),
    db.collection("orders").createIndex({ status: 1 }),
    db.collection("products").createIndex({ id: 1 }, { unique: true }),
    db.collection("products").createIndex({ category: 1 }),
    db.collection("media").createIndex({ name: 1 }, { unique: true }),
  ]);
}

/** One-line health report for diagnostics. */
export async function dbDiagnostics() {
  if (!URI) return { ok: false, configured: false, error: "MONGODB_URI is not set" };
  try {
    const { db } = await getDb();
    const [orders, products, media] = await Promise.all([
      db.collection("orders").countDocuments(),
      db.collection("products").countDocuments(),
      db.collection("media").countDocuments(),
    ]);
    return { ok: true, configured: true, database: db.databaseName, counts: { orders, products, media } };
  } catch (err) {
    return { ok: false, configured: true, error: err.message };
  }
}
