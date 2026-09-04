import { collection, isDbConfigured } from "@/util/db/mongo";
import { PRODUCT_SEED_URL } from "@/util/config";
import * as fileStore from "./productsStore.file";

/**
 * Catalogue storage.
 *
 * MongoDB when MONGODB_URI is set, otherwise the JSON file store for local
 * development. On first run the products collection seeds itself from the
 * hosted catalogue, so a fresh deployment comes up with a full shop rather
 * than an empty one.
 */

const useDb = () => isDbConfigured();
const products = () => collection("products");
const settings = () => collection("settings");

const strip = ({ _id, ...rest }) => rest;

function normalise(p, id) {
  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    id: id ?? p.id,
    name: String(p.name || "").trim(),
    category: String(p.category || "Others").trim(),
    price: Math.max(0, num(p.price)),
    discount: Math.min(95, Math.max(0, num(p.discount))),
    // Pricelist 2: a second, lower MRP used only for counter billing. Null
    // until it is supplied, and counter billing falls back to `price`.
    mrp2: p.mrp2 == null || p.mrp2 === "" ? null : Math.max(0, num(p.mrp2)),
    // Position in the printed price list, so the website reads in the same
    // order as the sheet the shop hands over the counter. Items not on the
    // list sort after it.
    sortOrder: p.sortOrder == null ? null : num(p.sortOrder),
    plSection: String(p.plSection || "").trim(),
    // Wholesale is its own trade: its own rate, its own pack size and its own
    // stock, none of which touch the counter or the website. A product only
    // reaches the dealer list once a box rate and stock are set on it.
    wsBoxRate: p.wsBoxRate == null || p.wsBoxRate === "" ? null : Math.max(0, num(p.wsBoxRate)),
    wsCase: p.wsCase == null || p.wsCase === "" ? null : Math.max(0, Math.round(num(p.wsCase))),
    wsStock: p.wsStock == null || p.wsStock === "" ? null : Math.max(0, Math.round(num(p.wsStock))),
    countInStock: Math.max(0, num(p.countInStock)),
    image: Array.isArray(p.image) ? p.image.filter(Boolean) : [],
    brand: p.brand || "Sankamithra",
    type: p.type || "Fireworks",
    sku: String(p.sku ?? "").trim(),
    shortDescription: String(p.shortDescription || "").trim(),
    description: String(p.description || "").trim(),
    active: p.active !== false,
  };
}

/** Populates an empty collection from the hosted catalogue, once. */
async function seedIfEmpty() {
  const col = await products();
  if (await col.countDocuments({}, { limit: 1 })) return;

  const res = await fetch(PRODUCT_SEED_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`catalogue seed responded ${res.status}`);
  const raw = await res.json();
  if (!Array.isArray(raw) || !raw.length) throw new Error("catalogue seed was empty");

  // NOT .map(normalise): map passes the index, which normalise would take as
  // the id and renumber the whole catalogue.
  const docs = raw.map((item) => normalise(item));
  await col.insertMany(docs);
  await (await settings()).updateOne(
    { _id: "categories" },
    { $set: { values: [...new Set(docs.map((d) => d.category))].sort() } },
    { upsert: true }
  );
  console.log(`catalogue seeded with ${docs.length} products`);
}

async function categoryList() {
  const doc = await (await settings()).findOne({ _id: "categories" });
  return doc?.values || [];
}

async function addToCategories(name) {
  if (!name) return;
  await (await settings()).updateOne(
    { _id: "categories" },
    { $addToSet: { values: name } },
    { upsert: true }
  );
}

export async function getCatalogue() {
  if (!useDb()) return fileStore.getCatalogue();
  await seedIfEmpty();
  const [items, categories] = await Promise.all([
    (await products()).find({}).sort({ sortOrder: 1, id: 1 }).toArray(),
    categoryList(),
  ]);
  // Not sorted: the order the shop arranged them in is the order they are
  // stored in, and alphabetising here threw that away every time it was read.
  return { products: items.map(strip), categories };
}

export async function getPublicProducts() {
  if (!useDb()) return fileStore.getPublicProducts();
  await seedIfEmpty();
  const items = await (await products()).find({ active: { $ne: false } }).sort({ sortOrder: 1, id: 1 }).toArray();
  return items.map(strip);
}

export async function createProduct(input) {
  if (!useDb()) return fileStore.createProduct(input);
  const col = await products();
  const highest = await col.find({}).sort({ id: -1 }).limit(1).toArray();
  const product = normalise(input, (highest[0]?.id || 0) + 1);
  if (!product.name) throw new Error("A product name is required");
  await col.insertOne({ ...product });
  await addToCategories(product.category);
  return product;
}

export async function updateProduct(id, patch) {
  if (!useDb()) return fileStore.updateProduct(id, patch);
  const col = await products();
  const existing = await col.findOne({ id: Number(id) });
  if (!existing) return null;
  const merged = normalise({ ...strip(existing), ...patch }, existing.id);
  await col.replaceOne({ id: existing.id }, { ...merged });
  await addToCategories(merged.category);
  return merged;
}

export async function deleteProduct(id) {
  if (!useDb()) return fileStore.deleteProduct(id);
  const res = await (await products()).deleteOne({ id: Number(id) });
  return res.deletedCount > 0;
}

export async function addCategory(name) {
  if (!useDb()) return fileStore.addCategory(name);
  const clean = String(name || "").trim();
  if (!clean) throw new Error("A category name is required");
  await addToCategories(clean);
  return (await categoryList()).sort();
}

export async function renameCategory(from, to) {
  if (!useDb()) return fileStore.renameCategory(from, to);
  const clean = String(to || "").trim();
  if (!clean) throw new Error("A category name is required");
  await (await products()).updateMany({ category: from }, { $set: { category: clean } });
  const values = (await categoryList()).map((c) => (c === from ? clean : c));
  await (await settings()).updateOne(
    { _id: "categories" },
    { $set: { values: [...new Set(values)].sort() } },
    { upsert: true }
  );
  return [...new Set(values)].sort();
}

export async function deleteCategory(name) {
  if (!useDb()) return fileStore.deleteCategory(name);
  const inUse = await (await products()).countDocuments({ category: name });
  if (inUse) throw new Error(`${inUse} product(s) still use "${name}"`);
  await (await settings()).updateOne({ _id: "categories" }, { $pull: { values: name } });
  return (await categoryList()).sort();
}

export async function applyBulkDiscount({ discount, category, ids }) {
  if (!useDb()) return fileStore.applyBulkDiscount({ discount, category, ids });
  const pct = Math.min(95, Math.max(0, Number(discount) || 0));
  const filter =
    Array.isArray(ids) && ids.length ? { id: { $in: ids.map(Number) } }
    : category ? { category }
    : {};
  const res = await (await products()).updateMany(filter, { $set: { discount: pct } });
  return res.modifiedCount;
}

/** Stores the category order exactly as the shop arranged it. */
export async function reorderCategories(values) {
  if (!useDb()) return fileStore.getCatalogue().then((c) => c.categories);
  const current = await categoryList();
  const wanted = (values || []).filter((v) => current.includes(v));
  // Anything the client did not send keeps its place at the end, so a stale
  // page cannot silently drop a category that was added meanwhile.
  const missing = current.filter((v) => !wanted.includes(v));
  const next = [...wanted, ...missing];
  await (await settings()).updateOne({ _id: "categories" }, { $set: { values: next } }, { upsert: true });
  return next;
}

/**
 * Reorders products within one category.
 *
 * The sortOrder slots those products already occupy are reused, so reordering
 * inside Rockets shuffles the rockets among themselves without moving any of
 * them past a sparkler in the all-products view.
 */
export async function reorderProducts(ids) {
  if (!useDb()) return 0;
  const col = await products();
  const list = ids.map(Number).filter(Number.isFinite);
  if (!list.length) return 0;

  const docs = await col.find({ id: { $in: list } }).toArray();
  const slots = docs
    .map((d) => (d.sortOrder == null ? 9999 + d.id : d.sortOrder))
    .sort((a, b) => a - b);

  const ops = list.map((id, i) => ({
    updateOne: { filter: { id }, update: { $set: { sortOrder: slots[i] } } },
  }));
  const res = await col.bulkWrite(ops);
  return res.modifiedCount ?? list.length;
}
