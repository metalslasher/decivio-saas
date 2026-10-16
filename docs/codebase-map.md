# Codebase Map

Status: current repository map (hiring assistant, since 2026-10-16).

## Public Product Flow

- `/`: landing page (`src/app/page.tsx`, animated hero demo in `src/components/landing/hero-demo.tsx`).
- `/hire/new`: vacancy builder — brief → AI draft → editor with live candidate-form preview → publish (auth).
- `/hire`: employer cabinet — list of vacancies with candidate counts.
- `/hire/[vacancyId]`: shortlist — candidates ranked by AI score, statuses, apply link, posting text.
- `/apply/[slug]`: public mobile-first candidate application (no registration).
- `/pricing`, `/checkout`, `/billing/return`: monobank billing flow (copy still needs a rework, see roadmap).
- `/login`, `/signup`, `/reset-password`, `/auth/callback`: auth. Default post-auth destination is `/hire`.
- `/dashboard`: legacy URL, redirects to `/hire`.

## Main Directories

- `src/lib/hiring`: hiring domain.
  - `types.ts`: shared types and labels (client + server).
  - `validate.ts`: parsing/normalising vacancy content, AI screening output, phone numbers.
  - `ai.ts` (server-only): OpenAI structured outputs for vacancy drafts and candidate screening, deterministic knockout detection, test-mode mocks.
  - `store.ts` (server-only): Supabase access for vacancies and applications.
  - `http.ts` (server-only): API route helpers (auth, rate limit, errors).
  - `client.ts` (browser): authorised fetch, draft persistence in localStorage, clipboard, apply-link helpers.
- `src/components/hiring`: builder, apply flow, cabinet, vacancy workspace, session hook.
- `src/app/api/hiring/*`: employer APIs (draft generation is public + rate-limited; the rest require auth).
- `src/app/api/apply/[slug]`: public candidate submission (rate-limited, screening never blocks saving).
- `src/lib/db`: Supabase clients.
- `src/lib/billing*.ts`, `src/lib/mono-acquiring.ts`, `src/app/api/payments/mono/*`: monobank payments.
- `supabase/migrations`: schema; hiring tables in `20261016120000_add_hiring_core.sql`.
- `docs`: product concept, roadmap, engineering references.

## Boundary Rules

- All hiring tables are accessed only from server routes with the service role; ownership is checked in `store.ts`.
- AI prompts live in `src/lib/hiring/ai.ts` and must keep the fairness rules from `product-concept.md`.
- Keep route files thin; business rules in `src/lib/hiring`.
- Test mode: `DECIVIO_TEST_MODE=1` (non-production only) returns deterministic AI mocks.
