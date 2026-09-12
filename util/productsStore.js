import { TABLE, getItem, putItem, deleteItem, scanAll, isEmpty, batchWrite, isDbConfigured } from "@/util/db/dynamo";
import { PRODUCT_SEED_URL, absoluteAssetUrl } from "@/util/config";
import * as fileStore from "./productsStore.file";

/**
 * Catalogue storage.
 *
 * DynamoDB when AWS credentials are set, otherwise the JSON file store for local
 * development. On first run the products collection seeds itself from the
 * hosted catalogue, so a fresh deployment comes up with a full shop rather
 * than an empty one.
 */

const useDb = () => isDbConfigured();

/**
 * Categories are one row holding an ordered list, not a row per category.
 *
 * The order is the shop's arrangement and has to survive a read, so it lives as
 * a list rather than being recovered by sorting rows - which is exactly what
 * alphabetising on read used to throw away.
 */
const CATEGORY_KEY = "categories";

async function readCategoryRow() {
  return (await getItem(TABLE.settings, CATEGORY_KEY)) || { key: CATEGORY_KEY, values: [] };
}

async function writeCategories(values) {
  await putItem(TABLE.settings, { key: CATEGORY_KEY, values, updatedAt: new Date().toISOString() });
  return values;
}

/** Everything in the catalogue, in the shop's arranged order. */
async function allProducts() {
  const items = await scanAll(TABLE.products);
  // Sorted here rather than by the store: DynamoDB returns a Scan in whatever
  // order it likes, and the arranged order is the whole point of sortOrder.
  return items.sort((a, b) => {
    const sa = a.sortOrder == null ? Number.MAX_SAFE_INTEGER : a.sortOrder;
    const sb = b.sortOrder == null ? Number.MAX_SAFE_INTEGER : b.sortOrder;
    return sa - sb || a.id - b.id;
  });
}

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
  if (!(await isEmpty(TABLE.products))) return;

  // Absolute: a site-relative ASSET_BASE cannot be fetched server-side.
  const res = await fetch(absoluteAssetUrl(PRODUCT_SEED_URL), { cache: "no-store" });
  if (!res.ok) throw new Error(`catalogue seed responded ${res.status}`);
  const raw = await res.json();
  if (!Array.isArray(raw) || !raw.length) throw new Error("catalogue seed was empty");

  // NOT .map(normalise): map passes the index, which normalise would take as
  // the id and renumber the whole catalogue.
  const docs = raw.map((item) => normalise(item));
  await batchWrite(TABLE.products, docs);
  await writeCategories([...new Set(docs.map((d) => d.category))].sort());
  console.log(`catalogue seeded with ${docs.length} products`);
}

async function categoryList() {
  return (await readCategoryRow()).values || [];
}

async function addToCategories(name) {
  if (!name) return;
  const values = await categoryList();
  if (values.includes(name)) return;
  await writeCategories([...values, name]);
}

export async function getCatalogue() {
  if (!useDb()) return fileStore.getCatalogue();
  await seedIfEmpty();
  const [items, categories] = await Promise.all([allProducts(), categoryList()]);
  // Not sorted: the order the shop arranged them in is the order they are
  // stored in, and alphabetising here threw that away every time it was read.
  return { products: items.map(strip), categories };
}

export async function getPublicProducts() {
  if (!useDb()) return fileStore.getPublicProducts();
  await seedIfEmpty();
  // Filtered here rather than in the Scan: at ~145 items the whole table is one
  // read either way, and a FilterExpression would not make it cheaper - Dynamo
  // charges for what it reads, not for what survives the filter.
  const items = (await allProducts()).filter((p) => p.active !== false);
  return items.map(strip);
}

export async function createProduct(input) {
  if (!useDb()) return fileStore.createProduct(input);
  const existing = await scanAll(TABLE.products);
  const highest = existing.reduce((a, p) => Math.max(a, Number(p.id) || 0), 0);
  const product = normalise(input, highest + 1);
  if (!product.name) throw new Error("A product name is required");
  await putItem(TABLE.products, { ...product });
  await addToCategories(product.category);
  return product;
}

export async function updateProduct(id, patch) {
  if (!useDb()) return fileStore.updateProduct(id, patch);
  const existing = await getItem(TABLE.products, Number(id));
  if (!existing) return null;
  const merged = normalise({ ...strip(existing), ...patch }, existing.id);
  await putItem(TABLE.products, { ...merged });
  await addToCategories(merged.category);
  return merged;
}

export async function deleteProduct(id) {
  if (!useDb()) return fileStore.deleteProduct(id);
  const existing = await getItem(TABLE.products, Number(id));
  if (!existing) return false;
  await deleteItem(TABLE.products, Number(id));
  return true;
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
  // No server-side updateMany in DynamoDB: read the affected rows, rewrite
  // them in batches of 25.
  const affected = (await scanAll(TABLE.products)).filter((p) => p.category === from);
  if (affected.length) {
    await batchWrite(TABLE.products, affected.map((p) => ({ ...p, category: clean })));
  }
  const values = (await categoryList()).map((c) => (c === from ? clean : c));
  const next = [...new Set(values)].sort();
  await writeCategories(next);
  return next;
}

export async function deleteCategory(name) {
  if (!useDb()) return fileStore.deleteCategory(name);
  const inUse = (await scanAll(TABLE.products)).filter((p) => p.category === name).length;
  if (inUse) throw new Error(`${inUse} product(s) still use "${name}"`);
  const next = (await categoryList()).filter((c) => c !== name);
  await writeCategories(next);
  return [...next].sort();
}

export async function applyBulkDiscount({ discount, category, ids }) {
  if (!useDb()) return fileStore.applyBulkDiscount({ discount, category, ids });
  const pct = Math.min(95, Math.max(0, Number(discount) || 0));
  const wanted = Array.isArray(ids) && ids.length ? new Set(ids.map(Number)) : null;

  const affected = (await scanAll(TABLE.products)).filter((p) =>
    wanted ? wanted.has(Number(p.id)) : category ? p.category === category : true
  );
  // Skip rows already at this discount - a sale re-applied over the same
  // selection would otherwise rewrite the whole catalogue for nothing.
  const changing = affected.filter((p) => Number(p.discount) !== pct);
  if (changing.length) {
    await batchWrite(TABLE.products, changing.map((p) => ({ ...p, discount: pct })));
  }
  return changing.length;
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
  await writeCategories(next);
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
  const list = ids.map(Number).filter(Number.isFinite);
  if (!list.length) return 0;

  const byId = new Map((await scanAll(TABLE.products)).map((p) => [Number(p.id), p]));
  const docs = list.map((id) => byId.get(id)).filter(Boolean);
  if (!docs.length) return 0;

  const slots = docs
    .map((d) => (d.sortOrder == null ? 9999 + d.id : d.sortOrder))
    .sort((a, b) => a - b);

  const moved = docs.map((d, i) => ({ ...d, sortOrder: slots[i] }));
  await batchWrite(TABLE.products, moved);
  return moved.length;
}
