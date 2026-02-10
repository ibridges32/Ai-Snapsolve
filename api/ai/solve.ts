import { z } from "zod";
import { error, json } from "../../src/lib/responses";
import { requireUser } from "../../src/lib/auth";
import { openai } from "../../src/lib/openai";

export const config = { runtime: "edge" };

const BodySchema = z.object({
  prompt: z.string().min(1),
});

export default async function handler(req: Request) {
  if (req.method !== "POST") return error(405, "Use POST");

  const auth = await requireUser(req);
  if (!auth.ok) return error(401, auth.error);

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return error(400, "Invalid body");
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You are AI SnapSolve. Provide clear step-by-step help. If the question is ambiguous, ask one short clarifying question.",
      },
      { role: "user", content: body.prompt },
    ],
  });

  const answer = completion.choices?.[0]?.message?.content ?? "";

  return json(200, {
    ok: true,
    userId: auth.userId,
    answer,
  });
}
