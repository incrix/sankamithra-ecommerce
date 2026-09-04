import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/util/admin/auth";
import { getSettingSafe, setSetting, BANNER_KEY, BANNER_TAG } from "@/util/settingsStore";
import { isDbConfigured } from "@/util/db/mongo";
import { DEFAULT_BANNER } from "@/util/config";

export const dynamic = "force-dynamic";

const MAX_TEXT = 120;

/**
 * The top announcement strip.
 *
 * The storefront does not read this route - the root layout reads the setting
 * directly through a cached, tagged helper so the strip is server-rendered with
 * no flash of the old text. This route exists for the admin card, and its POST
 * revalidates that tag so a save shows up straight away.
 */
export async function GET() {
  const current = await getSettingSafe(BANNER_KEY);
  return Response.json({ ...(current || DEFAULT_BANNER), custom: Boolean(current) });
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    if (!isDbConfigured()) {
      return Response.json({ error: "No database configured" }, { status: 503 });
    }

    const body = await request.json();
    const text = String(body.text ?? "").trim();
    const href = String(body.href ?? "").trim();
    const enabled = body.enabled !== false;

    if (enabled && !text) {
      return Response.json({ error: "Banner text cannot be empty" }, { status: 400 });
    }
    if (text.length > MAX_TEXT) {
      return Response.json({ error: `Keep it under ${MAX_TEXT} characters` }, { status: 400 });
    }
    // Same-site paths only: an external URL in the site-wide strip is a wide
    // open redirect for anyone who gets into the panel.
    if (href && !href.startsWith("/")) {
      return Response.json({ error: "Link must be a path on this site, like /wholesale" }, { status: 400 });
    }

    const value = { text, href, enabled, updatedAt: new Date().toISOString() };
    await setSetting(BANNER_KEY, value);
    revalidateTag(BANNER_TAG);
    return Response.json({ ok: true, ...value });
  } catch (err) {
    console.error("banner save failed:", err);
    return Response.json({ error: "Save failed" }, { status: 500 });
  }
}
