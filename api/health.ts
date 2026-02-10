import { json } from "../src/lib/responses";

export default async function handler() {
  return json(200, { ok: true, service: "ai-snapsolve-backend", ts: Date.now() });
}
