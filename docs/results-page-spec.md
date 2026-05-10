# Results Page Spec

Status: current. This document describes the public result page after the four-step simulation.

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

The free result should give the user a useful first answer:

- what the transition looks like,
- how realistic it is,
- where the main risk sits,
- what the next paid product unlocks.

It should not expose the full paid dashboard plan before checkout.

## Visible Structure

### Hero

Content:

- Generated headline.
- Short summary.
- Meta chips based on selected target role, market, English level, and priority.

### Metric Cards

Current cards:

- Current income.
- Chance of first offer within 12 months.
- Time to first offer.
- Ceiling gap.
- Transition risk.

Important:

- The "Time to first offer" card shows one base value only.
- Do not show optimistic/base/pessimistic rows unless the product decision changes again.

### Scenario Snapshot

Shows current-role and target-role salary/market context in a compact comparison.

### Comparison

Shows the main side-by-side comparison between the current direction and target direction.

### Explanation

Sections:

- Why this result.
- Personalization notes.

These sections should explain the reasoning in plain Ukrainian and avoid generic motivational text.

### CTA

Primary path:

- Go to `/pricing`.

Authenticated paid users may also get a path into the dashboard scenario when access is active.

## Data Contract

`simulation_results.summary_metrics` contains the numeric basis for the cards:

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

`simulation_results.ai_summary` contains the generated market profile, narrative, guidance, and metadata.

The UI should read through `buildSimulationResultsPayload()` instead of depending directly on raw AI JSON shape.

## Error Handling

User-facing errors should be specific enough to guide action:

- missing simulation id: ask the user to start a new analysis;
- not found/no access: ask the user to reopen their own result or start again;
- server failure: ask the user to retry.

Avoid raw technical errors in the UI.
