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
- [ ] Email notification to employer on new strong candidate (Telegram covers this for now; needs an email provider such as Resend).
- [x] E2E flow test rewritten (`tests/e2e/critical-flow.spec.ts`): guest draft → login → auto-publish → mobile apply → scored candidate → free vacancy limit 402. Run: `npx playwright test --config=playwright.flow.config.ts` (needs local Supabase; stop other dev servers first).
- [x] `/hire/billing`: plan, period end, usage, cancel monthly mono subscription (`POST /api/merchant/subscription/edit` with `action: "cancel"`). Cancel was verified only up to the confirm step locally — the real mono call is untested.
- [x] Re-screen unscored candidates (`POST /api/hiring/vacancies/<id>/rescreen`, batches of 5, respects free quota).

## Iteration 3 — Growth Channels

- [x] Telegram bot as a second candidate channel (`src/lib/telegram/*`, webhook `/api/telegram/webhook`, migration `20261017120000_add_telegram_channel.sql`). Deep link `t.me/<bot>?start=<slug>`; questions as inline buttons, name suggestion, phone via "share contact"; same screening and plan limits as web; duplicate protection per Telegram user. Covered by the e2e test (fake updates in test mode). Not yet tried with a real bot.
- [x] Employer Telegram notifications (`src/lib/telegram/employer.ts`, migration `20261017150000_add_employer_notifications.sql`): cabinet card "Підключити Telegram" → one-time `t.me/<bot>?start=e_<token>` (30 min) → chat linked; levels strong / all / off; card with score, strengths, phone and buttons "Запросити" / "Відмова" that change the status (only from the linked chat). Card is hidden until the bot token and username are configured. Covered by the e2e test.
- [x] Interview slot booking (`src/lib/hiring/interview.ts`, `slots.ts`, migration `20261017180000_add_interview_booking.sql`). Employer sets location + slots (14-day picker, Kyiv local time strings) in "Співбесіди"; "Запросити" creates a booking link `/interview/<token>`; Telegram candidates get slot buttons from the bot automatically, web candidates get a ready Viber/SMS message to copy. One candidate per slot (unique index), employer notified in Telegram on booking. Covered by the e2e test.
- [ ] Interview reminders (day before) for candidates in Telegram — needs a scheduled job (Vercel Cron).
- [x] Funnel events pushed to GTM `dataLayer` (`src/lib/analytics.ts`, 13 events, no personal data). Owner action: in GTM add Custom Event triggers and GA4 event tags for them.
- [x] SEO role pages `/roles/<slug>` for 10 roles (`src/lib/seo-roles.ts`), in sitemap, linked from landing chips; CTA prefills the builder via `/hire/new?brief=`.
- [ ] SEO city variants (role × city) once role pages show impressions in Search Console.

Verified locally on 2026-10-16 with real OpenAI: draft generation (~20 s), publish after login (auto-publish via `?publish=1`), candidate flow on 375px mobile, screening (strong 85 → call, knockout 20 → reject, junior 65 → maybe), shortlist on mobile without horizontal overflow, `next build` passes.

## Production Launch (2026-10-17)

- [x] 7 migrations pushed to production Supabase (incl. 3 older May migrations that had never been applied). Note: `supabase db push` via the CLI login role fails for this project; use `--db-url` with the session pooler `aws-0-eu-west-1.pooler.supabase.com:5432`, user `postgres.<ref>`.
- [x] `main` pushed, Vercel deployed; `scripts/smoke-check.mjs https://www.decivio.net --ai` passes (real AI draft OK).
- [x] Telegram bot @decivio_bot: webhook registered, secret matches Vercel, username baked into the build.
- [ ] Owner: manual walkthrough from a phone (see `launch-checklist.md` step 5.3).
- [ ] Owner: rotate the database password (it was shared in chat).
- [ ] Add GA4 event tags in GTM for the funnel events (names in `src/lib/analytics.ts`).
- [ ] Submit the sitemap in Google Search Console.

## Known Gaps / Notes

- Auth dialog default `nextPath` points to `/hire`; signup/login dialog now has a view toggle.
- Local test employer account credentials are in `.env.local` (`DEV_TEST_EMAIL` / `DEV_TEST_PASSWORD`, local Supabase only).
- AI pay hints were low without anchors; the prompt now includes 2026 market anchors — revisit quarterly.
- Legacy tables (`simulations`, `simulation_results`, `lead_requests`, `guest_sessions`) still exist in the DB; drop them in a later migration once production is migrated.
