import { z } from "zod";
import { requireUser } from "../../src/lib/auth";
import { error } from "../../src/lib/responses";
import { openai } from "../../src/lib/openai";
import { detectChain } from "../../src/lib/detect";
import {
  ChainType, ChainDepth, StepContext, StepResult, ChainResult,
  getChainSteps, compileDocument,
} from "../../src/lib/chains";

export const config = { runtime: "edge" };

const BodySchema = z.object({
  input: z.string().min(1).max(2000),
  image_url: z.string().url().optional(),
  chain: z.enum(["study","math","writing","food","language","auto"]).default("auto"),
  depth: z.enum(["quick","standard","full"]).default("standard"),
  goal: z.string().optional(),
  language: z.string().optional(),
  save_to_document: z.boolean().default(true),
});

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return error(405, "Use POST");

  const auth = await requireUser(req);
  if (!auth.ok) return error(401, auth.error);

  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch { return error(400, "Invalid body"); }

  const { input, image_url, depth, goal, language, save_to_document } = body;
  let chainType = body.chain as ChainType;

  if (chainType === "auto") chainType = await detectChain(input, image_url);

  const steps = getChainSteps(chainType, depth as ChainDepth);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const context: StepContext = {
        original_input: input, image_url, goal, language,
        previous_outputs: {},
      };
      const completedSteps: StepResult[] = [];

      try {
        send({ type: "chain_start", chain: chainType, depth, total_steps: steps.length,
          message: `Starting ${chainType} chain (${steps.length} steps)...` });

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          send({ type: "step_start", step_number: i+1, step_name: step.name, description: step.description });

          try {
            const prompt = step.prompt(input, context);
            const messages: any[] = [
              { role: "system", content: "You are AI SnapSolve — a helpful AI assistant. Be clear, accurate, and concise." },
            ];

            if (i === 0 && image_url) {
              messages.push({ role: "user", content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: image_url } },
              ]});
            } else {
              messages.push({ role: "user", content: prompt });
            }

            const completion = await openai.chat.completions.create({
              model: i === 0 && image_url ? "gpt-4o" : step.model,
              messages,
              max_tokens: step.max_tokens,
            });

            const result = completion.choices?.[0]?.message?.content ?? "";
            const tokens = completion.usage?.total_tokens;
            context.previous_outputs[step.output_key] = result;

            const stepResult: StepResult = { step_number: i+1, step_name: step.name,
              output_key: step.output_key, result, tokens_used: tokens };
            completedSteps.push(stepResult);

            send({ type: "step_complete", step_number: i+1, step_name: step.name,
              output_key: step.output_key, result, tokens_used: tokens });

          } catch (stepErr) {
            send({ type: "step_error", step_number: i+1, step_name: step.name,
              error: stepErr instanceof Error ? stepErr.message : "Step failed" });
          }
        }

        const document = save_to_document
          ? compileDocument(chainType, completedSteps, input) : "";

        const chainResult: ChainResult = {
          chain_used: chainType,
          steps_completed: completedSteps.length,
          steps: completedSteps,
          document,
          summary: `Completed ${completedSteps.length} steps: ${completedSteps.map(s => s.step_name).join(", ")}`,
        };

        send({ type: "chain_complete", ...chainResult, saved_to_document: save_to_document, user_id: auth.userId });

      } catch (err) {
        send({ type: "error", error: err instanceof Error ? err.message : "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
