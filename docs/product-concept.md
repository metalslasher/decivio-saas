# Product Concept

Status: approved product direction for the Decivio rebuild.

This document is the strategic source of truth. It explains what Decivio is, what it is not, why the product should be narrowed, and which value proposition should guide implementation. Route-level behavior is documented in `product-flow.md`, `onboarding-spec.md`, `results-page-spec.md`, `billing-flow.md`, and `dashboard-workspace-spec.md`.

## Core Decision

Decivio should not become a generic AI resume builder, a job board, a learning platform, or a broad career assistant.

The product should become a focused career upgrade workspace for people who already have professional experience and want a stronger job, company, market, or salary outcome.

Internal positioning:

```text
Career upgrade workspace for moving from current position to stronger offer.
```

Public positioning:

```text
Decivio helps you understand which vacancies are worth pursuing, how to position your experience for them, and how to argue for a stronger salary.
```

The market audit remains important, but it is not the full product. It is the diagnostic layer that explains where the user stands and what route they should take next.

## Product Thesis

People are more likely to pay when the product is close to an active job-search decision:

- should I apply to this vacancy;
- does this role fit my experience;
- how should I adapt my resume;
- what salary can I reasonably ask for;
- what risks will appear in an interview;
- whether an offer is strong enough to accept.

A standalone career report is useful, but it is usually one-time value. Decivio should use the report to start a repeatable workflow around real vacancies, resume positioning, interview preparation, salary negotiation, and offer decisions.

## Product Definition

Decivio is a guided job-to-offer workspace.

It helps users:

- diagnose their current income and market position;
- identify realistic better markets or roles;
- check concrete vacancies before applying;
- adapt resume positioning to each vacancy;
- prepare interview and salary arguments;
- evaluate offers against their goals and market potential.

The product should answer:

- whether the user's current income is below, near, or above the realistic market range;
- which direction gives the strongest upside: better local role, stronger company, international remote, relocation, or improved current-market positioning;
- which vacancies are worth applying to;
- what should change in the user's resume for a specific vacancy;
- what interview risks and salary objections the user should prepare for;
- which next action matters this week.

## Target User

Primary users:

- people with existing professional experience;
- people who suspect they are underpaid;
- people who are preparing for active job search or already applying;
- people comparing Ukraine, remote, relocation, or stronger local companies;
- people who need practical positioning, not a long education path.

Good examples:

- marketer who wants a better company and higher salary;
- project manager targeting international remote roles;
- sales specialist moving toward B2B, SaaS, or higher-ticket markets;
- designer moving from local clients to product companies;
- analyst comparing Ukrainian and international market options;
- specialist who applies to vacancies but gets weak responses.

Secondary users:

- people considering an adjacent role where their existing experience remains useful.

Out of scope for the main product:

- radical career switch from zero;
- long courses and homework-heavy learning paths;
- guaranteed job placement;
- guaranteed salary increase;
- generic life coaching;
- broad AI chat without a specific job-search object.

## Value Proposition

The strongest public promise:

```text
Paste a vacancy and understand whether it is worth applying, what to adjust in your resume, and how to defend your salary expectation.
```

Supporting promise:

```text
Start with a market diagnosis, then use Decivio to move through vacancies, resume positioning, interviews, salary conversations, and offers.
```

Avoid leading with:

```text
Career market advisor.
```

That can remain internal language, but it is too abstract as the main paid promise.

## Core Journey

The target journey:

1. User lands on the site.
2. User starts a short career position assessment without registration.
3. User enters current role, experience, income, market, goal, English level, job-search status, and resume readiness.
4. Decivio returns a useful free diagnosis.
5. The diagnosis explains the user's market position and points to one next paid action.
6. User upgrades to paid access.
7. Paid workspace opens the user's career upgrade route.
8. User checks vacancies, adapts resume positioning, prepares interview/salary scripts, and evaluates offers.

The route should feel like:

```text
Current position -> Market diagnosis -> Vacancy fit -> Resume positioning -> Interview and salary script -> Offer decision
```

## Free Result

The free result should create trust and urgency, not deliver the full paid product.

It should show:

- current income and market context;
- likely positioning: underpaid, near-market, above-market but risky, or unclear;
- strongest next direction;
- main blocker;
- one concrete next step;
- why the paid workspace is useful.

It should not include:

- full resume rewrites;
- unlimited market alternatives;
- full vacancy strategy;
- full interview prep;
- detailed salary negotiation script;
- enough detail that the dashboard feels unnecessary.

## Paid Product

The paid product is not a list of disconnected modules. It is a guided workspace organized around the job-search cycle.

Recommended paid structure:

1. Market Position
2. Vacancy Fit
3. Resume Positioning
4. Interview And Salary Script
5. Offer Decision

The workspace should always answer:

- what the user should do next;
- why this next step matters;
- which input is needed;
- what output the user gets after completing it.

## Module Strategy

### Market Position

Purpose:

- diagnose whether the user's income and expectations match the market;
- compare local, remote, and relocation directions;
- identify upside and blockers;
- choose the next action.

This is the onboarding-to-paid bridge, not the only product.

### Vacancy Fit

Purpose:

- let the user paste a vacancy;
- evaluate whether it is worth applying;
- show fit, gaps, risks, salary angle, and application recommendation;
- create practical outputs for resume and interview preparation.

This should be the first true paid feature because it is repeatable and close to an active buying moment.

### Resume Positioning

Purpose:

- adapt the user's existing experience to a specific vacancy or role direction;
- improve claims, metrics, wording, and relevance;
- avoid becoming a generic resume template builder.

This module should depend on Market Position and Vacancy Fit context.

### Interview And Salary Script

Purpose:

- prepare answers for likely objections;
- explain transitions, gaps, salary expectations, and strengths;
- generate recruiter and hiring-manager talking points.

This module should be contextual, not generic interview advice.

### Offer Decision

Purpose:

- compare an offer with current income, market range, personal goals, and risk;
- support negotiation;
- help decide whether to accept, negotiate, or keep searching.

This can become a strong later-stage premium feature.

### Assistant

The assistant should not be a standalone product promise.

Use it later as a contextual helper inside a vacancy, resume, interview, or offer workflow.

### First Days In A New Job

Remove from the MVP. It happens after the core paid decision and distracts from the job-to-offer route.

## Monetization Direction

The product should test willingness to pay before growing feature scope.

### Free

- assessment;
- limited result;
- one recommended next step;
- CTA into paid workspace.

### One-Time Entry Offer

Potential test:

```text
499-799 UAH for one vacancy fit and resume positioning output.
```

This can validate paid demand without requiring subscription trust.

### Main Plan

Recommended initial main offer:

```text
1999-2499 UAH for 90 days.
```

This fits the job-search cycle better than an annual subscription.

Includes:

- market diagnosis;
- limited vacancy checks;
- resume positioning outputs;
- interview and salary scripts;
- offer decision support when available.

### Monthly

Secondary option:

```text
799-999 UAH per month.
```

Use when users prefer lower entry price.

### Annual

Keep annual secondary until retention is proven.

Annual should not be the primary cold-traffic offer in the MVP.

## Validation Metrics

Do not scale development or paid traffic without funnel evidence.

Track:

- landing to assessment start;
- assessment start to completion;
- result to paid CTA click;
- pricing to auth/checkout start;
- checkout success;
- paid activation;
- first paid action completion;
- second session return;
- number of vacancy checks per paid user;
- AI cost per paid user;
- refund and cancellation reasons.

Decision gates:

- If fewer than 5 percent of completed assessments click paid CTA, positioning is weak.
- If users click but do not pay even a low entry price, the paid promise is weak.
- If 1-3 percent of completed assessments pay for 999-2499 UAH, continue.
- If paid users do not run repeat vacancy checks, treat the product as one-time, not subscription.
- If paid users return with multiple vacancies, subscription or 90-day plan becomes credible.

## Implementation Guardrails

- Keep registration after free diagnosis unless payment/account ownership requires it.
- Do not show paid dashboard value before access is active.
- Do not add independent modules unless they fit the job-to-offer route.
- Do not promise guaranteed jobs or salary increases.
- Do not make AI chat the central paid feature.
- Do not optimize for feature count before one paid flow works end to end.
- Make source/provenance visible for market and salary claims where possible.
- Use the user's actual vacancy/resume/interview context before giving detailed paid outputs.

