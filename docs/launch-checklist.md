# Launch Checklist

Status: production launch of the hiring assistant (branch `pivot/hiring-assistant`), prepared 2026-10-17.

Order matters: **database first, then env vars, then code.** The new code queries new tables; the old code ignores them, so applying migrations before the deploy is safe.

## 1. Telegram bot — owner (5 min)

1. Open @BotFather in Telegram → `/newbot`.
2. Name: `Decivio — вакансії` (any). Username: must end with `bot`, e.g. `DecivioJobsBot`.
3. Copy the token BotFather sends. Keep it secret — anyone with it controls the bot.
4. Optional: `/setuserpic` with the Decivio logo.

## 2. Supabase production — owner (10 min)

1. Supabase dashboard → Project Settings → Database → copy (or reset) the database password.
2. In a terminal in the project folder (the project is already linked):

   ```bash
   supabase migration list
   ```

   Remote should already have everything up to `20260513170336`. Then:

   ```bash
   supabase db push
   ```

   It applies 4 new migrations:
   - `20261016120000_add_hiring_core.sql` — vacancies and applications
   - `20261017120000_add_telegram_channel.sql` — bot dialogs, application source
   - `20261017150000_add_employer_notifications.sql` — employer Telegram notifications
   - `20261017180000_add_interview_booking.sql` — interview slots and booking

   No SQL editor? Paste the four files into Supabase → SQL Editor in this order.
3. Authentication → URL Configuration: Site URL `https://www.decivio.net`, Redirect URLs include `https://www.decivio.net/auth/callback`.

## 3. Vercel environment variables — owner (10 min)

Vercel → project `decivio-saas` → Settings → Environment Variables → Production.

Already used before (check they exist):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | production service role key |
| `MONO_ACQUIRING_TOKEN` | monobank acquiring token |
| `NEXT_PUBLIC_SITE_URL` | `https://www.decivio.net` |
| `OPENAI_API_KEY` | OpenAI key |

New or changed:

| Name | Value |
| --- | --- |
| `OPENAI_MODEL` | `gpt-4o` (the model the AI flow was verified with locally) |
| `TELEGRAM_BOT_TOKEN` | token from BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | any long random string, e.g. output of `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"` |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | bot username without `@`, e.g. `DecivioJobsBot` |

Make sure `DECIVIO_TEST_MODE` is **not** set in Production.

## 4. Deploy — Claude after owner's go-ahead

- `pivot/hiring-assistant` is merged into local `main` (fast-forward).
- `git push origin main` → Vercel builds and deploys `main`. Push only after steps 2 and 3.

## 5. After deploy (15 min)

1. Connect the bot (needs the token and secret in the terminal environment or `.env.local`):

   ```bash
   node scripts/telegram-setup.mjs https://www.decivio.net
   ```

2. Automatic check (pages, migrations, auth, webhook, one real AI draft):

   ```bash
   node scripts/smoke-check.mjs https://www.decivio.net --ai
   ```

3. Manual walkthrough on a phone:
   - create a vacancy on `/hire/new`, publish (registers an account);
   - in the cabinet: "Підключити Telegram" → press Start in the bot;
   - open the apply link from another phone/browser and apply → a candidate with a score appears, a Telegram card arrives if strong;
   - apply through the bot link `t.me/<bot>?start=<slug>`;
   - add interview slots, press "Запросити" → book a time via the link / bot buttons;
   - test payment for Pro on `/pricing` (real mono checkout — refund afterwards or use the cheapest plan).
4. Google Tag Manager: Custom Event triggers + GA4 event tags for the names in `src/lib/analytics.ts`.
5. Google Search Console: submit `https://www.decivio.net/sitemap.xml`.

## Rollback

Vercel → Deployments → previous deployment → "Promote to Production". Migrations are additive, so the old code keeps working with the new schema; no database rollback is needed.
