# Roadmap And Handoff

Status: living document. Update at the end of every work session so the next session can continue without re-discovery.

Read first: `product-concept.md`.

## Context For A New Session

- Branch `pivot/hiring-assistant` holds the pivot. Commit `7be1c16a` is a snapshot of the old B2C career workspace (kept only in git history).
- The old career flow (`/simulate`, `/results`, career dashboard, vacancy-fit for job seekers) was deleted on purpose. Do not restore it.
- Local dev uses local Supabase (`supabase start`, needs Docker Desktop) and `DECIVIO_TEST_MODE=1` for mock AI.
- Production runs on Vercel with a remote Supabase project; new migrations must be pushed with `supabase db push` by the owner.
- Payments: monobank acquiring only (Ukrainian FOP). Billing code lives in `src/lib/billing*.ts`, `src/lib/mono-acquiring.ts`, `/api/payments/mono/*`.

## Iteration 1 — Core Hiring Loop (2026-10-16)

Goal: the wow loop works end to end locally.

- [x] New concept and roadmap docs.
- [x] Remove old career product code and specs.
- [x] DB: `hiring_vacancies`, `hiring_applications` migration.
- [x] AI: vacancy draft generation + candidate screening (OpenAI structured output, mock in test mode).
- [x] `/hire/new` builder with live candidate-form preview.
- [x] Publish vacancy (auth) → `/apply/<slug>` candidate flow.
- [x] `/hire` cabinet and `/hire/<id>` ranked shortlist with statuses.
- [x] New landing page.

## Iteration 2 — Monetization And Polish

- [ ] Free limits (1 active vacancy / 10 screened candidates) enforced in API.
- [ ] Rework `/pricing` + `src/lib/pricing.ts` to Free / Pro 990 UAH; reuse mono checkout.
- [ ] Rewrite privacy/terms for candidate personal data processing (owner = data controller, Decivio = processor).
- [ ] Edit vacancy after publish; close / reopen vacancy.
- [ ] QR code + downloadable poster for the apply link.
- [ ] Email notification to employer on new strong candidate.
- [ ] Update e2e flow test for the new loop.

## Iteration 3 — Growth Channels

- [ ] Telegram bot as an alternative candidate channel.
- [ ] Candidate auto-reply / interview slot booking.
- [ ] Analytics events in GTM for funnel metrics from `product-concept.md`.
- [ ] Landing SEO pages per role/city ("як найняти баристу у Києві").

Verified locally on 2026-10-16 with real OpenAI: draft generation (~20 s), publish after login (auto-publish via `?publish=1`), candidate flow on 375px mobile, screening (strong 85 → call, knockout 20 → reject, junior 65 → maybe), shortlist on mobile without horizontal overflow, `next build` passes.

## Before First Deploy (owner actions)

- [ ] Push migration to production: `supabase link --project-ref <ref>` then `supabase db push`.
- [ ] Make sure `OPENAI_API_KEY` / `OPENAI_MODEL` are set in Vercel.
- [ ] Merge `pivot/hiring-assistant` into `main` (Vercel deploys `main`).

## Known Gaps / Notes

- Auth dialog default `nextPath` points to `/hire`; signup/login dialog now has a view toggle.
- `/pricing` page body still has old layout (plans/prices already updated in `src/lib/pricing.ts`); rebuild in iteration 2.
- Privacy/terms texts still describe the old career product — must be rewritten before real candidates submit data.
- `robots.ts` does not disallow `/hire` and `/apply` yet (pages are `noIndex` via metadata).
- Free-plan limits are not enforced yet.
- Local test employer account credentials are in `.env.local` (`DEV_TEST_EMAIL` / `DEV_TEST_PASSWORD`, local Supabase only).
- AI pay hints were low without anchors; the prompt now includes 2026 market anchors — revisit quarterly.
- Legacy tables (`simulations`, `simulation_results`, `lead_requests`, `guest_sessions`) still exist in the DB; drop them in a later migration once production is migrated.
