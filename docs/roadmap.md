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
- [x] Edit vacancy text and questions after publish (`/hire/<id>/edit`, reuses `VacancyEditor` in edit mode).
- [x] Printable QR poster (`/hire/<id>/poster`, `qrcode` package, print CSS in `globals.css`).
- [ ] Email notification to employer on new strong candidate.
- [x] E2E flow test rewritten (`tests/e2e/critical-flow.spec.ts`): guest draft → login → auto-publish → mobile apply → scored candidate → free vacancy limit 402. Run: `npx playwright test --config=playwright.flow.config.ts` (needs local Supabase; stop other dev servers first).
- [x] `/hire/billing`: plan, period end, usage, cancel monthly mono subscription (`POST /api/merchant/subscription/edit` with `action: "cancel"`). Cancel was verified only up to the confirm step locally — the real mono call is untested.
- [x] Re-screen unscored candidates (`POST /api/hiring/vacancies/<id>/rescreen`, batches of 5, respects free quota).

## Iteration 3 — Growth Channels

- [ ] Telegram bot as an alternative candidate channel.
- [ ] Candidate auto-reply / interview slot booking.
- [x] Funnel events pushed to GTM `dataLayer` (`src/lib/analytics.ts`, 13 events, no personal data). Owner action: in GTM add Custom Event triggers and GA4 event tags for them.
- [x] SEO role pages `/roles/<slug>` for 10 roles (`src/lib/seo-roles.ts`), in sitemap, linked from landing chips; CTA prefills the builder via `/hire/new?brief=`.
- [ ] SEO city variants (role × city) once role pages show impressions in Search Console.

Verified locally on 2026-10-16 with real OpenAI: draft generation (~20 s), publish after login (auto-publish via `?publish=1`), candidate flow on 375px mobile, screening (strong 85 → call, knockout 20 → reject, junior 65 → maybe), shortlist on mobile without horizontal overflow, `next build` passes.

## Before First Deploy (owner actions)

- [ ] Push migration to production: `supabase link --project-ref <ref>` then `supabase db push`.
- [ ] Make sure `OPENAI_API_KEY` / `OPENAI_MODEL` are set in Vercel.
- [ ] Add GA4 event tags in GTM for the funnel events (names in `src/lib/analytics.ts`).
- [ ] Submit the sitemap in Google Search Console.
- [ ] Merge `pivot/hiring-assistant` into `main` (Vercel deploys `main`).

## Known Gaps / Notes

- Auth dialog default `nextPath` points to `/hire`; signup/login dialog now has a view toggle.
- Local test employer account credentials are in `.env.local` (`DEV_TEST_EMAIL` / `DEV_TEST_PASSWORD`, local Supabase only).
- AI pay hints were low without anchors; the prompt now includes 2026 market anchors — revisit quarterly.
- Legacy tables (`simulations`, `simulation_results`, `lead_requests`, `guest_sessions`) still exist in the DB; drop them in a later migration once production is migrated.
