import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireAdmin } from "@/util/admin/auth";
import { collection, isDbConfigured } from "@/util/db/mongo";
import { uploadImage, isCloudinaryConfigured } from "@/util/cloudinary";

export const dynamic = "force-dynamic";

const DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Stores a product image and returns the path the catalogue should reference.
 *
 * Three tiers, in order of preference: Cloudinary (CDN-delivered, keeps large
 * binaries out of the database), then MongoDB, then the local filesystem.
 * public/uploads only works where the filesystem persists — on a serverless
 * host it is read-only and wiped between deploys.
 */
export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return Response.json({ error: "No file received" }, { status: 400 });
    }

    const ext = ALLOWED[file.type];
    if (!ext) {
      return Response.json({ error: "Only PNG, JPG, WEBP or GIF images are accepted" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: "Image must be under 5 MB" }, { status: 400 });
    }

    // Random name: the original filename is untrusted and could collide or try
    // to escape the directory.
    const name = `${crypto.randomBytes(10).toString("hex")}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    if (isCloudinaryConfigured()) {
      const { url } = await uploadImage(bytes);
      return Response.json({ ok: true, path: url });
    }

    if (isDbConfigured()) {
      await (await collection("media")).insertOne({
        name,
        contentType: file.type,
        size: bytes.length,
        data: bytes,
        createdAt: new Date().toISOString(),
      });
      return Response.json({ ok: true, path: `media/${name}` });
    }

    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(path.join(DIR, name), bytes);
    return Response.json({ ok: true, path: `uploads/${name}` });
  } catch (err) {
    console.error("upload failed:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
