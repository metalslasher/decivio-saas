# Results Page Spec

Status: target `/results` behavior for the Decivio rebuild.

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

The free result should give the user a credible first diagnosis and a reason to continue.

It should answer:

- where their current income sits relative to their role and market;
- whether their next move should focus on better local positioning, international remote, relocation, faster applications, or salary calibration;
- which blocker matters most right now;
- which paid action is the best next step.

It should not try to be the full career plan.

## Visible Structure

### Hero

Content:

- Generated headline.
- Short summary.
- Meta chips based on current role, seniority, current market, current income, desired income, goal, derived target market, English level, search status, and resume status.

### Diagnosis Cards

Target cards:

- Current income.
- Market reference.
- Market position verdict.
- Stronger direction.
- Main blocker.

Avoid showing old transition-ROI framing or long forecast horizons in the free result.

### Market Position Snapshot

Shows the user's current role, market, income, seniority, and likely positioning.

The UI should make clear whether the result is:

- underpaid;
- near market;
- ambitious but possible;
- unrealistic without gap-closing;
- not enough data.

### Recommended Next Action

This should be the bridge into paid value.

Possible next actions:

- run Vacancy Fit on a real vacancy;
- improve resume positioning first;
- calibrate salary expectations;
- prepare interview/salary script;
- compare an offer if the user is already late-stage.

The result should recommend one primary action, not every available feature.

### Explanation

Sections:

- Why this diagnosis.
- What personalized the answer.
- What remains uncertain.

Use plain Ukrainian and avoid generic motivational text.

### Source And Confidence Notes

Market and salary claims should expose enough provenance to build trust.

Target behavior:

- show whether live web research was used;
- list high-level source categories when available, such as Ukrainian job boards, salary statistics, vacancy text, or user-provided inputs;
- explain when estimates are broad or confidence is limited.

Do not expose internal prompts or raw model JSON.

### CTA

Primary path:

```text
/pricing
```

The CTA should sell the next paid action, not a generic "dashboard".

Preferred CTA language:

```text
Перевірити вакансію і підготувати подачу
```

or:

```text
Відкрити план до сильнішої пропозиції
```

Authenticated paid users may also get a path into the relevant dashboard workspace when access is active.

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

This shape is still used internally by the analysis generator. The public UI should map it into market-position language through `buildSimulationResultsPayload()` and should not depend directly on raw AI JSON.

`simulation_results.ai_summary` contains generated market profile, narrative, guidance, and metadata.

## Error Handling

User-facing errors should be specific enough to guide action:

- missing simulation id: ask the user to start a new analysis;
- not found/no access: ask the user to reopen their own result or start again;
- server failure: ask the user to retry.

Avoid raw technical errors in the UI.

