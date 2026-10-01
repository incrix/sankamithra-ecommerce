#!/usr/bin/env node
/**
 * Adds the combo packs to the catalogue, built from the bills they were made up on.
 *
 *   node scripts/add-combos.mjs           # dry run: prints what would be added
 *   node scripts/add-combos.mjs --write   # actually add them
 *
 * The packs were first assembled at the counter as ordinary bills, with the
 * pack's name typed into the customer field ("3000 combo"). Those bills are the
 * only record of what goes in each box, so the contents are read from them
 * rather than retyped.
 *
 * Safe to re-run: a pack whose SKU is already in the catalogue is skipped, so
 * a second run never duplicates it or overwrites edits made since in the admin.
 */
import fs from "fs";

const WRITE = process.argv.includes("--write");

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const { TABLE, getItem, putItem, scanAll, isDbConfigured } = await import("../util/db/dynamo.js");
if (!isDbConfigured()) { console.error("AWS credentials are not set — nothing to write to"); process.exit(1); }

/** Which bill holds each pack, and the round price the pack sells at. */
const PACKS = [
  { ref: "STW-0058", pack: 3000 },
  { ref: "STW-0039", pack: 5000 },
  { ref: "STW-0068", pack: 10000 },
];
const CATEGORY = "Combo";

const [orders, products] = await Promise.all([scanAll(TABLE.orders), scanAll(TABLE.products)]);
const byId = new Map(products.map((p) => [Number(p.id), p]));

// Priced at the shop's own discount so the pack reads like everything else on
// the site - "80% off" - and the MRP is whatever makes that land exactly on
// the pack price: ₹15,000 at 80% off is ₹3,000.
const counts = new Map();
products.forEach((p) => counts.set(p.discount, (counts.get(p.discount) || 0) + 1));
const DISCOUNT = Number([...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]) || 0;

// Ahead of everything else, so the packs open the shop.
const firstSlot = Math.min(...products.map((p) => (p.sortOrder == null ? Infinity : p.sortOrder)), 1);
let nextId = products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;

const added = [];
for (const [i, { ref, pack }] of PACKS.entries()) {
  const sku = `COMBO-${pack}`;
  if (products.some((p) => p.sku === sku)) { console.log(`${sku}: already in the catalogue, skipped`); continue; }

  const order = orders.find((o) => o.ref === ref);
  if (!order) { console.error(`${ref}: bill not found, ${sku} skipped`); continue; }
  if (!/combo/i.test(order.customer?.name || "")) {
    console.error(`${ref}: is billed to "${order.customer?.name}", not a combo — ${sku} skipped`);
    continue;
  }

  // What actually went in the box: a replacement stands in for the line it
  // replaced, and a line the packer could not supply is not part of the pack.
  const merged = new Map();
  for (const it of order.items || []) {
    const src = it.substitute || (it.unavailable ? null : it);
    if (!src || !(src.count > 0)) continue;
    const id = Number(src.id);
    const prev = merged.get(id);
    merged.set(id, { id, name: byId.get(id)?.name || src.name, count: (prev?.count || 0) + src.count });
  }
  // In price-list order, so the box reads the way the shop's list does.
  const contents = [...merged.values()].sort((a, b) =>
    (byId.get(a.id)?.sortOrder ?? 9999) - (byId.get(b.id)?.sortOrder ?? 9999));

  const units = contents.reduce((n, c) => n + c.count, 0);
  const price = Math.round((pack * 100) / (100 - DISCOUNT));
  const net = Math.round(price - (price * DISCOUNT) / 100);
  if (net !== pack) console.warn(`${sku}: sells at ₹${net}, not ₹${pack}, at ${DISCOUNT}% off — check the MRP after adding`);

  added.push({
    id: nextId++,
    name: `Combo ${pack}`,
    category: CATEGORY,
    price,
    discount: DISCOUNT,
    // The counter bills the pack at its round price too; Pricelist 2 carries
    // no product discount, so its MRP is the price.
    mrp2: pack,
    sortOrder: firstSlot - PACKS.length + i,
    plSection: "",
    wsBoxRate: null,
    wsCase: null,
    wsStock: null,
    countInStock: 0,
    image: [],
    brand: "Sankamithra",
    type: "Fireworks",
    sku,
    shortDescription: `${units} crackers across ${contents.length} varieties, packed in one box — a ready-made Diwali assortment for ₹${pack.toLocaleString("en-IN")}.`,
    description: `The ₹${pack.toLocaleString("en-IN")} combo pack from Sankamithra Thunder World, Sivakasi: ${contents.map((c) => `${c.name} × ${c.count}`).join(", ")}.`,
    contents,
    active: true,
  });
}

for (const p of added) {
  console.log(`\n${p.name}  (id ${p.id}, ${p.sku})  MRP ₹${p.price} at ${p.discount}% off -> ₹${Math.round(p.price - (p.price * p.discount) / 100)} · counter ₹${p.mrp2}`);
  console.log(`  ${p.contents.reduce((n, c) => n + c.count, 0)} pieces, ${p.contents.length} varieties`);
  for (const c of p.contents) console.log(`    ${String(c.count).padStart(2)} × ${c.name}`);
}

if (!WRITE) {
  console.log(`\nDry run — ${added.length} pack(s) would be added. Re-run with --write to add them.`);
  process.exit(0);
}

for (const p of added) await putItem(TABLE.products, p);

// The category list is the shop's arrangement; the packs go first.
const row = (await getItem(TABLE.settings, "categories")) || { key: "categories", values: [] };
const values = [CATEGORY, ...(row.values || []).filter((v) => v !== CATEGORY)];
await putItem(TABLE.settings, { key: "categories", values, updatedAt: new Date().toISOString() });

console.log(`\nAdded ${added.length} pack(s); "${CATEGORY}" is now the first category.`);
