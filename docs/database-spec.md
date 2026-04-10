Ð‘Ð°Ð·Ð° Ð´Ð°Ð½Ð¸Ñ… (MVP) â€” Decivio Simulator
Ð¦Ñ–Ð»Ñ– Ð‘Ð”

Ð—Ð±ÐµÑ€Ñ–Ð³Ð°Ñ‚Ð¸ Ð¿Ñ€Ð¾Ñ„Ñ–Ð»ÑŒ ÐºÐ¾Ñ€Ð¸ÑÑ‚ÑƒÐ²Ð°Ñ‡Ð° Ñ‚Ð° Ð¹Ð¾Ð³Ð¾ Ð½Ð°Ð»Ð°ÑˆÑ‚ÑƒÐ²Ð°Ð½Ð½Ñ

Ð—Ð±ÐµÑ€Ñ–Ð³Ð°Ñ‚Ð¸ ÑÐ¸Ð¼ÑƒÐ»ÑÑ†Ñ–Ñ— (Ð²Ñ…Ñ–Ð´Ð½Ñ– Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€Ð¸)

Ð—Ð±ÐµÑ€Ñ–Ð³Ð°Ñ‚Ð¸ Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚Ð¸ Ñ€Ð¾Ð·Ñ€Ð°Ñ…ÑƒÐ½ÐºÑ–Ð² (Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ + ÑÑ†ÐµÐ½Ð°Ñ€Ñ–Ñ—)

Ð”Ð°Ñ‚Ð¸ Ð¼Ð¾Ð¶Ð»Ð¸Ð²Ñ–ÑÑ‚ÑŒ Ð¿Ð¾Ð²ÐµÑ€Ð½ÑƒÑ‚Ð¸ÑÑ, Ð¿Ð¾Ñ€Ñ–Ð²Ð½ÑÑ‚Ð¸, Ð²Ñ–Ð´Ñ€ÐµÐ´Ð°Ð³ÑƒÐ²Ð°Ñ‚Ð¸ Ñ– Ð¿ÐµÑ€ÐµÑ€Ð°Ñ…ÑƒÐ²Ð°Ñ‚Ð¸

ÐŸÑ–Ð´Ð³Ð¾Ñ‚ÑƒÐ²Ð°Ñ‚Ð¸ Ð¾ÑÐ½Ð¾Ð²Ñƒ Ð¿Ñ–Ð´ Ð¼Ð¾Ð½ÐµÑ‚Ð¸Ð·Ð°Ñ†Ñ–ÑŽ (Ð¿Ð»Ð°Ð½, Ð»Ñ–Ð¼Ñ–Ñ‚Ð¸, one-time purchase / pro)

ÐŸÑ–Ð´Ð³Ð¾Ñ‚ÑƒÐ²Ð°Ñ‚Ð¸ Ð¾ÑÐ½Ð¾Ð²Ñƒ Ð¿Ñ–Ð´ Ð¼Ð°Ð¹Ð±ÑƒÑ‚Ð½Ñ– ÑÐµÑ€Ð²Ñ–ÑÐ¸ (Ð°ÑƒÐ´Ð¸Ñ‚, Ñ€ÐµÐ·ÑŽÐ¼Ðµ, ÐºÐ¾Ð½ÑÐ°Ð»Ñ‚Ð¸Ð½Ð³) â€” ÑÐº â€œplaceholdersâ€ Ð±ÐµÐ· Ñ€ÐµÐ°Ð»Ñ–Ð·Ð°Ñ†Ñ–Ñ— Ð² MVP

1) Ð¡ÑƒÑ‚Ð½Ð¾ÑÑ‚Ñ– (Ñ‚Ð°Ð±Ð»Ð¸Ñ†Ñ–)
1.1 profiles

ÐŸÑ€Ð¸Ð·Ð½Ð°Ñ‡ÐµÐ½Ð½Ñ: Ñ€Ð¾Ð·ÑˆÐ¸Ñ€ÐµÐ½Ð½Ñ Ð¿Ñ€Ð¾Ñ„Ñ–Ð»ÑŽ ÐºÐ¾Ñ€Ð¸ÑÑ‚ÑƒÐ²Ð°Ñ‡Ð° (Ð½Ð°Ð´ Auth).

ÐŸÐ¾Ð»Ñ:

id UUID (PK) â€” = auth user id

email TEXT (optional, Ð¼Ð¾Ð¶Ð½Ð° Ñ‚ÑÐ³Ð½ÑƒÑ‚Ð¸ Ð· auth)

full_name TEXT NULL

locale TEXT DEFAULT 'uk'

timezone TEXT NULL

created_at TIMESTAMPTZ DEFAULT now()

updated_at TIMESTAMPTZ DEFAULT now()

Ð†Ð½Ð´ÐµÐºÑÐ¸:

PK Ð¿Ð¾ id

RLS:

user can select/update only own profile

1.2 subscriptions

ÐŸÑ€Ð¸Ð·Ð½Ð°Ñ‡ÐµÐ½Ð½Ñ: ÑÑ‚Ð°Ñ‚ÑƒÑ Ð´Ð¾ÑÑ‚ÑƒÐ¿Ñƒ (free/pro) + Ñ‚ÐµÑ…Ð½Ñ–Ñ‡Ð½Ñ– Ð´Ð°Ð½Ñ– Ð¿Ñ–Ð´ Stripe.

ÐŸÐ¾Ð»Ñ:

id UUID PK

user_id UUID FK â†’ profiles.id

status TEXT NOT NULL CHECK IN ('free','trial','active','canceled','past_due')

plan TEXT NOT NULL CHECK IN ('free','pro')

current_period_end TIMESTAMPTZ NULL

stripe_customer_id TEXT NULL

stripe_subscription_id TEXT NULL

created_at TIMESTAMPTZ DEFAULT now()

updated_at TIMESTAMPTZ DEFAULT now()

Ð†Ð½Ð´ÐµÐºÑÐ¸:

index on user_id

unique on stripe_customer_id (optional)

unique on stripe_subscription_id (optional)

RLS:

user can read only own subscription row

ÐŸÑ€Ð¸Ð¼Ñ–Ñ‚ÐºÐ°:

Ð’ MVP Ð¼Ð¾Ð¶Ð½Ð° Ð¿Ð¾ÐºÐ¸ Ð·Ð±ÐµÑ€Ñ–Ð³Ð°Ñ‚Ð¸ Ñ‚Ñ–Ð»ÑŒÐºÐ¸ plan/status Ð±ÐµÐ· Stripe Ñ–Ð½Ñ‚ÐµÐ³Ñ€Ð°Ñ†Ñ–Ñ—.

1.3 simulation_projects

ÐŸÑ€Ð¸Ð·Ð½Ð°Ñ‡ÐµÐ½Ð½Ñ: Ð³Ñ€ÑƒÐ¿ÑƒÐ²Ð°Ð½Ð½Ñ ÑÐ¸Ð¼ÑƒÐ»ÑÑ†Ñ–Ð¹ (Ð½Ð°Ð¿Ñ€Ð¸ÐºÐ»Ð°Ð´ â€œSwitch to Data Analyst 2026â€).

ÐŸÐ¾Ð»Ñ:

id UUID PK

user_id UUID FK â†’ profiles.id

title TEXT NOT NULL

description TEXT NULL

is_archived BOOLEAN DEFAULT false

created_at TIMESTAMPTZ DEFAULT now()

updated_at TIMESTAMPTZ DEFAULT now()

Ð†Ð½Ð´ÐµÐºÑÐ¸:

index on user_id

index on is_archived

RLS:

user can CRUD only own rows

1.4 simulations

ÐŸÑ€Ð¸Ð·Ð½Ð°Ñ‡ÐµÐ½Ð½Ñ: Ð¾Ð´Ð¸Ð½ Ð·Ð°Ð¿ÑƒÑÐº ÑÐ¸Ð¼ÑƒÐ»ÑÑ†Ñ–Ñ— (Ð²Ñ…Ñ–Ð´Ð½Ñ– Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€Ð¸ + Ñ‚Ð¸Ð¿).

ÐŸÐ¾Ð»Ñ:

id UUID PK

user_id UUID FK â†’ profiles.id

project_id UUID FK â†’ simulation_projects.id NULL (MVP Ð¼Ð¾Ð¶Ðµ Ð±ÑƒÑ‚Ð¸ NULL)

scenario_type TEXT NOT NULL CHECK IN ('career_switch') (MVP Ñ‚Ñ–Ð»ÑŒÐºÐ¸ Ñ†Ðµ)

name TEXT NULL (Ð½Ð°Ð¿Ñ€Ð¸ÐºÐ»Ð°Ð´ â€œOptimistic planâ€ â€” Ð½ÐµÐ¾Ð±Ð¾Ð²â€™ÑÐ·ÐºÐ¾Ð²Ð¾)

inputs JSONB NOT NULL (Ð²ÑÑ– Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€Ð¸ Ñ„Ð¾Ñ€Ð¼Ð¸)

assumptions JSONB NULL (Ð´ÐµÑ„Ð¾Ð»Ñ‚Ð½Ñ– ÐºÐ¾ÐµÑ„Ñ–Ñ†Ñ–Ñ”Ð½Ñ‚Ð¸, ÑÐºÑ‰Ð¾ Ñ‚Ð¸ Ñ—Ñ… Ð·Ð°ÐºÐ»Ð°Ð´ÐµÑˆ)

version INT DEFAULT 1 (Ð½Ð° Ð²Ð¸Ð¿Ð°Ð´Ð¾Ðº Ð·Ð¼Ñ–Ð½ Ð¼Ð¾Ð´ÐµÐ»Ñ–)

created_at TIMESTAMPTZ DEFAULT now()

updated_at TIMESTAMPTZ DEFAULT now()

Ð†Ð½Ð´ÐµÐºÑÐ¸:

index on user_id

index on project_id

index on scenario_type

GIN index on inputs (optional Ð½Ð° Ð¼Ð°Ð¹Ð±ÑƒÑ‚Ð½Ñ”)

RLS:

user can CRUD only own rows

Inputs JSONB (MVP Ñ€ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð¾Ð²Ð°Ð½Ð¸Ð¹ ÐºÐ¾Ð½Ñ‚Ñ€Ð°ÐºÑ‚):

current_income_monthly number

current_expenses_monthly number

current_savings number

employment_type string ('employment'|'freelance'|'contract')

target_role string (optional)

expected_income_monthly number

transition_months number

education_cost_one_time number

education_monthly_cost number (optional)

study_hours_per_week number (optional)

risk_profile string ('low'|'medium'|'high')

horizon_months number (12|36|60)

1.5 simulation_results

ÐŸÑ€Ð¸Ð·Ð½Ð°Ñ‡ÐµÐ½Ð½Ñ: Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚Ð¸ Ñ€Ð¾Ð·Ñ€Ð°Ñ…ÑƒÐ½ÐºÑƒ Ð´Ð»Ñ ÐºÐ¾Ð½ÐºÑ€ÐµÑ‚Ð½Ð¾Ñ— simulation_id.

ÐŸÐ¾Ð»Ñ:

id UUID PK

simulation_id UUID UNIQUE FK â†’ simulations.id

user_id UUID FK â†’ profiles.id (Ð´Ð»Ñ Ð¿Ñ€Ð¾ÑÑ‚Ð¸Ñ… Ð·Ð°Ð¿Ð¸Ñ‚Ñ–Ð² Ñ– RLS)

summary_metrics JSONB NOT NULL

series JSONB NOT NULL (Ð¼Ð°ÑÐ¸Ð²Ð¸ Ð¿Ð¾ Ð¼Ñ–ÑÑÑ†ÑÑ…)

ai_summary JSONB NULL (Ð¾Ð¿Ñ†Ñ–Ð¹Ð½Ð¾: Ñ‚ÐµÐºÑÑ‚/Ð±ÑƒÐ»Ñ–Ñ‚Ð¸/Ð¿Ð¾Ð¿ÐµÑ€ÐµÐ´Ð¶ÐµÐ½Ð½Ñ)

created_at TIMESTAMPTZ DEFAULT now()

updated_at TIMESTAMPTZ DEFAULT now()

Ð†Ð½Ð´ÐµÐºÑÐ¸:

unique index on simulation_id

index on user_id

RLS:

user can read only own results (Ñ‡ÐµÑ€ÐµÐ· user_id)

Summary_metrics JSONB (Ð¼Ñ–Ð½Ñ–Ð¼ÑƒÐ¼):

break_even_month number|null

cashflow_gap_total number

min_savings_balance number

risk_window_months number

roi_12m number

roi_36m number

roi_60m number

Series JSONB (Ð¼Ñ–Ð½Ñ–Ð¼ÑƒÐ¼):

baseline array of {month, income, expenses, net, savings_balance}

realistic array ...

optimistic array ...

pessimistic array ...

1.6 lead_requests (Ð¼Ð°Ð¹Ð±ÑƒÑ‚Ð½Ñ– paid-ÑÐµÑ€Ð²Ñ–ÑÐ¸)

ÐŸÑ€Ð¸Ð·Ð½Ð°Ñ‡ÐµÐ½Ð½Ñ: Ð·Ð°ÑÐ²ÐºÐ¸ Ð½Ð° Ð°ÑƒÐ´Ð¸Ñ‚/Ñ€ÐµÐ·ÑŽÐ¼Ðµ/ÐºÐ¾Ð½ÑÐ°Ð»Ñ‚Ð¸Ð½Ð³ (Ð½Ðµ Ð¾Ð±Ð¾Ð²â€™ÑÐ·ÐºÐ¾Ð²Ð¾ Ð² MVP UI, Ð°Ð»Ðµ Ñ‚Ð°Ð±Ð»Ð¸Ñ†Ñ Ð¾Ðº).

ÐŸÐ¾Ð»Ñ:

id UUID PK

user_id UUID FK â†’ profiles.id NULL (Ð´Ð¾Ð·Ð²Ð¾Ð»Ð¸Ñ‚Ð¸ Ð°Ð½Ð¾Ð½Ñ–Ð¼Ð½Ñ–)

type TEXT NOT NULL CHECK IN ('career_audit','resume_audit','consulting')

contact_email TEXT NOT NULL

details JSONB NULL (ÐºÐ¾Ñ€Ð¾Ñ‚ÐºÐ¸Ð¹ Ð¾Ð¿Ð¸Ñ)

status TEXT NOT NULL DEFAULT 'new' CHECK IN ('new','in_progress','done','canceled')

created_at TIMESTAMPTZ DEFAULT now()

updated_at TIMESTAMPTZ DEFAULT now()

Ð†Ð½Ð´ÐµÐºÑÐ¸:

index on type

index on status

index on user_id

RLS:

ÑÐºÑ‰Ð¾ user_id not null â€” ÑŽÐ·ÐµÑ€ Ð¼Ð¾Ð¶Ðµ Ñ‡Ð¸Ñ‚Ð°Ñ‚Ð¸ ÑÐ²Ð¾Ñ—

Ð°Ð½Ð¾Ð½Ñ–Ð¼Ð½Ñ– Ð·Ð°Ð¿Ð¸ÑÐ¸ â€” Ñ‚Ñ–Ð»ÑŒÐºÐ¸ Ñ‡ÐµÑ€ÐµÐ· backend/service role (Ð½Ðµ Ñ‡ÐµÑ€ÐµÐ· ÐºÐ»Ñ–Ñ”Ð½Ñ‚)

2) RLS (Row Level Security) â€” Ð²Ð¸Ð¼Ð¾Ð³Ð°

Ð£ÑÑ– Ñ‚Ð°Ð±Ð»Ð¸Ñ†Ñ– Ð· user data Ð¼Ð°ÑŽÑ‚ÑŒ RLS. ÐŸÐ¾Ð»Ñ–Ñ‚Ð¸ÐºÐ¸:

select/insert/update/delete Ñ‚Ñ–Ð»ÑŒÐºÐ¸ Ð´Ð»Ñ auth.uid() = user_id Ð°Ð±Ð¾ id (profiles)

lead_requests â€” Ð¾Ð±ÐµÑ€ÐµÐ¶Ð½Ð¾: Ð°Ð½Ð¾Ð½Ñ–Ð¼Ð½Ñ– Ð²ÑÑ‚Ð°Ð²ÐºÐ¸ Ñ‚Ñ–Ð»ÑŒÐºÐ¸ Ñ‡ÐµÑ€ÐµÐ· server endpoint

3) Ð¢Ñ€Ð¸Ð³ÐµÑ€Ð¸

updated_at Ð¼Ð°Ñ” Ð¾Ð½Ð¾Ð²Ð»ÑŽÐ²Ð°Ñ‚Ð¸ÑÑŒ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡Ð½Ð¾ Ð¿Ñ€Ð¸ UPDATE (trigger function)

4) Seed / Ð´ÐµÑ„Ð¾Ð»Ñ‚Ð¸

Ð¿Ñ€Ð¸ ÑÑ‚Ð²Ð¾Ñ€ÐµÐ½Ð½Ñ– ÑŽÐ·ÐµÑ€Ð° (auth) Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡Ð½Ð¾ ÑÑ‚Ð²Ð¾Ñ€ÑŽÐ²Ð°Ñ‚Ð¸ profiles row
(Ð¼Ð¾Ð¶Ð½Ð° Ñ‡ÐµÑ€ÐµÐ· Supabase trigger Ð°Ð±Ð¾ Ñ‡ÐµÑ€ÐµÐ· app logic Ð¿Ñ€Ð¸ Ð¿ÐµÑ€ÑˆÐ¾Ð¼Ñƒ Ð»Ð¾Ð³Ñ–Ð½Ñ–)

5) Ð’Ð¸Ð¼Ð¾Ð³Ð¸ Ð´Ð¾ Ñ€ÐµÐ°Ð»Ñ–Ð·Ð°Ñ†Ñ–Ñ— Ð² ÐºÐ¾Ð´Ñ–

ORM: Prisma (ÑÐºÑ‰Ð¾ Ñ‚Ð¸ Ð½Ð° Next.js) Ð°Ð±Ð¾ Supabase SQL migrations

API endpoints:

POST /api/simulations â†’ create simulation + compute result + save result

GET /api/simulations â†’ list

GET /api/simulations/:id â†’ get + result

PUT /api/simulations/:id â†’ update inputs + recompute result

DELETE /api/simulations/:id â†’ delete
