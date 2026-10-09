#!/usr/bin/env node
/**
 * Sets every product's stock to one figure.
 *
 *   node scripts/set-stock.mjs 10000           # show what would change
 *   node scripts/set-stock.mjs 10000 --write   # back up current stock, then set it
 *
 * Only countInStock is written, one SET per product, so nothing else on a
 * product - and no edit an admin makes at the same moment - is overwritten.
 * The backup lists every product's stock before the change, so it can be put
 * back by hand if needed.
 *
 * Reads credentials from .env.local, like the other scripts here.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import fs from "fs";

const WRITE = process.argv.includes("--write");
const value = Number(process.argv[2]);
if (!Number.isInteger(value) || value < 0) {
  console.error("Usage: node scripts/set-stock.mjs <whole number> [--write]");
  process.exit(1);
}

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY are not set in .env.local");
  process.exit(1);
}

const PREFIX = process.env.DYNAMO_TABLE_PREFIX;
if (!PREFIX) {
  // No default on purpose: two shops share the AWS account, and guessing the
  // prefix could set the other shop's stock.
  console.error("DYNAMO_TABLE_PREFIX is not set in .env.local");
  process.exit(1);
}
const TABLE = `${PREFIX}products`;

const db = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(), secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim() },
}));

const products = [];
let ExclusiveStartKey;
do {
  const page = await db.send(new ScanCommand({
    TableName: TABLE, ExclusiveStartKey,
    ProjectionExpression: "id, #n, countInStock", ExpressionAttributeNames: { "#n": "name" },
  }));
  products.push(...(page.Items || []));
  ExclusiveStartKey = page.LastEvaluatedKey;
} while (ExclusiveStartKey);

products.sort((a, b) => a.id - b.id);
const changing = products.filter((p) => Number(p.countInStock) !== value);
console.log(`${TABLE}: ${products.length} products, ${changing.length} not already at ${value}`);
const zero = products.filter((p) => !(Number(p.countInStock) > 0)).length;
console.log(`currently out of stock: ${zero}`);

if (!WRITE) {
  console.log("Dry run. Add --write to back up and apply.");
  process.exit(0);
}

const backup = `_backup-stock-${PREFIX.replace(/_$/, "")}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
fs.writeFileSync(backup, JSON.stringify(products, null, 2));
console.log(`backed up current stock to ${backup}`);

let done = 0;
for (const p of changing) {
  await db.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id: p.id },
    UpdateExpression: "SET countInStock = :v",
    ConditionExpression: "attribute_exists(id)",
    ExpressionAttributeValues: { ":v": value },
  }));
  done++;
}
console.log(`set ${done} products to ${value}`);
