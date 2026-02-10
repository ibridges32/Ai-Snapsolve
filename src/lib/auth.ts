import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "./env";

const JWKS = createRemoteJWKSet(new URL(env.SUPABASE_JWKS_URL));

export async function requireUser(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) return { ok: false as const, error: "Missing Bearer token" };

  try {
    const { payload } = await jwtVerify(token, JWKS);
    const userId = payload.sub;
    if (!userId) return { ok: false as const, error: "Invalid token (no sub)" };
    return { ok: true as const, userId };
  } catch {
    return { ok: false as const, error: "Invalid or expired token" };
  }
}

