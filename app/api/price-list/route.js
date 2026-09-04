import { requireAdmin } from "@/util/admin/auth";
import { getSettingSafe, setSetting } from "@/util/settingsStore";
import { collection, isDbConfigured } from "@/util/db/mongo";
import { PRICE_LIST_FALLBACK } from "@/util/config";

export const dynamic = "force-dynamic";

const KEY = "priceList";
const DOC = "price-list.pdf";
// Comfortably under MongoDB's 16 MB per-document ceiling.
const MAX_BYTES = 14 * 1024 * 1024;

/**
 * The price list PDF.
 *
 * GET is public: it serves the current file, so every "Download price list"
 * link in the site can stay a plain constant (/api/price-list) and still track
 * whatever the admin last uploaded. Nothing else needs changing on upload.
 *
 * Stored in MongoDB rather than Cloudinary: Cloudinary denies delivery of PDF
 * and raw files by default (x-cld-error: "deny or ACL failure"), so an upload
 * would succeed and then 401 on download. This keeps it working with no
 * third-party setting to remember.
 */
export async function GET(request) {
  const current = await getSettingSafe(KEY);
  const wantsInfo = request.nextUrl.searchParams.get("info") === "1";

  // Describes the current file rather than serving it, for the admin card.
  if (wantsInfo) {
    return Response.json(current ? { ...current, custom: true } : { custom: false });
  }

  // Nothing uploaded yet: fall back to the copy that shipped with the site.
  if (!current) return Response.redirect(PRICE_LIST_FALLBACK, 302);

  const doc = await (await collection("media")).findOne({ name: DOC });
  if (!doc) return Response.redirect(PRICE_LIST_FALLBACK, 302);

  return new Response(doc.data.buffer ?? doc.data, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${current.name.replace(/[^\w.\- ]/g, "")}"`,
      // Revalidate rather than cache hard: this URL is stable but its content
      // changes whenever the admin uploads a new list.
      "Cache-Control": "public, max-age=0, must-revalidate",
      ETag: `"${current.uploadedAt}"`,
    },
  });
}

/** Replaces the price list. Admin only. */
export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    if (!isDbConfigured()) {
      return Response.json({ error: "No database configured" }, { status: 503 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return Response.json({ error: "No file received" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return Response.json({ error: "The price list must be a PDF" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: "PDF must be under 14 MB" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    // A fixed document name, so each upload replaces the last rather than
    // leaving a trail of old price lists in the database.
    await (await collection("media")).updateOne(
      { name: DOC },
      { $set: { name: DOC, contentType: "application/pdf", size: bytes.length, data: bytes, createdAt: new Date().toISOString() } },
      { upsert: true }
    );

    const value = {
      url: "/api/price-list",
      name: file.name || DOC,
      size: bytes.length,
      uploadedAt: new Date().toISOString(),
    };
    await setSetting(KEY, value);
    return Response.json({ ok: true, ...value });
  } catch (err) {
    console.error("price list upload failed:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
