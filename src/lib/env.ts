import { z } from "zod";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  // Example: https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
  SUPABASE_JWKS_URL: z.string().url(),
});

export const env = EnvSchema.parse(process.env);
