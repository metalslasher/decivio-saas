# Results Page Spec

Status: current. This document describes the public result page after the four-step `/simulate` form.

## Source Of Truth

- Page: `src/app/results/page.tsx`
- UI: `src/components/results-screen.tsx`
- Result endpoint: `src/app/api/simulations/[simulationId]/route.ts`
- Payload mapping: `src/lib/simulation-results-payload.ts`
- Analysis generation: `src/lib/career-switch-analysis/index.ts`

## Route

Canonical route:

```text
/results?simulationId=<uuid>
```

The page requires a valid `simulationId`.

Access rules:

- Guest user can view only the result connected to the same guest session cookie.
- Authenticated user can view only their own result.
- If access is missing or the result cannot be loaded, show a clear error state with a path back to `/simulate`.

## Page Goal

The free result should give the user a useful first diagnosis:

- where their current income sits relative to role and market;
- which direction looks stronger for the next move;
- what risk or readiness issue matters most;
- which facts were used for personalization;
- why the paid product is the natural next step.

It should not expose the full paid dashboard plan before checkout.

## Visible Structure

### Hero

Content:

- Generated headline.
- Short summary.
- Meta chips based on current role, seniority, current market, goal, target market, English level, and resume status.

### Metric Cards

Current cards:

- Current income.
- Market reference.
- Stronger direction.
- Growth potential.
- Path difficulty.

The page should not show optimistic/base/pessimistic timing rows in the free result.

### Profile Snapshot

Shows current role and market context in a compact salary/profile panel.

### Stronger Direction Snapshot

Shows the stronger direction being evaluated: same role, better company, international market, local work abroad, or a specified desired role.

### Comparison

Explains the practical meaning of the result without over-promising.

### Explanation

Sections:

- Why this result.
- What personalized the answer.

These sections should use plain Ukrainian and avoid generic motivational text.

### CTA

Primary path:

- Go to `/pricing`.

The CTA should make clear that the paid plan opens the practical route: profile improvements, resume, vacancies, interview preparation, and offer evaluation.

Authenticated paid users may also get a path into the dashboard scenario when access is active.

## Data Contract

`simulation_results.summary_metrics` remains a compact technical summary:

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

This shape is still used internally by the analysis generator. The public UI maps it into income/market language through `buildSimulationResultsPayload()` and should not depend directly on raw AI JSON.

`simulation_results.ai_summary` contains the generated market profile, narrative, guidance, and metadata.

## Error Handling

User-facing errors should be specific enough to guide action:

- missing simulation id: ask the user to start a new analysis;
- not found/no access: ask the user to reopen their own result or start again;
- server failure: ask the user to retry.

Avoid raw technical errors in the UI.
