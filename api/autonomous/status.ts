import { json } from "../../src/lib/responses";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  return json(200, {
    ok: true,
    version: "1.0.0",
    chains: ["study", "math", "writing", "food", "language"],
    depths: ["quick", "standard", "full"],
    steps_per_chain: {
      study:    { quick: 2, standard: 3, full: 4 },
      math:     { quick: 2, standard: 3, full: 4 },
      writing:  { quick: 1, standard: 3, full: 4 },
      food:     { quick: 1, standard: 2, full: 3 },
      language: { quick: 1, standard: 3, full: 3 },
    },
    streaming: true,
    format: "SSE (text/event-stream)",
  });
}
