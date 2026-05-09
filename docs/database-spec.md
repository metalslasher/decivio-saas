# Database Spec

Status: current as of the latest migrations in `supabase/migrations`.

This document mirrors the live schema and should not invent future tables. If the schema changes, add a migration first and update this file in the same commit.

## Source Of Truth

- Schema source: `supabase/migrations/*.sql`
- Supabase server client: `src/lib/db/supabase.ts`
- Browser client: `src/lib/db/supabase-browser.ts`
- Guest transfer: `src/lib/guest-simulation-transfer.ts`
- Billing persistence: `src/lib/billing-store.ts`
- Result payload mapping: `src/lib/simulation-results-payload.ts`

## Core Tables

### `profiles`

Extends `auth.users`.

Important columns:

- `id uuid primary key` references `auth.users(id)`
- `email text`
- `full_name text`
- `locale text default 'uk'`
- `timezone text`
- `avatar_url text`
- `profile_context jsonb not null default '{}'`
- `created_at timestamptz`
- `updated_at timestamptz`

Notes:

- `handle_new_auth_user()` creates/updates a profile row when Supabase Auth creates a user.
- The trigger also copies `full_name` or `name` from auth metadata.
- `profile_context` stores dashboard/profile answers and can be seeded from the simulation form.

### `subscriptions`

Stores access to paid dashboard features.

Important columns:

- `id uuid primary key`
- `user_id uuid` references `profiles(id)`
- `status text`: `free`, `trial`, `active`, `canceled`, `past_due`
- `plan text`: `free`, `pro`
- `current_period_end timestamptz`
- `provider text`
- `mono_invoice_id text`
- `mono_subscription_id text`
- `activated_at timestamptz`
- legacy Stripe columns still exist: `stripe_customer_id`, `stripe_subscription_id`

Current product behavior:

- Dashboard access is granted when `plan = 'pro'` and status is `active`, `trial`, or still-valid `canceled`.
- Annual access is activated from a successful mono invoice.
- Monthly access is activated from an active mono subscription.
- There is a unique index on `user_id`, so one user has one current subscription/access row.

### `guest_sessions`

Allows anonymous users to create a simulation before account creation.

Important columns:

- `id uuid primary key`
- `created_at timestamptz`
- `updated_at timestamptz`
- `last_seen_at timestamptz`

Current product behavior:

- `/api/simulations` creates or refreshes a guest session when no authenticated user exists.
- The guest session id is stored in an HTTP-only cookie.
- After signup/login, `/api/auth/claim-guest-simulations` attaches guest simulations/results to the user.

### `simulations`

One career-transition simulation submission.

Important columns:

- `id uuid primary key`
- `user_id uuid null` references `profiles(id)`
- `guest_session_id uuid null` references `guest_sessions(id)`
- `scenario_type text`: currently `career_switch`
- `status text`: `pending`, `processing`, `completed`, `failed`
- `inputs jsonb not null`
- `assumptions jsonb null`
- `version integer default 1`
- `created_at timestamptz`
- `updated_at timestamptz`

Owner rule:

- Exactly one of `user_id` or `guest_session_id` must be present.

Current `inputs` contract:

```json
{
  "current_income": 45000,
  "current_role": "Маркетолог",
  "current_experience_years": 5,
  "target_role": "Product Manager",
  "experience_level": "none|basic|practical",
  "english_level": "basic|intermediate|upper_intermediate|advanced",
  "target_market": "ukraine|remote|abroad",
  "transition_priority": "speed|income",
  "country": "UA"
}
```

### `simulation_results`

Stores generated analysis for one simulation.

Important columns:

- `id uuid primary key`
- `simulation_id uuid` references `simulations(id)`
- `user_id uuid null`
- `guest_session_id uuid null`
- `summary_metrics jsonb not null`
- `series jsonb not null`
- `ai_summary jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

Owner rule:

- Exactly one of `user_id` or `guest_session_id` must be present.

Current `summary_metrics` contract:

```json
{
  "verdict_label": "stay|switch|depends",
  "better_long_term_direction": "current_role|target_role|balanced",
  "ceiling_gap_median": 0,
  "probability_of_getting_job_within_12_months": 0.62,
  "risk_level": "low|medium|high",
  "current_best_case_median": 0,
  "target_best_case_median": 0,
  "current_confidence": 0.72,
  "target_confidence": 0.7
}
```

Current `ai_summary` contract:

```json
{
  "analysis": {
    "market_profile": {
      "current_role": {},
      "target_role": {},
      "comparison": {}
    },
    "narrative": {},
    "guidance": {
      "risk_assessment": {}
    }
  },
  "meta": {
    "model": "string",
    "latency_ms": 0,
    "web_search_used": true,
    "request_id": "string|null",
    "generated_at": "ISO date"
  }
}
```

`series` currently exists for compatibility, but the active results page does not depend on monthly financial series.

## Billing Tables

### `billing_checkouts`

Tracks a mono checkout attempt.

Important columns:

- `id uuid primary key`
- `user_id uuid` references `profiles(id)`
- `provider text`: currently `mono`
- `plan_id text`: `monthly`, `annual`
- `billing_kind text`: `subscription`, `one_time`
- `status text`: `pending`, `processing`, `paid`, `active`, `failed`, `canceled`, `expired`, `reversed`
- `amount integer`
- `ccy integer default 980`
- `mono_invoice_id text`
- `mono_subscription_id text`
- `mono_page_url text`
- `redirect_url text`
- `last_event_at timestamptz`
- `last_event_status text`

Current behavior:

- Annual plan uses `billing_kind = 'one_time'` and mono invoice.
- Monthly plan uses `billing_kind = 'subscription'` and mono subscription.
- Only one mono target can be set: invoice or subscription, not both.
- Access is granted when checkout status is `paid` or `active`.

### `billing_events`

Stores mono webhook/poll events with deduplication.

Important columns:

- `id uuid primary key`
- `user_id uuid`
- `checkout_id uuid null`
- `provider text`: `mono`
- `event_type text`
- `external_id text`
- `status text`
- `event_time timestamptz`
- `signature text`
- `dedupe_key text unique`
- `payload jsonb`
- `created_at timestamptz`

## Supporting Tables

### `request_rate_limits`

Stores server-side rate-limit windows.

Used by:

- `/api/simulations`
- `/api/simulations/[simulationId]`
- `/api/auth/claim-guest-simulations`
- mono checkout/status endpoints

Local E2E test mode bypasses rate limiting where needed.

### `simulation_projects`

Historical grouping table for simulations. It still exists in DB but is not part of the current public flow.

Do not build new product behavior on this table unless the dashboard simulation history is redesigned.

### `lead_requests`

Historical table for future service leads. It is not part of the current public flow.

Do not use it as an active product requirement unless a new lead-capture flow is explicitly designed.

## Storage

### `avatars` bucket

Used by dashboard profile avatar uploads.

Rules:

- Public read.
- Authenticated users can insert/update/delete only objects under their own user id folder.
- Allowed MIME types: JPEG, PNG, WebP.
- File size limit: 2 MB.

## RLS

All user-owned tables have RLS enabled.

General rule:

- Client-side reads are limited to the current `auth.uid()`.
- Guest simulation reads happen through server endpoints using the guest session cookie.
- Writes that require elevated access use the service-role server client.

## Local Test Mode

`DECIVIO_TEST_MODE=1` is allowed only outside production.

It currently does three things:

- `/api/simulations` does not require `OPENAI_API_KEY`.
- `generateCareerSwitchAnalysis()` returns a deterministic mock analysis.
- `/api/payments/mono/checkout` creates a local successful invoice/subscription record instead of calling mono.

This mode exists for automated E2E tests only. Do not expose it in production.
