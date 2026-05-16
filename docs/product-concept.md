# Product Concept

Status: approved product direction for the next product iteration.

This document defines the product concept Decivio should move toward. It is not a database or UI contract. Route-level behavior remains documented in `product-flow.md`, `onboarding-spec.md`, `results-page-spec.md`, and `billing-flow.md` until those parts are updated in code.

## Core Decision

Decivio is moving away from the idea of radical career change from zero.

The product should focus on people who already have experience, skills, and a current role, then help them understand where this experience can earn more money and how to prepare for a stronger opportunity.

Public positioning should move from:

```text
Change your career from scratch.
```

to:

```text
Understand where your current experience is worth more, then prepare for a better role, company, or market.
```

## Product Definition

Decivio is a career upgrade system for people who want to improve their income and market position using the experience they already have.

The product should answer:

- whether the user's current income matches their role and market;
- whether they can realistically earn more in Ukraine;
- whether international remote work or local work abroad gives stronger upside;
- which gaps prevent them from getting better offers;
- what should be fixed in their positioning, resume, vacancy targeting, interview answers, and salary negotiation;
- what the next practical step should be.

## Target User

Primary users:

- people with existing professional experience;
- people who believe they may be underpaid;
- people who want a better company, better market, remote work, relocation path, or higher salary;
- people who are close enough to the job market that resume, vacancies, interviews, and offers are relevant now or soon.

Good examples:

- marketer who wants a higher salary or stronger company;
- project manager who wants international remote roles;
- sales specialist who wants better-paying B2B or SaaS roles;
- designer who wants to move from local clients to product companies;
- analyst who wants to understand Ukraine vs international market potential;
- specialist who already works in a role but gets weak responses from vacancies.

Secondary users:

- people considering an adjacent move where existing experience is still useful.

Out of scope for the main product:

- radical switch from zero, such as accountant to programmer with no technical background;
- long education programs;
- learning platforms, course paths, homework review, or mentoring-heavy skill acquisition;
- promises of guaranteed jobs or guaranteed salary increases.

## Product Promise

The product promise should be practical and money-adjacent:

```text
Decivio shows whether you are underpaid, where your experience can earn more, and what to fix to reach a stronger offer.
```

Supporting promises:

- compare current income with realistic market opportunities;
- choose the better market direction;
- improve resume and positioning;
- target better vacancies;
- prepare for interviews and salary conversations;
- keep the user moving through one clear route instead of scattered tools.

## User Journey

The desired journey:

1. User lands on the site.
2. User starts a short career income and market assessment.
3. User provides current role, income, experience, market, English level, and goal.
4. Decivio returns a useful free diagnostic.
5. Diagnostic shows the best next direction: improve current-market positioning, target international remote, target local work abroad, or first close specific gaps.
6. User upgrades to paid access to open a guided route.
7. Dashboard guides the user through the next concrete steps.
8. User improves resume, checks vacancies, prepares interviews, and evaluates offers.

The route should feel like:

```text
Current position -> Market potential -> Action plan -> Resume -> Vacancies -> Interviews -> Offers
```

## Free Result

The free result should not try to deliver the full paid value.

It should answer enough to build trust:

- current income context;
- stronger market direction;
- main blockers;
- one or two concrete next steps;
- why the paid route is useful.

It should avoid:

- long generic advice;
- full resume rewrites;
- full vacancy strategy;
- full interview plan;
- anything that makes the dashboard feel unnecessary.

## Paid Product

The paid dashboard should be a guided workspace, not only a list of modules.

The main dashboard should always show:

- user's current market position;
- best recommended direction;
- next step;
- progress through the route;
- available tools for the current step.

The product should reduce choice overload. The user should not need to decide which module matters first.

## Recommended Modules

### Keep And Reposition

#### Income And Market Audit

This should become the product core.

Purpose:

- compare current income with realistic market opportunities;
- show whether the user is underpaid, fairly paid, or has stronger upside elsewhere;
- compare Ukraine, international remote, and local abroad directions;
- identify the most useful target market.

This is the first paid module to implement.

#### Resume Upgrade

Purpose:

- analyze and improve the user's existing resume;
- make experience sound stronger and more measurable;
- adapt positioning for a better role, company, or market;
- prepare resume versions for different vacancy types.

This should be built after the audit route is clear.

#### Vacancy Match

Purpose:

- let the user paste a vacancy;
- estimate whether it is worth applying;
- show strong matches and weak spots;
- suggest resume adjustments and talking points.

This is likely one of the strongest retention modules because users can reuse it during an active job search.

#### Interview Prep

Purpose:

- prepare answers for recruiter and hiring manager conversations;
- explain salary expectations;
- strengthen the user's story;
- train weak answers.

This module works best after resume and vacancy targeting exist.

#### Offer And Salary Decision

Purpose:

- evaluate an offer against current income, market potential, and user goals;
- support salary negotiation;
- compare two possible offers or markets.

This is valuable, but it is later in the user journey.

### Rename Or Rework

#### Plan Transition 30/60/90

Old framing: transition to a new career.

New framing:

```text
30-day career upgrade plan
```

Purpose:

- what to fix first;
- which documents to update;
- which vacancies to target;
- how many applications or interviews to prepare for;
- what to do this week.

### Remove Or Deprioritize

#### Model Of A Workday In A New Role

This is not central to the new concept. It belongs to radical role exploration, not income and market upgrade.

Recommendation: remove from public positioning and paid feature lists for now.

#### First Days In A New Job

This is late-stage and not needed for the initial paid product.

Recommendation: remove from the first dashboard/module scope. It may return later as a small post-offer feature.

#### General AI Assistant

The assistant should not be the main product promise.

Recommendation: keep it as a later helper layer that works inside the route. Do not make it the first paid feature.

## Onboarding Direction

The public onboarding now follows the career upgrade concept.

Current fields support:

- current role;
- current income;
- experience in current role;
- current market;
- target market interest;
- English level;
- current job-search status;
- resume availability;
- main goal: higher income, better company, international market, relocation, or faster job search.

Important product change:

- target role should no longer be required to differ from current role;
- same-role upgrade should be a first-class scenario;
- adjacent-role movement can still exist;
- radical from-zero transition should not be the default route.

## Dashboard Direction

The dashboard should be route-first.

Recommended navigation:

- Home
- Market Audit
- Plan
- Resume
- Vacancies
- Interviews
- Offers
- Access/Profile

Recommended home structure:

- current income and market summary;
- recommended direction;
- next step;
- progress route;
- recent vacancy/resume/interview actions;
- paid access status.

Avoid presenting modules as independent cards without explaining the recommended order.

## Monetization Direction

The new concept fits subscription better than radical career change from zero because users can actively use the product during a 1-3 month job-search cycle.

Recommended pricing model to test:

### Free

- short assessment;
- limited result;
- one clear next step;
- no full resume/vacancy/interview outputs.

### Monthly

Suggested range:

```text
799-999 UAH per month
```

Use case:

- active job search;
- resume iterations;
- vacancy checks;
- interview preparation.

### 3-Month Career Upgrade Plan

Suggested range:

```text
1999-2499 UAH
```

This should likely be the main paid-traffic offer because job search and salary upgrade often take more than one month.

Positioning:

```text
3 months to prepare your profile, target better vacancies, and improve interview readiness.
```

### Annual

Keep annual as a secondary option.

Suggested role:

- best value for long-term career tracking;
- not the main cold-traffic offer at the beginning.

### Credits Later

Add usage limits before scaling paid traffic.

Possible credit-controlled actions:

- resume analyses;
- vacancy checks;
- interview simulations;
- full plan regenerations;
- offer evaluations.

This protects AI costs and keeps pricing predictable.

## Implementation Order

1. Keep public copy and docs aligned around career upgrade and income potential.
2. Rework dashboard home into a guided career upgrade route.
3. Implement Income And Market Audit as the first true paid module.
4. Implement Resume Upgrade.
5. Implement Vacancy Match.
6. Implement Interview Prep.
7. Implement Offer And Salary Decision.
8. Add AI usage limits and credit accounting.
9. Revisit pricing page around monthly vs 3-month plan.
10. Add funnel analytics before scaling paid traffic.

## Success Metrics

Track product and funnel quality by:

- landing to onboarding start rate;
- onboarding completion rate;
- result to pricing click rate;
- pricing to auth/checkout start rate;
- checkout success rate;
- paid user dashboard activation rate;
- first paid action completion rate;
- second-session return rate;
- average AI cost per paid user;
- refund or cancellation reasons.

## Product Guardrails

- Do not promise guaranteed jobs.
- Do not promise guaranteed salary increase.
- Do not position the product as a replacement for education or mentoring from zero.
- Do not let users reach the paid dashboard without payment or explicit manual full access.
- Do not make AI chat the central product before the route and modules are useful.
- Do not add modules that are interesting but disconnected from the income upgrade journey.

## Working Name

Internal concept:

```text
Career Upgrade Operating System
```

Public language should stay simpler:

```text
Find where your experience is worth more, then prepare for a stronger offer.
```
