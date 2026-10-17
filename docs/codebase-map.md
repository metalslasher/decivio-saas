# Codebase Map

Status: current repository map (hiring assistant, since 2026-10-16).

## Public Product Flow

- `/`: landing page (`src/app/page.tsx`, animated hero demo in `src/components/landing/hero-demo.tsx`).
- `/hire/new`: vacancy builder — brief → AI draft → editor with live candidate-form preview → publish (auth).
- `/hire`: employer cabinet — list of vacancies with candidate counts.
- `/hire/[vacancyId]`: shortlist — candidates ranked by AI score, statuses, apply link, posting text, re-screen of unscored candidates.
- `/hire/[vacancyId]/edit`: edit published vacancy (same editor as the builder).
- `/hire/[vacancyId]/poster`: printable A4 poster with a QR code to the apply link.
- `/hire/billing`: plan, usage, monthly subscription cancel.
- `/apply/[slug]`: public mobile-first candidate application (no registration).
- `/roles/[slug]`: static SEO landing pages per role (data in `src/lib/seo-roles.ts`).
- `/pricing`, `/checkout`, `/billing/return`: monobank billing flow.
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
- `src/lib/hiring/plan.ts` (server-only): plan resolution and free/pro limits.
- `src/app/api/billing/subscription`: billing overview (GET) and cancel (POST).
- `src/lib/analytics.ts`: GTM funnel events (`trackEvent`).
- `src/lib/hiring/submit.ts` (server-only): shared application submit (plan-aware screening + save) for web and Telegram.
- `src/lib/telegram`: candidate bot — `bot.ts` dialog engine returns Bot API actions, `api.ts` sends them; `/api/telegram/webhook` checks `TELEGRAM_WEBHOOK_SECRET` (in test mode returns actions instead of sending).
- `src/lib/telegram/employer.ts` + `/api/hiring/notifications`: employer chat linking, notify level, candidate notification cards with status buttons.
- `scripts/telegram-setup.mjs`: registers webhook, commands and description for the bot.
- `src/lib/db`: Supabase clients.
- `src/lib/billing*.ts`, `src/lib/mono-acquiring.ts`, `src/app/api/payments/mono/*`: monobank payments.
- `supabase/migrations`: schema; hiring tables in `20261016120000_add_hiring_core.sql`.
- `docs`: product concept, roadmap, engineering references.

## Boundary Rules

- All hiring tables are accessed only from server routes with the service role; ownership is checked in `store.ts`.
- AI prompts live in `src/lib/hiring/ai.ts` and must keep the fairness rules from `product-concept.md`.
- Keep route files thin; business rules in `src/lib/hiring`.
- Test mode: `DECIVIO_TEST_MODE=1` (non-production only) returns deterministic AI mocks.
