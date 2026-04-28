
import OpenAI from "openai";

export type ChainType = "study" | "math" | "writing" | "food" | "language" | "auto";
export type ChainDepth = "quick" | "standard" | "full";

export interface ChainStep {
  name: string;
  description: string;
  prompt: (input: string, context: StepContext) => string;
  model: string;
  max_tokens: number;
  output_key: string;
}

export interface StepContext {
  original_input: string;
  image_url?: string;
  goal?: string;
  language?: string;
  previous_outputs: Record<string, string>;
}

export interface StepResult {
  step_number: number;
  step_name: string;
  output_key: string;
  result: string;
  tokens_used?: number;
}

export interface ChainResult {
  chain_used: ChainType;
  steps_completed: number;
  steps: StepResult[];
  document: string;
  summary: string;
}

// ── STUDY CHAIN ───────────────────────────────────────────────────────────────
export const studyChain: Record<ChainDepth, ChainStep[]> = {
  quick: [
    {
      name: "Explain",
      description: "Explaining the topic clearly",
      output_key: "explanation",
      model: "gpt-4o",
      max_tokens: 600,
      prompt: (input) =>
        `Explain this clearly with step-by-step breakdown. Be concise but complete:\n\n${input}`,
    },
    {
      name: "Practice Quiz",
      description: "Creating 5 practice questions",
      output_key: "quiz",
      model: "gpt-4o-mini",
      max_tokens: 600,
      prompt: (input, ctx) =>
        `Based on this topic: "${input}"\n\nExplanation: ${ctx.previous_outputs.explanation}\n\nCreate 5 multiple choice questions (A/B/C/D) with answers.`,
    },
  ],
  standard: [
    {
      name: "Explain",
      description: "Explaining with examples",
      output_key: "explanation",
      model: "gpt-4o",
      max_tokens: 800,
      prompt: (input) =>
        `Explain this topic with examples, key concepts, and a summary:\n\n${input}`,
    },
    {
      name: "Practice Quiz",
      description: "Creating 8 practice questions",
      output_key: "quiz",
      model: "gpt-4o-mini",
      max_tokens: 800,
      prompt: (input, ctx) =>
        `Create 8 multiple choice questions for: "${input}"\n\nBased on:\n${ctx.previous_outputs.explanation}\n\nFormat: Q[n]. [question]\nA) B) C) D)\nAnswer: [letter]\nExplanation: [why]`,
    },
    {
      name: "Flashcards",
      description: "Generating 10 flashcards",
      output_key: "flashcards",
      model: "gpt-4o-mini",
      max_tokens: 600,
      prompt: (input, ctx) =>
        `Create 10 study flashcards from:\n${ctx.previous_outputs.explanation}\n\nFormat:\nCARD [n]\nFront: [term]\nBack: [definition]`,
    },
  ],
  full: [
    {
      name: "Study Guide",
      description: "Building comprehensive study guide",
      output_key: "study_guide",
      model: "gpt-4o",
      max_tokens: 1200,
      prompt: (input) =>
        `Create a comprehensive study guide for: "${input}"\n\nInclude: Overview, Key Concepts (5-8), Important formulas/rules, Common mistakes, Quick summary`,
    },
    {
      name: "Practice Quiz",
      description: "Creating 10 mixed-difficulty questions",
      output_key: "quiz",
      model: "gpt-4o",
      max_tokens: 1000,
      prompt: (input, ctx) =>
        `Create 10 practice questions for: "${input}" (3 easy, 4 medium, 3 hard)\n\nBased on:\n${ctx.previous_outputs.study_guide}`,
    },
    {
      name: "Flashcards",
      description: "Creating 15 flashcards",
      output_key: "flashcards",
      model: "gpt-4o-mini",
      max_tokens: 800,
      prompt: (input, ctx) =>
        `Create 15 flashcards from:\n${ctx.previous_outputs.study_guide}\n\nCARD [n]\nFront: [term]\nBack: [definition + example]`,
    },
    {
      name: "Summary Notes",
      description: "Writing one-page exam notes",
      output_key: "summary_notes",
      model: "gpt-4o-mini",
      max_tokens: 500,
      prompt: (input, ctx) =>
        `Write a one-page exam summary for: "${input}" (review 10 min before exam)\n\nFrom: ${ctx.previous_outputs.study_guide}`,
    },
  ],
};

// ── MATH CHAIN ────────────────────────────────────────────────────────────────
export const mathChain: Record<ChainDepth, ChainStep[]> = {
  quick: [
    {
      name: "Solve",
      description: "Solving step by step",
      output_key: "solution",
      model: "gpt-4o",
      max_tokens: 600,
      prompt: (input) =>
        `Solve step-by-step:\n\n${input}\n\nStep 1, Step 2... Final Answer:`,
    },
    {
      name: "Concept",
      description: "Explaining the math concept",
      output_key: "concept",
      model: "gpt-4o-mini",
      max_tokens: 300,
      prompt: (input, ctx) =>
        `What concept/formula was used?\nProblem: ${input}\nSolution: ${ctx.previous_outputs.solution}\n\nExplain in 2-3 sentences.`,
    },
  ],
  standard: [
    {
      name: "Solve",
      description: "Full step-by-step solution",
      output_key: "solution",
      model: "gpt-4o",
      max_tokens: 800,
      prompt: (input) =>
        `Solve:\n\n${input}\n\nGiven / Find / Steps / Final Answer / Check`,
    },
    {
      name: "Concept",
      description: "Explaining the formula used",
      output_key: "concept",
      model: "gpt-4o-mini",
      max_tokens: 400,
      prompt: (input, ctx) =>
        `Explain the concept for: ${input}\nSolution: ${ctx.previous_outputs.solution}\n\nInclude formula and when to use it.`,
    },
    {
      name: "Practice Problems",
      description: "Creating 3 similar problems",
      output_key: "practice",
      model: "gpt-4o-mini",
      max_tokens: 500,
      prompt: (input) =>
        `Create 3 similar problems to: "${input}" (easy/medium/hard) with answers.`,
    },
  ],
  full: [
    {
      name: "Solve",
      description: "Complete solution with verification",
      output_key: "solution",
      model: "gpt-4o",
      max_tokens: 1000,
      prompt: (input) =>
        `Solve completely with all work shown:\n\n${input}`,
    },
    {
      name: "Concept Deep Dive",
      description: "Full concept explanation",
      output_key: "concept",
      model: "gpt-4o",
      max_tokens: 600,
      prompt: (input, ctx) =>
        `Deep dive: concept, formula, derivation, common mistakes, shortcuts for: ${input}\nSolution: ${ctx.previous_outputs.solution}`,
    },
    {
      name: "Practice Problems",
      description: "5 practice problems",
      output_key: "practice",
      model: "gpt-4o-mini",
      max_tokens: 700,
      prompt: (input) =>
        `5 practice problems (1 easy, 2 medium, 2 hard) similar to: "${input}" with full solutions.`,
    },
    {
      name: "Cheat Sheet",
      description: "Building formula reference sheet",
      output_key: "cheat_sheet",
      model: "gpt-4o-mini",
      max_tokens: 400,
      prompt: (input) =>
        `Mini cheat sheet for the math topic in: "${input}" — formulas, rules, examples.`,
    },
  ],
};

// ── WRITING CHAIN ─────────────────────────────────────────────────────────────
export const writingChain: Record<ChainDepth, ChainStep[]> = {
  quick: [
    {
      name: "Draft",
      description: "Writing your document",
      output_key: "draft",
      model: "gpt-4o",
      max_tokens: 1000,
      prompt: (input) => `Write this clearly and well:\n\n${input}`,
    },
  ],
  standard: [
    {
      name: "Outline",
      description: "Building the structure",
      output_key: "outline",
      model: "gpt-4o-mini",
      max_tokens: 400,
      prompt: (input) =>
        `Create a clear outline for: "${input}"\n\nThesis, main points (3-4), supporting details, conclusion.`,
    },
    {
      name: "Full Draft",
      description: "Writing the complete draft",
      output_key: "draft",
      model: "gpt-4o",
      max_tokens: 1200,
      prompt: (input, ctx) =>
        `Write a complete, polished document for: "${input}"\n\nOutline:\n${ctx.previous_outputs.outline}`,
    },
    {
      name: "Improvements",
      description: "Suggesting edits",
      output_key: "improvements",
      model: "gpt-4o-mini",
      max_tokens: 400,
      prompt: (input, ctx) =>
        `Suggest 3-5 specific improvements for:\n\n${ctx.previous_outputs.draft}`,
    },
  ],
  full: [
    {
      name: "Research Notes",
      description: "Gathering key information",
      output_key: "research",
      model: "gpt-4o",
      max_tokens: 600,
      prompt: (input) =>
        `Key facts and arguments for: "${input}" — list 8-10 strong points with details.`,
    },
    {
      name: "Outline",
      description: "Detailed structure",
      output_key: "outline",
      model: "gpt-4o-mini",
      max_tokens: 400,
      prompt: (input, ctx) =>
        `Detailed outline for: "${input}"\nResearch: ${ctx.previous_outputs.research}\n\n4-5 sections with subpoints.`,
    },
    {
      name: "Full Draft",
      description: "Writing the complete document",
      output_key: "draft",
      model: "gpt-4o",
      max_tokens: 1600,
      prompt: (input, ctx) =>
        `Write a compelling document for: "${input}"\nOutline: ${ctx.previous_outputs.outline}\nResearch: ${ctx.previous_outputs.research}`,
    },
    {
      name: "Polish",
      description: "Final polish",
      output_key: "final",
      model: "gpt-4o",
      max_tokens: 1600,
      prompt: (input, ctx) =>
        `Polish this draft — fix transitions, strengthen opening/closing:\n\n${ctx.previous_outputs.draft}`,
    },
  ],
};

// ── FOOD CHAIN ────────────────────────────────────────────────────────────────
export const foodChain: Record<ChainDepth, ChainStep[]> = {
  quick: [
    {
      name: "Nutrition Analysis",
      description: "Analyzing your meal",
      output_key: "nutrition",
      model: "gpt-4o",
      max_tokens: 600,
      prompt: (input, ctx) =>
        `Identify and analyze nutrition:\n${input}\n\nFood name, Calories, Protein(g), Carbs(g), Fat(g), Sugar(g), Fiber(g), AI Insight (2 sentences)`,
    },
  ],
  standard: [
    {
      name: "Nutrition Analysis",
      description: "Complete nutritional breakdown",
      output_key: "nutrition",
      model: "gpt-4o",
      max_tokens: 700,
      prompt: (input, ctx) =>
        `Full nutrition analysis: ${input}\nGoal: ${ctx.goal || "stay healthy"}\n\nMacros, micronutrients, portion estimate, health tags.`,
    },
    {
      name: "Health Insight",
      description: "Personalized recommendation",
      output_key: "insight",
      model: "gpt-4o-mini",
      max_tokens: 400,
      prompt: (input, ctx) =>
        `Goal: ${ctx.goal || "stay healthy"}\nFood: ${ctx.previous_outputs.nutrition}\n\n3-sentence insight: good for goal? What to pair with? Alternatives?`,
    },
  ],
  full: [
    {
      name: "Nutrition Analysis",
      description: "Complete breakdown",
      output_key: "nutrition",
      model: "gpt-4o",
      max_tokens: 800,
      prompt: (input, ctx) =>
        `Complete nutrition: ${input}\nGoal: ${ctx.goal || "stay healthy"}\n\nMacros, vitamins/minerals, glycemic index, allergens, portion size.`,
    },
    {
      name: "Health Insight",
      description: "AI health recommendation",
      output_key: "insight",
      model: "gpt-4o",
      max_tokens: 500,
      prompt: (input, ctx) =>
        `Nutrition: ${ctx.previous_outputs.nutrition}\nGoal: ${ctx.goal || "stay healthy"}\n\nFits goal? Pair with? Healthier alternatives? Best time to eat?`,
    },
    {
      name: "Meal Plan Suggestions",
      description: "Rest-of-day meal suggestions",
      output_key: "suggestions",
      model: "gpt-4o-mini",
      max_tokens: 400,
      prompt: (input, ctx) =>
        `Already ate: ${input}\nGoal: ${ctx.goal || "stay healthy"}\n\nSuggest 3 complementary foods for the rest of the day.`,
    },
  ],
};

// ── LANGUAGE CHAIN ────────────────────────────────────────────────────────────
export const languageChain: Record<ChainDepth, ChainStep[]> = {
  quick: [
    {
      name: "Translate & Explain",
      description: "Translation with context",
      output_key: "translation",
      model: "gpt-4o",
      max_tokens: 400,
      prompt: (input, ctx) =>
        `Translate: "${input}" in ${ctx.language || "Spanish"}\n\nTranslation, pronunciation, usage example, cultural notes.`,
    },
  ],
  standard: [
    {
      name: "Translate & Explain",
      description: "Full translation with context",
      output_key: "translation",
      model: "gpt-4o",
      max_tokens: 500,
      prompt: (input, ctx) =>
        `Translate "${input}" in ${ctx.language || "Spanish"}\n\nTranslation, pronunciation, part of speech, formal vs informal, 2 examples.`,
    },
    {
      name: "Related Words",
      description: "Building vocabulary network",
      output_key: "related_words",
      model: "gpt-4o-mini",
      max_tokens: 400,
      prompt: (input, ctx) =>
        `5 related words/phrases for "${input}" in ${ctx.language || "Spanish"} with translations.`,
    },
    {
      name: "Practice Sentences",
      description: "Creating practice sentences",
      output_key: "practice",
      model: "gpt-4o-mini",
      max_tokens: 400,
      prompt: (input, ctx) =>
        `3 practice sentences using "${input}" in ${ctx.language || "Spanish"}\n\n[target language]\nTranslation: [English]\nContext: [when to use]`,
    },
  ],
  full: [
    {
      name: "Deep Translation",
      description: "Complete language breakdown",
      output_key: "translation",
      model: "gpt-4o",
      max_tokens: 600,
      prompt: (input, ctx) =>
        `Deep dive: "${input}" in ${ctx.language || "Spanish"}\n\nTranslation, pronunciation, etymology, formal/informal, regional variations, common mistakes.`,
    },
    {
      name: "Vocabulary Network",
      description: "Related words and expressions",
      output_key: "related_words",
      model: "gpt-4o",
      max_tokens: 500,
      prompt: (input, ctx) =>
        `Vocabulary network for "${input}" in ${ctx.language || "Spanish"}: synonyms, antonyms, collocations, idioms.`,
    },
    {
      name: "Dialogue Practice",
      description: "Natural conversation practice",
      output_key: "dialogue",
      model: "gpt-4o",
      max_tokens: 500,
      prompt: (input, ctx) =>
        `Short 6-8 line dialogue in ${ctx.language || "Spanish"} using "${input}"\n\n[language line]\nTranslation: [English]`,
    },
  ],
};

// ── CHAIN SELECTOR ────────────────────────────────────────────────────────────
export function getChainSteps(chain: ChainType, depth: ChainDepth): ChainStep[] {
  switch (chain) {
    case "study":    return studyChain[depth];
    case "math":     return mathChain[depth];
    case "writing":  return writingChain[depth];
    case "food":     return foodChain[depth];
    case "language": return languageChain[depth];
    default:         return studyChain[depth];
  }
}

// ── DOCUMENT COMPILER ─────────────────────────────────────────────────────────
export function compileDocument(chain: ChainType, results: StepResult[], input: string): string {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const lines = [
    `AI SNAPSOLVE — AUTONOMOUS OUTPUT`,
    `Generated: ${date}`,
    `Topic: ${input}`,
    `Chain: ${chain.toUpperCase()}`,
    "=".repeat(50),
    "",
  ];
  for (const step of results) {
    lines.push(`## ${step.step_name.toUpperCase()}`);
    lines.push(step.result);
    lines.push("");
    lines.push("-".repeat(40));
    lines.push("");
  }
  return lines.join("\n");
}
