# Simulate Onboarding Spec

Status: current. This document describes the public `/simulate` flow.

## Source Of Truth

- Page: `src/app/simulate/page.tsx`
- Wizard UI: `src/components/simulate-onboarding-wizard.tsx`
- Form contract: `src/lib/career-switch-form.ts`
- Submit endpoint: `src/app/api/simulations/route.ts`
- AI/mock analysis: `src/lib/career-switch-analysis/index.ts`

## Goal

The onboarding should collect the smallest useful set of facts for a first public simulation estimate.

The user does not need an account before submitting the simulation. Registration/login happens later, when the user chooses a paid plan or explicitly clicks "Вхід" in the header.

## Current Steps

### Step 1: Income

Purpose: understand the current financial baseline.

Field:

- `current_income`: required number, minimum `0`, shown as monthly net income in UAH.

UI notes:

- The input is full width.
- Do not show an example placeholder.
- Show the unit as "грн/міс" near the field.

### Step 2: Current Situation

Purpose: understand where the user is now.

Fields:

- `current_role`: required text.
- `current_experience_years`: required number, minimum `0`, maximum `60`, shown in years.

UI notes:

- The two fields share the row on desktop and stack on mobile.
- The experience field uses a visible "років" unit instead of putting "(років)" in the label.

### Step 3: Target

Purpose: understand the role the user wants to move into.

Fields:

- `target_role`: required text.
- `experience_level`: required select with values:
  - `none`
  - `basic`
  - `practical`

Validation:

- `target_role` should not be identical to `current_role` after trimming and lowercasing.

### Step 4: Transition Conditions

Purpose: tune the result to the user's constraints and main priority.

Fields:

- `english_level`: required select with values:
  - `basic`
  - `intermediate`
  - `upper_intermediate`
  - `advanced`
- `target_market`: required select with values:
  - `ukraine`
  - `remote`
  - `abroad`
- `transition_priority`: required select with values:
  - `speed`
  - `income`

UI copy should explain the options in user language, for example:

- `basic`: "A1-A2 (базовий рівень)"
- `intermediate`: "B1 (можу спілкуватися)"
- `upper_intermediate`: "B2 (можу проходити інтерв'ю)"
- `advanced`: "C1+ (вільна комунікація)"
- `ukraine`: "Україна"
- `remote`: "Міжнародний ринок"
- `abroad`: "Локальна робота за кордоном"

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
