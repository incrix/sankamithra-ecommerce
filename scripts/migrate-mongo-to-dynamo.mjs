#!/usr/bin/env node
/**
 * One-way migration: MongoDB -> DynamoDB.
 *
 *   node scripts/migrate-mongo-to-dynamo.mjs           # dry run, counts only
 *   node scripts/migrate-mongo-to-dynamo.mjs --write   # actually copy
 *   node scripts/migrate-mongo-to-dynamo.mjs --verify  # compare both sides
 *
 * Mongo is only ever read. Nothing here writes to it, so a failed run costs
 * nothing but a retry, and the old cluster stays a working fallback until it is
 * deliberately torn down.
 *
 * Holds its own Mongo client rather than importing the app's, so the app can be
 * moved onto DynamoDB first and this still runs afterwards.
 */
import { MongoClient } from "mongodb";
import fs from "fs";

const WRITE = process.argv.includes("--write");
const VERIFY = process.argv.includes("--verify");

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const { TABLE, putItem, batchWrite, scanAll } = await import("../util/db/dynamo.js");
const { putMedia, statMedia, isMediaConfigured } = await import("../util/db/media.js");

const URI = process.env.MONGODB_URI;
const DB = process.env.MONGODB_DB || "sankamithra";
if (!URI) { console.error("MONGODB_URI is not set — nothing to migrate from"); process.exit(1); }

/**
 * How each collection is keyed on the way across.
 *
 * Mongo's _id is dropped: it is a driver artefact, and every one of these
 * already carries its own real key. `settings` is the exception worth reading
 * twice - the app wrote it under two different conventions (`{key}` from
 * settingsStore, `{_id:"categories"}` from productsStore), and both have to
 * land on the single `key` attribute the new table uses.
 */
const PLAN = {
  products:  { table: TABLE.products,  key: (d) => ({ ...strip(d), id: Number(d.id) }) },
  orders:    { table: TABLE.orders,    key: (d) => ({ ...strip(d), id: String(d.id) }) },
  wholesale: { table: TABLE.wholesale, key: (d) => ({ ...strip(d), code: String(d.code) }) },
  settings:  { table: TABLE.settings,  key: (d) => ({ ...strip(d), key: String(d.key ?? d._id) }) },
  counters:  { table: TABLE.counters,  key: (d) => ({ name: String(d._id ?? d.name), seq: Number(d.seq) || 0 }) },
};

const strip = ({ _id, ...rest }) => rest;

/** Dynamo rejects undefined and empty-string keys; normalise before writing. */
function clean(o) {
  if (Array.isArray(o)) return o.map(clean);
  if (o && typeof o === "object") {
    const out = {};
    for (const [k, v] of Object.entries(o)) {
      if (v === undefined) continue;
      out[k] = clean(v);
    }
    return out;
  }
  return o;
}

const mc = new MongoClient(URI);
await mc.connect();
const db = mc.db(DB);

console.log(`${VERIFY ? "VERIFY" : WRITE ? "WRITING" : "DRY RUN"}: ${DB} -> DynamoDB (${process.env.AWS_REGION || "ap-south-1"})\n`);

let issues = 0;

for (const [coll, spec] of Object.entries(PLAN)) {
  const docs = await db.collection(coll).find({}).toArray();
  const items = docs.map((d) => clean(spec.key(d)));

  if (VERIFY) {
    const there = await scanAll(spec.table);
    // Claim rows are created by the app, never by this migration, so they are
    // not expected on the Mongo side and must not count as a mismatch.
    const real = there.filter((i) => !String(i.id ?? "").startsWith("claim#"));
    const match = real.length === items.length;
    if (!match) issues++;
    console.log(`  ${coll.padEnd(12)} mongo ${String(items.length).padStart(4)}  dynamo ${String(real.length).padStart(4)}  ${match ? "ok" : "MISMATCH"}`);
    continue;
  }

  if (WRITE && items.length) {
    // counters is one tiny row and must not be clobbered by a partial batch.
    if (coll === "counters") for (const it of items) await putItem(spec.table, it);
    else await batchWrite(spec.table, items);
  }
  console.log(`  ${coll.padEnd(12)} ${String(items.length).padStart(4)} docs  ${WRITE ? "written" : "would write"}`);
}

/**
 * Documents go to S3, not DynamoDB.
 *
 * They are binary and routinely megabytes; a DynamoDB item stops at 400 KB, so
 * this is not a tuning question - the price list simply does not fit. Copied
 * one at a time because each is large enough that batching buys nothing.
 */
{
  const docs = await db.collection("media").find({}).toArray();
  if (!docs.length) {
    console.log(`  ${"media".padEnd(12)}    0 docs  (nothing stored)`);
  } else if (!isMediaConfigured()) {
    issues++;
    console.log(`  ${"media".padEnd(12)} ${String(docs.length).padStart(4)} docs  SKIPPED - S3_MEDIA_BUCKET is not set`);
  } else {
    for (const d of docs) {
      const mb = (Number(d.size || 0) / 1024 / 1024).toFixed(2);
      if (VERIFY) {
        const there = await statMedia(d.name);
        if (!there) issues++;
        console.log(`  ${"media".padEnd(12)} ${String(d.name).slice(0, 28).padEnd(30)} ${mb} MB  ${there ? "ok" : "MISSING"}`);
      } else if (WRITE) {
        await putMedia({ name: d.name, contentType: d.contentType, bytes: Buffer.from(d.data.buffer ?? d.data) });
        console.log(`  ${"media".padEnd(12)} ${String(d.name).slice(0, 28).padEnd(30)} ${mb} MB  -> S3`);
      } else {
        console.log(`  ${"media".padEnd(12)} ${String(d.name).slice(0, 28).padEnd(30)} ${mb} MB  would copy to S3`);
      }
    }
  }
}

/**
 * The order sequence must never hand out a number twice.
 *
 * If counters was missing or behind - it is written by the app, not by hand,
 * and an older deployment may never have created it - the next bill would reuse
 * a reference that already belongs to a real order. Seed it past the highest
 * reference actually present.
 */
if (WRITE || VERIFY) {
  const orders = await db.collection("orders").find({}, { projection: { ref: 1 } }).toArray();
  const highest = orders.reduce((a, o) => Math.max(a, Number(String(o.ref || "").split("-")[1]) || 0), 0);
  const counter = (await scanAll(TABLE.counters)).find((c) => c.name === "orderRef");
  const seq = Number(counter?.seq ?? 0);

  if (seq < highest) {
    issues++;
    console.log(`\n  order sequence is ${seq}, but ${highest} references already exist`);
    if (WRITE) {
      await putItem(TABLE.counters, { name: "orderRef", seq: highest });
      console.log(`  -> set orderRef to ${highest}; the next bill will be ${String(highest + 1).padStart(4, "0")}`);
    } else {
      console.log(`  -> would set orderRef to ${highest}`);
    }
  } else {
    console.log(`\n  order sequence ${seq} is at or past the highest reference (${highest}) — ok`);
  }
}

await mc.close();

if (VERIFY) {
  console.log(issues ? `\n${issues} problem(s) — do not switch over yet.` : "\nEverything matches.");
  process.exit(issues ? 1 : 0);
}
if (!WRITE) console.log("\nRe-run with --write to copy, then --verify to check.");
