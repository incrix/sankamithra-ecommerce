#!/usr/bin/env node
/**
 * Creates the DynamoDB tables this app needs. Safe to run repeatedly.
 *
 *   node scripts/dynamo-setup.mjs           # show what exists and what is missing
 *   node scripts/dynamo-setup.mjs --write   # create whatever is missing
 *
 * On-demand billing throughout: the traffic is spiky (a Diwali rush against a
 * quiet rest of year) and the tables are tiny, so provisioned capacity would
 * mean either paying through the quiet months or throttling during the rush.
 *
 * Reads credentials from .env.local. Never takes them on the command line,
 * where they end up in shell history.
 */
import {
  DynamoDBClient, CreateTableCommand, DescribeTableCommand, ListTablesCommand,
  UpdateTimeToLiveCommand,
} from "@aws-sdk/client-dynamodb";
import { S3Client, CreateBucketCommand, HeadBucketCommand, PutPublicAccessBlockCommand } from "@aws-sdk/client-s3";
import fs from "fs";

const WRITE = process.argv.includes("--write");

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const REGION = process.env.AWS_REGION || "ap-south-1";
const PREFIX = process.env.DYNAMO_TABLE_PREFIX || "sankamithra_";

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY are not set in .env.local");
  process.exit(1);
}

/**
 * Partition key only, no sort keys and no secondary indexes.
 *
 * Every access pattern is either "fetch this one thing by its id" or "fetch all
 * of them" - there is no query that selects a subset, because at this size the
 * app filters and sorts the whole list in memory. An index would be a write
 * amplifier and a second thing to keep consistent, bought for nothing.
 */
const TABLES = [
  { name: "products",  key: "id",   type: "N", note: "the catalogue, ~145 items" },
  { name: "orders",    key: "id",   type: "S", note: "orders, plus claim#<clientRef> duplicate guards" },
  { name: "settings",  key: "key",  type: "S", note: "banner, categories, price list, wholesale slug" },
  { name: "media",     key: "name", type: "S", note: "uploaded documents" },
  { name: "wholesale", key: "code", type: "S", note: "dealer list, keyed by the printed list code" },
  { name: "counters",  key: "name", type: "S", note: "the order reference sequence" },
];

const db = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const exists = async (t) => {
  try { await db.send(new DescribeTableCommand({ TableName: t })); return true; }
  catch (e) { if (e.name === "ResourceNotFoundException") return false; throw e; }
};

console.log(`${WRITE ? "CREATING" : "DRY RUN"} — region ${REGION}, prefix "${PREFIX}"\n`);

let made = 0;
for (const t of TABLES) {
  const table = `${PREFIX}${t.name}`;
  const there = await exists(table);

  if (there) {
    console.log(`  ${table.padEnd(28)} exists`);
    continue;
  }
  if (!WRITE) {
    console.log(`  ${table.padEnd(28)} would create  (pk ${t.key}:${t.type})  — ${t.note}`);
    continue;
  }

  await db.send(new CreateTableCommand({
    TableName: table,
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [{ AttributeName: t.key, AttributeType: t.type }],
    KeySchema: [{ AttributeName: t.key, KeyType: "HASH" }],
    // Recovers the table to any second in the last 35 days. This holds real
    // orders and a live catalogue; the cost is negligible at this size and the
    // alternative is having nothing to restore from.
    PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
  }));
  console.log(`  ${table.padEnd(28)} created       (pk ${t.key}:${t.type})`);
  made++;
}

if (WRITE && made) {
  console.log("\nwaiting for tables to become ACTIVE…");
  for (const t of TABLES) {
    const table = `${PREFIX}${t.name}`;
    for (let i = 0; i < 60; i++) {
      const d = await db.send(new DescribeTableCommand({ TableName: table }));
      if (d.Table.TableStatus === "ACTIVE") break;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

/**
 * Duplicate-guard items are not orders and must not accumulate forever. They
 * matter only for as long as a till might retry a bill, so they expire.
 */
if (WRITE) {
  try {
    await db.send(new UpdateTimeToLiveCommand({
      TableName: `${PREFIX}orders`,
      TimeToLiveSpecification: { Enabled: true, AttributeName: "expiresAt" },
    }));
    console.log("  TTL enabled on orders.expiresAt (claim rows only; orders never set it)");
  } catch (e) {
    if (!/already/i.test(e.message)) console.log("  TTL:", e.message);
  }
}

/**
 * The media bucket.
 *
 * Documents cannot live in DynamoDB - an item is capped at 400 KB and the
 * price list is allowed 14 MB - so they go here instead. Kept private: nothing
 * is served straight from the bucket, the app reads objects and streams them.
 */
const BUCKET = process.env.S3_MEDIA_BUCKET;
if (BUCKET) {
  const s3 = new S3Client({ region: REGION, credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
  let there = true;
  try { await s3.send(new HeadBucketCommand({ Bucket: BUCKET })); }
  catch { there = false; }

  if (there) console.log(`\n  ${BUCKET.padEnd(28)} bucket exists`);
  else if (!WRITE) console.log(`\n  ${BUCKET.padEnd(28)} would create bucket`);
  else {
    await s3.send(new CreateBucketCommand({
      Bucket: BUCKET,
      // us-east-1 is the one region that must NOT be named in the constraint.
      ...(REGION === "us-east-1" ? {} : { CreateBucketConfiguration: { LocationConstraint: REGION } }),
    }));
    await s3.send(new PutPublicAccessBlockCommand({
      Bucket: BUCKET,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true, IgnorePublicAcls: true,
        BlockPublicPolicy: true, RestrictPublicBuckets: true,
      },
    }));
    console.log(`\n  ${BUCKET.padEnd(28)} bucket created (private)`);
  }
} else {
  console.log("\n  S3_MEDIA_BUCKET is not set - the price list and admin uploads will fail.");
}

const all = await db.send(new ListTablesCommand({}));
console.log(`\n${WRITE ? `created ${made}` : "dry run"} — tables now in ${REGION}:`);
console.log("  " + (all.TableNames.filter((n) => n.startsWith(PREFIX)).join("\n  ") || "(none)"));
if (!WRITE) console.log("\nRe-run with --write to create them.");
