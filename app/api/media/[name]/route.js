import { collection } from "@/util/db/mongo";

export const dynamic = "force-dynamic";

/** Serves an admin-uploaded image out of the database. */
export async function GET(_request, { params }) {
  try {
    // Only ever a generated hex name — reject anything else rather than let a
    // crafted value reach the query.
    if (!/^[a-f0-9]{20}\.(png|jpg|webp|gif)$/.test(params.name || "")) {
      return new Response("Not found", { status: 404 });
    }

    const doc = await (await collection("media")).findOne({ name: params.name });
    if (!doc) return new Response("Not found", { status: 404 });

    return new Response(doc.data.buffer ?? doc.data, {
      headers: {
        "Content-Type": doc.contentType || "image/png",
        // Content is immutable: the name is a content-addressed random id.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("media fetch failed:", err);
    return new Response("Not found", { status: 404 });
  }
}
