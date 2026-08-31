import fs from "fs/promises";
import path from "path";
import { PRODUCT_SEED_URL } from "@/util/config";

/**
 * File-backed product catalogue.
 *
 * The shop used to read database/SortedJSON/productData.json directly, which is
 * read-only source data. This store seeds itself from that file once, then owns
 * the catalogue so the admin can edit it. The original file is never written to,
 * so it stays a clean fallback.
 *
 * Swap readAll/writeAll for a database later; nothing else needs to change.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "catalogue.json");
// Local fallback, used only when the hosted seed can't be reached.
const LOCAL_SEED = path.join(process.cwd(), "database", "SortedJSON", "productData.json");

/**
 * Fetches the catalogue seed from the asset host, falling back to a local copy.
 *
 * Reading the seed over HTTP rather than off disk is what lets the app deploy
 * without the 58 MB database folder: a fresh install pulls the catalogue from
 * thunder.sankamithra.com on first run instead of starting empty.
 */
async function loadSeed() {
  try {
    const res = await fetch(PRODUCT_SEED_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`seed responded ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error("seed was empty");
    return data;
  } catch (err) {
    console.warn(`catalogue seed unavailable (${err.message}); trying the local copy`);
    return JSON.parse(await fs.readFile(LOCAL_SEED, "utf8"));
  }
}

let queue = Promise.resolve();
const serialise = (fn) => {
  const run = queue.then(fn, fn);
  queue = run.then(() => {}, () => {});
  return run;
};

async function readAll() {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    // First run: adopt the hosted catalogue.
    const products = await loadSeed();
    const seeded = {
      // NOT .map(normalise): map passes the index as the second argument, which
      // normalise would take as the id and renumber the whole catalogue.
      products: products.map((item) => normalise(item)),
      categories: [...new Set(products.map((p) => p.category))].sort(),
      updatedAt: new Date().toISOString(),
    };
    await writeAll(seeded);
    return seeded;
  }
}

async function writeAll(data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

/** Coerces an incoming product into the shape the shop and invoice expect. */
function normalise(p, id) {
  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    id: id ?? p.id,
    name: String(p.name || "").trim(),
    category: String(p.category || "Others").trim(),
    price: Math.max(0, num(p.price)),
    discount: Math.min(95, Math.max(0, num(p.discount))),
    countInStock: Math.max(0, num(p.countInStock)),
    image: Array.isArray(p.image) ? p.image.filter(Boolean) : [],
    brand: p.brand || "Sankamithra",
    type: p.type || "Fireworks",
    sku: String(p.sku ?? "").trim(),
    shortDescription: String(p.shortDescription || "").trim(),
    description: String(p.description || "").trim(),
    active: p.active !== false, // hidden products stay in the data but leave the shop
  };
}

export async function getCatalogue() {
  return readAll();
}

/** What the storefront sees: active products only. */
export async function getPublicProducts() {
  const { products } = await readAll();
  return products.filter((p) => p.active !== false);
}

export async function createProduct(input) {
  return serialise(async () => {
    const data = await readAll();
    const nextId = data.products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
    const product = normalise(input, nextId);
    if (!product.name) throw new Error("A product name is required");
    data.products.push(product);
    if (product.category && !data.categories.includes(product.category)) {
      data.categories.push(product.category);
      data.categories.sort();
    }
    data.updatedAt = new Date().toISOString();
    await writeAll(data);
    return product;
  });
}

export async function updateProduct(id, patch) {
  return serialise(async () => {
    const data = await readAll();
    const i = data.products.findIndex((p) => String(p.id) === String(id));
    if (i === -1) return null;
    const merged = normalise({ ...data.products[i], ...patch }, data.products[i].id);
    data.products[i] = merged;
    if (merged.category && !data.categories.includes(merged.category)) {
      data.categories.push(merged.category);
      data.categories.sort();
    }
    data.updatedAt = new Date().toISOString();
    await writeAll(data);
    return merged;
  });
}

export async function deleteProduct(id) {
  return serialise(async () => {
    const data = await readAll();
    const before = data.products.length;
    data.products = data.products.filter((p) => String(p.id) !== String(id));
    data.updatedAt = new Date().toISOString();
    await writeAll(data);
    return before !== data.products.length;
  });
}

export async function addCategory(name) {
  return serialise(async () => {
    const data = await readAll();
    const clean = String(name || "").trim();
    if (!clean) throw new Error("A category name is required");
    if (!data.categories.includes(clean)) {
      data.categories.push(clean);
      data.categories.sort();
    }
    data.updatedAt = new Date().toISOString();
    await writeAll(data);
    return data.categories;
  });
}

export async function renameCategory(from, to) {
  return serialise(async () => {
    const data = await readAll();
    const clean = String(to || "").trim();
    if (!clean) throw new Error("A category name is required");
    data.products.forEach((p) => { if (p.category === from) p.category = clean; });
    data.categories = [...new Set(data.categories.map((c) => (c === from ? clean : c)))].sort();
    data.updatedAt = new Date().toISOString();
    await writeAll(data);
    return data.categories;
  });
}

export async function deleteCategory(name) {
  return serialise(async () => {
    const data = await readAll();
    const inUse = data.products.filter((p) => p.category === name).length;
    if (inUse) throw new Error(`${inUse} product(s) still use "${name}"`);
    data.categories = data.categories.filter((c) => c !== name);
    data.updatedAt = new Date().toISOString();
    await writeAll(data);
    return data.categories;
  });
}

/**
 * Bulk discount, for running a sale.
 * scope: { category } or { ids } - omit both to apply to everything.
 */
export async function applyBulkDiscount({ discount, category, ids }) {
  return serialise(async () => {
    const data = await readAll();
    const pct = Math.min(95, Math.max(0, Number(discount) || 0));
    let changed = 0;
    data.products.forEach((p) => {
      const hit =
        Array.isArray(ids) && ids.length ? ids.map(String).includes(String(p.id))
        : category ? p.category === category
        : true;
      if (hit) { p.discount = pct; changed++; }
    });
    data.updatedAt = new Date().toISOString();
    await writeAll(data);
    return changed;
  });
}
