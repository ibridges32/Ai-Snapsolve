import { z } from "zod";
import { requireUser } from "../../src/lib/auth";
import { error, json } from "../../src/lib/responses";
import { detectChain } from "../../src/lib/detect";

export const config = { runtime: "edge" };

const BodySchema = z.object({
  input: z.string().min(1),
  image_url: z.string().url().optional(),
});

export default async function handler(req: Request) {
  if (req.method !== "POST") return error(405, "Use POST");
  const auth = await requireUser(req);
  if (!auth.ok) return error(401, auth.error);
  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch { return error(400, "Invalid body"); }
  const chain = await detectChain(body.input, body.image_url);
  return json(200, { ok: true, chain, user_id: auth.userId });
}
