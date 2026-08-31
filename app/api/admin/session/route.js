import { getSession } from "@/util/admin/auth";

export const dynamic = "force-dynamic";

/** Who am I, and how long is this session good for? Used by the panel. */
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ authed: false }, { status: 401 });
  return Response.json({
    authed: true,
    subject: session.sub,
    issuedAt: session.iat,
    expiresAt: session.exp,
    expiresInSeconds: Math.max(0, session.exp - Math.floor(Date.now() / 1000)),
  });
}
