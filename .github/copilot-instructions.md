# Copilot instructions for this repo

This file is a concise reference for AI coding agents working in this codebase. Focus on concrete, discoverable patterns and examples.

- **Big picture:** A Vite + React (TSX) frontend that uses Supabase for auth, profiles, and serverless functions. The app calls Google GenAI (Gemini) via `@google/genai` from `services/geminiService.ts` to generate vehicle analyses. Payments use Mercado Pago via Supabase Edge Functions (`supabase/functions/create-pix` + `mp-webhook`).

- **Start / build / run:**
  - Install: `npm install`
  - Dev: `npm run dev` (Vite)
  - Build: `npm run build` (runs `tsc && vite build`)

- **Important env vars (use `.env.local`):**
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — client SDK (used in `services/supabaseClient.ts`).
  - `VITE_SITE_URL` — redirect target for OAuth (used in `services/authService.ts`).
  - `API_KEY` or `GEMINI_API_KEY` — Gemini / Google GenAI key (note: code references `process.env.API_KEY` in `services/geminiService.ts`, README references `GEMINI_API_KEY`).
  - `MP_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` — required by the Supabase Deno functions under `supabase/functions`.

- **Key files to inspect when changing behavior:**
  - Frontend entry: `index.tsx`, `App.tsx`.
  - UI components: `components/PropertyForm.tsx`, `AnalysisResult.tsx`, `LoginScreen.tsx`.
  - Supabase client and auth: `services/supabaseClient.ts`, `services/authService.ts`.
  - AI integration: `services/geminiService.ts` — contains prompt construction, calls to `GoogleGenAI`, and `parseResponse()` that expects specially-delimited sections (`[[SEÇÃO 1]]`..`[[SEÇÃO 4]]`) and JSON at the end.
  - Payments and serverless: `services/paymentService.ts` and `supabase/functions/{create-pix,mp-webhook}`.

- **Patterns & conventions to follow:**
  - Many services assume `supabase` may be `null` (mock mode). Check `services/supabaseClient.ts` for the early guard. Preserve checks before using `supabase`.
  - Gemini responses are parsed by markers. When changing prompts, keep the `[[SEÇÃO X]]` markers and final JSON block so `parseResponse()` continues to work.
  - Payments: `create-pix` creates a Mercado Pago payment with `external_reference = userId`; `mp-webhook` uses that to set `profiles.is_pro = true`. Do not change the `external_reference` behavior without updating both function and `paymentService` logic.
  - Deno-based Supabase functions expect specific env vars and return 200 quickly for webhooks — follow the same CORS headers and response conventions.

- **Integration notes / gotchas:**
  - `services/geminiService.ts` uses `ai.models.generateContent({ model: "gemini-3-flash-preview" })` and requests a `tools: [{ googleSearch: {} }]` grounding step — keep grounding metadata usage in mind when extracting sources (`groundingMetadata` => `groundingChunks`).
  - Environment var mismatch: README mentions `GEMINI_API_KEY` but `geminiService.ts` reads `API_KEY`. If adding automation, prefer checking both or documenting the expected variable.
  - Supabase functions are Deno modules under `supabase/functions` — deploy them with the Supabase CLI (not included here). They rely on `SUPABASE_SERVICE_ROLE_KEY` for server-side updates.

- **When modifying prompts or parsing:**
  - Update `services/geminiService.ts::parseResponse()` together with prompt changes. Example: the front-end expects `AnalysisResponse.crmData` fields (`resumo_veiculo`, `faixa_preco_sugerida`, `nivel_dificuldade_venda`, `tags_sugeridas`). Keep JSON keys stable.

- **Examples to copy from:**
  - Prompt structure: see `services/geminiService.ts` — use `systemInstruction` with `[[SEÇÃO 1]]`..`[[SEÇÃO 4]]` and include local context like `UF`, `Modelo`, `KM`, `Preço`.
  - Payment flow: frontend -> `services/paymentService.createPixPayment()` -> Supabase Function `create-pix` -> Mercado Pago -> `mp-webhook` updates `profiles.is_pro`.

- **Debugging tips:**
  - If Supabase is `null`, the client logs a warning and the app runs in mock mode — check env var names and lengths.
  - For payment issues, inspect function logs in Supabase (the functions use `console.log`) and confirm `MP_ACCESS_TOKEN` and `notification_url` configuration.

If any part of this summary is unclear or you'd like more details (deploy commands for Supabase functions, or canonical env var names fixed in code), tell me which area to expand and I will update this file.
