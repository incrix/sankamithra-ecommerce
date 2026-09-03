import { collection, isDbConfigured } from "@/util/db/mongo";
import LIST from "@/util/data/wholesale2026.json";

/**
 * The dealer catalogue, kept in its own collection.
 *
 * Wholesale is a separate trade from the shop: it has its own item codes, its
 * own pack sizes and its own rates, and most of its lines - Thunder Shower,
 * Magic Pops, 12 Shots Vector - are not in the retail catalogue at all. Tying
 * it to products would have meant inventing shop entries for items the shop
 * does not retail.
 *
 * The rates come from the printed list and are seeded once; only stock is
 * expected to move day to day.
 */

const items = () => collection("wholesale");

const strip = ({ _id, ...rest }) => rest;

/** Populates the collection from the printed list, once. */
async function seedIfEmpty() {
  const col = await items();
  if (await col.countDocuments({}, { limit: 1 })) return;
  await col.insertMany(
    LIST.map((r, i) => ({ ...r, order: i, stock: null, image: null, active: true }))
  );
  console.log(`wholesale list seeded with ${LIST.length} items`);
}

export async function getWholesaleItems() {
  if (!isDbConfigured()) return [];
  await seedIfEmpty();
  const docs = await (await items()).find({}).sort({ order: 1 }).toArray();
  return docs.map(strip);
}

export async function updateWholesaleItem(code, patch) {
  const col = await items();
  const set = {};
  // Only these are editable. Names, codes and pack sizes come off the printed
  // list and should change with the list, not by hand.
  if ("stock" in patch) set.stock = patch.stock === "" || patch.stock == null ? null : Math.max(0, Math.round(Number(patch.stock) || 0));
  if ("price" in patch) set.price = Math.max(0, Number(patch.price) || 0);
  if ("caseQty" in patch) set.caseQty = Math.max(0, Math.round(Number(patch.caseQty) || 0));
  if ("active" in patch) set.active = patch.active !== false;
  // Photographs are the one thing the shop does change by hand: the printed
  // list has none, so they are uploaded or borrowed from the shop catalogue.
  if ("image" in patch) set.image = patch.image ? String(patch.image).slice(0, 500) : null;
  if (!Object.keys(set).length) return null;

  const res = await col.findOneAndUpdate({ code }, { $set: set }, { returnDocument: "after" });
  const doc = res?.value ?? res;
  return doc ? strip(doc) : null;
}

/**
 * Borrows a photograph from the retail catalogue where the shop sells the same
 * item.
 *
 * Matched on the set of words rather than the string, because the two lists
 * name things differently: the dealer list says "15 Shots - Arrival" where the
 * shop says "Arrival 15-shots", and the printed list spells it "Twinklig".
 * Lines with no shop equivalent - the new 2026 items - simply show without a
 * picture rather than borrowing a wrong one.
 */
export async function matchImages(products) {
  const col = await items();

  const clean = (s) =>
    String(s || "").toLowerCase()
      .replace(/[""'']/g, "").replace(/&/g, " and ")
      .replace(/½/g, "1/2").replace(/¾/g, "3/4")
      .replace(/(\d)\s*(ft|feet|')/g, "$1")
      .replace(/\b(\d+)\s*1\/2/g, "$1.5").replace(/\b1\/2\b/g, ".5")
      .replace(/twinklig/g, "twinkling")
      .replace(/lakshmi|laxmi/g, "laxmi")
      .replace(/chhoto beam|chota beam|chhoto bheem/g, "chotabeam")
      .replace(/ant\s*-?\s*man/g, "antman").replace(/dead\s*pool/g, "deadpool")
      .replace(/flower\s*pots?/g, "flowerpot").replace(/chakkaar|chakkar/g, "chakkar")
      .replace(/\bpce\b/g, "pcs")
      .replace(/(\d)\s*pcs\b/g, "$1 pcs")        // "100pcs" is a count and a unit
      .replace(/water\s*falls?/g, "waterfalls")
      .replace(/w\s*-?\s*power/g, "wpower")
      .replace(/\bc\s*r\s*7\b/g, "cr7")
      .replace(/\bsky\s*war\b/g, "skywar")
      .replace(/double\s*ball/g, "doubleball")
      .replace(/[^a-z0-9. ]+/g, " ")
      .replace(/\s+/g, " ").trim();

  // Words that say nothing about which product this is.
  // "deluxe", "big", "special" stay: in this catalogue they are the whole
  // difference between one Flower Pot and the next, and dropping them let
  // "Flower Pots Deluxe" take the photograph of "Flower Pots Big".
  const NOISE = new Set(["pcs", "ply", "varieties", "crackers", "cracker", "multicolour",
    "multicolor", "muticolor", "box", "bag", "tin",
    "shot", "shots", "the", "and", "unit", "units", "net", "rate", "pkt", "pkts"]);
  const toks = (s) => new Set(clean(s).split(" ").filter((t) => t && !NOISE.has(t)));

  // Scored against the LONGER name, not the shorter. Containment alone let a
  // one-word shop item ("7 Shot") swallow a dealer line that merely contained
  // that word ("30 Shots - C R 7"), and a wrong photograph on a price list is
  // worse than no photograph at all.
  // Words that make a different product rather than a longer name. "Flower
  // Pots Super Deluxe" is not "Flower Pots Deluxe", so if one side carries a
  // qualifier and the other does not, they are not the same item.
  const QUALIFIERS = ["super", "mega", "mini", "baby", "giant", "jumbo", "special", "asoka"];

  const score = (a, b) => {
    const A = toks(a), B = toks(b);
    if (!A.size || !B.size) return 0;
    for (const qword of QUALIFIERS) if (A.has(qword) !== B.has(qword)) return 0;
    let hit = 0;
    for (const t of A) if (B.has(t)) hit++;
    if (hit === 0) return 0;
    if (Math.max(A.size, B.size) > 1 && hit < 2) return 0;   // one word in common is a coincidence
    return hit / Math.max(A.size, B.size);
  };

  const docs = await col.find({}).toArray();
  let matched = 0;
  for (const d of docs) {
    let best = null, bestScore = 0;
    for (const p of products) {
      // A placeholder is not a photograph - borrowing one just spreads it.
      if (!p.image?.[0] || /noimage|no-image|placeholder/i.test(p.image[0])) continue;
      const sc = score(d.name, p.name);
      if (sc > bestScore) { bestScore = sc; best = p; }
    }
    // Every meaningful word of the shorter name has to be present.
    if (best && bestScore >= 0.6) {
      await col.updateOne({ code: d.code }, { $set: { image: best.image[0] } });
      matched++;
    }
  }
  return { matched, total: docs.length };
}
