# Simulate Onboarding Spec

Status: current. This document describes the public `/simulate` flow.

## Source Of Truth

- Page: `src/app/simulate/page.tsx`
- Wizard UI: `src/components/simulate-onboarding-wizard.tsx`
- Form contract: `src/lib/career-switch-form.ts`
- Submit endpoint: `src/app/api/simulations/route.ts`
- AI/mock analysis: `src/lib/career-switch-analysis/index.ts`

## Goal

The onboarding collects enough facts to produce a useful first income-and-market diagnosis.

The user does not need an account before submitting the form. Registration/login happens later, when the user chooses a paid plan or explicitly clicks "Вхід" in the header.

The current product direction is career upgrade, not radical career change from zero. The form can still accept a desired role, but leaving it empty means "evaluate my current role and better opportunities around it".

## Current Steps

### Step 1: Income And Market

Purpose: understand the current financial and market baseline.

Fields:

- `current_income`: required number, minimum `0`, monthly net income in UAH.
- `current_market`: required select:
  - `ukraine`
  - `remote` (shown as international market)
  - `abroad`

UI notes:

- Do not show an example placeholder in the income field.
- Show the income unit as "грн/міс".

### Step 2: Role And Experience

Purpose: understand the user's actual profile.

Fields:

- `current_role`: required text.
- `current_experience_years`: required number, minimum `0`, maximum `60`, shown in years.
- `seniority_level`: required select:
  - `junior`
  - `middle`
  - `senior`
  - `lead`
  - `manager`

### Step 3: Improvement Goal

Purpose: understand what the user wants to improve next.

Fields:

- `upgrade_goal`: required select:
  - `higher_income`
  - `better_company`
  - `international_market`
  - `relocation`
  - `faster_search`
- `target_role`: optional text. If empty, the API uses `current_role`.
- `target_market`: required select:
  - `ukraine`
  - `remote` (shown as international market)
  - `abroad`

### Step 4: Search Readiness

Purpose: tune the result to the user's practical constraints.

Fields:

- `english_level`: required select:
  - `basic`
  - `intermediate`
  - `upper_intermediate`
  - `advanced`
- `job_search_status`: required select:
  - `not_started`
  - `preparing`
  - `applying`
  - `interviewing`
  - `offer`
- `resume_status`: required select:
  - `none`
  - `outdated`
  - `ready`
  - `needs_improvement`

## Compatibility Fields

`experience_level` and `transition_priority` remain in the form parser as derived compatibility fields because existing dashboard code still reads them.

For new public submissions:

- `experience_level` is inferred from experience and seniority.
- `transition_priority` is inferred from `upgrade_goal`.

Do not add these two fields back to the public wizard unless the product direction changes.

## Submit Behavior

- Primary submit text before loading: "Отримати мій висновок".
- Loading text: "Формуємо висновок...".
- While loading, the full form content is visually blurred except the submit button.
- On success, redirect to `/results?simulationId=<id>`.
- On validation/API error, show a user-facing message and keep the entered data.

## Ownership Behavior

- Anonymous user: create or refresh a guest session cookie and store the simulation under `guest_session_id`.
- Authenticated user: store the simulation under `user_id` and update `profiles.profile_context` from the submitted answers.
- After later signup/login, guest simulations are attached through `/api/auth/claim-guest-simulations`.

## Test Coverage

The critical public path is covered by `npm run test:flow` in local test mode:

`/simulate -> /results -> /pricing -> registration/login -> checkout -> /dashboard`.

The test uses deterministic mock AI and a local successful mono payment, so it should not spend OpenAI requests or create real payments.
