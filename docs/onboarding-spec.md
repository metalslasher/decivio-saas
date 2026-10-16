# Simulate Onboarding Spec

Status: target `/simulate` flow for the Decivio rebuild.

## Source Of Truth

- Page: `src/app/simulate/page.tsx`
- Wizard UI: `src/components/simulate-onboarding-wizard.tsx`
- Form contract: `src/lib/career-switch-form.ts`
- Submit endpoint: `src/app/api/simulations/route.ts`
- AI/mock analysis: `src/lib/career-switch-analysis/index.ts`

## Goal

The onboarding should collect enough facts to produce a useful first career-position diagnosis.

It should not feel like a long consulting intake. The user should understand that the assessment is the first step toward a practical job-search workspace.

The user does not need an account before submitting the form. Registration/login happens later, when the user chooses a paid plan or explicitly clicks "Вхід".

## Product Framing

The public wizard evaluates:

- current role and seniority;
- current income and market;
- desired income and upgrade goal;
- English level;
- job-search status;
- resume readiness.

It does not position Decivio as a radical career-change product from zero.

The main question behind the form:

```text
What is the user's current market position, and which paid action should help them move toward a stronger offer?
```

## Target Steps

### Step 1: Income And Market

Purpose: establish the user's current financial and market baseline.

Fields:

- `current_income`: required number, minimum `0`, monthly net income in UAH.
- `current_market`: required select:
  - `ukraine`
  - `remote`
  - `abroad`

UI notes:

- Show the income unit as "грн/міс".
- Avoid fake example values in the placeholder.
- Make it clear this is current income, not desired income.

### Step 2: Role And Experience

Purpose: understand what the user can sell on the market now.

Fields:

- `current_role`: required text.
- `current_experience_years`: required number, minimum `0`, maximum `60`.
- `seniority_level`: required select:
  - `junior`
  - `middle`
  - `senior`
  - `lead`
  - `unknown`

UI notes:

- Same-role upgrade is a valid scenario.
- Do not force a different target role.

### Step 3: Upgrade Goal

Purpose: understand what outcome the user wants.

Fields:

- `upgrade_goal`: required select:
  - `higher_income`
  - `better_company`
  - `international_market`
  - `relocation`
  - `faster_search`
- `desired_income`: required number, minimum `0`, monthly net income in UAH.

If the current form contract does not yet expose `higher_income`, derive it through compatibility logic until the contract is updated.

### Step 4: Search Readiness

Purpose: tune the diagnosis to the user's practical job-search state.

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

`experience_level`, `transition_priority`, `target_role`, and `target_market` may remain in the parser while older result/dashboard code still reads them.

For new public submissions:

- `experience_level` is inferred from experience and seniority;
- `transition_priority` is inferred from `upgrade_goal`;
- `target_role` defaults to `current_role`;
- `target_market` is inferred from `upgrade_goal` and `current_market`.

Do not add legacy fields back to the public wizard unless the product direction changes.

## Submit Behavior

- Primary submit text before loading: "Показати висновок".
- Loading text: "Формуємо висновок...".
- While loading, the full form content can be visually subdued, but the submit state must remain readable.
- On success, redirect to `/results?simulationId=<id>`.
- On validation/API error, show a user-facing message and keep the entered data.

## Ownership Behavior

- Anonymous user: create or refresh a guest session cookie and store the simulation under `guest_session_id`.
- Authenticated user: store the simulation under `user_id` and update `profiles.profile_context` from the submitted answers.
- After later signup/login, guest simulations are attached through `/api/auth/claim-guest-simulations`.

## Test Coverage

The critical public path is covered by:

```bash
npm run test:flow
```

Target flow:

```text
/simulate -> /results -> /pricing -> auth -> checkout -> /dashboard
```

The test should use deterministic mock AI and test-mode mono behavior. It still needs a reachable Supabase project unless the test is later refactored to create an isolated mock data layer.

