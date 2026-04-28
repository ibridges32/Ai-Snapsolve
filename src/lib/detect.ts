import { ChainType } from "./chains";
import { openai } from "./openai";

export async function detectChain(input: string, image_url?: string): Promise<ChainType> {
  const systemPrompt = `You are an intent classifier. Given user input, respond with EXACTLY one word:
study, math, writing, food, language

Rules:
- math: math symbols, "solve", "calculate", "equation", "formula", numbers in math context
- food: food/meal/calories/nutrition/eating/restaurant/recipe/diet
- writing: "write", "essay", "email", "letter", "report", "document", "draft"
- language: translate/language/Spanish/French/word meaning/ESL
- study: everything else — questions, topics, "explain", "what is", "how does"

Respond with ONLY one word.`;

  try {
    const messages: any[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: image_url
          ? [{ type: "text", text: `Classify: ${input}` }, { type: "image_url", image_url: { url: image_url } }]
          : `Classify: ${input}`,
      },
    ];

    const res = await openai.chat.completions.create({
      model: image_url ? "gpt-4o" : "gpt-4o-mini",
      messages,
      max_tokens: 10,
      temperature: 0,
    });

    const detected = res.choices?.[0]?.message?.content?.trim().toLowerCase() ?? "study";
    const valid: ChainType[] = ["study", "math", "writing", "food", "language"];
    return valid.includes(detected as ChainType) ? (detected as ChainType) : "study";
  } catch {
    return "study";
  }
}
