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

- [x] `robots.ts` blocks cabinet, apply pages, checkout; `/hire/new` stays indexable.
- [x] Free limits enforced in API (`src/lib/hiring/plan.ts`): 1 active vacancy (create + reopen → 402), 10 AI-screened candidates per account (after that candidates are still saved, just unscored). Usage banner in cabinet and shortlist.
- [x] `/pricing` rebuilt (Start / Pro 990 / Pro 90 days 2490, comparison table); reuses mono checkout via `PricingPurchaseButton`.
- [x] Privacy/terms rewritten for the hiring product (candidate data, controller/processor roles, OpenAI, anti-discrimination). Have a lawyer review before scaling.
- [x] Close / reopen vacancy (respects the active-vacancy limit).
- [ ] Edit vacancy text and questions after publish.
- [ ] QR code + downloadable poster for the apply link.
- [ ] Email notification to employer on new strong candidate.
- [ ] Update e2e flow test for the new loop.
- [ ] Subscription management for employers (see plan/expiry, cancel monthly mono subscription) — the old dashboard "access" view was removed.
- [ ] Re-screen unscored candidates after upgrading to Pro.

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
- Local test employer account credentials are in `.env.local` (`DEV_TEST_EMAIL` / `DEV_TEST_PASSWORD`, local Supabase only).
- AI pay hints were low without anchors; the prompt now includes 2026 market anchors — revisit quarterly.
- Legacy tables (`simulations`, `simulation_results`, `lead_requests`, `guest_sessions`) still exist in the DB; drop them in a later migration once production is migrated.
