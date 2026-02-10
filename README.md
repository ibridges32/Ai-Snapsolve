# AI SnapSolve Backend (Vercel)

Serverless backend for AI SnapSolve hosted on Vercel.
- Protects OpenAI key (never shipped to client)
- Verifies Supabase JWT
- Exposes /api endpoints the mobile app calls

## Endpoints
- GET /api/health
- POST /api/ai/solve

## Environment Variables (Vercel)
See .env.example
