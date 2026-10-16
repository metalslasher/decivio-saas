# Market Validation

Status: approved research assumptions and validation plan for the Decivio rebuild.

This document captures the business reasoning behind the new product direction. It is not a guarantee of demand. It defines what must be tested before Decivio is treated as a scalable SaaS.

## Research Summary

The Ukrainian job market has enough visible activity and salary uncertainty to support a career upgrade product:

- large job boards publish active vacancy, resume, and salary statistics;
- candidates and employers often disagree on salary expectations;
- labor-market mismatch remains a reported problem;
- career consultants already charge for resume, interview, salary, and job-search help;
- global SaaS tools already monetize resume scanning, ATS matching, job tracking, and AI resume/interview workflows.

The weak version of Decivio is:

```text
Pay for an AI career audit.
```

The stronger version is:

```text
Use Decivio while applying: check vacancies, position your resume, prepare interview and salary arguments, and compare offers.
```

## Demand Hypothesis

Users are more likely to pay when Decivio is tied to an active job-search moment.

High-intent moments:

- user found a vacancy and is unsure whether to apply;
- user is not getting responses and needs resume positioning;
- user wants a higher salary but does not know how to justify it;
- user is preparing for an interview;
- user has an offer and needs to decide or negotiate.

Lower-intent moments:

- user is only curious about market value;
- user wants generic career advice;
- user wants broad motivation or exploration;
- user expects a free salary calculator.

## Pricing Hypotheses

### Entry Offer

Test:

```text
499-799 UAH for one vacancy fit plus resume-positioning output.
```

Purpose:

- validate whether users pay for a concrete job-search action;
- reduce trust barrier before asking for a larger plan.

### Main Plan

Test:

```text
1999-2499 UAH for 90 days.
```

Purpose:

- match a realistic job-search cycle;
- support repeat vacancy checks and multiple resume/interview iterations;
- avoid forcing annual trust too early.

### Monthly

Test:

```text
799-999 UAH per month.
```

Purpose:

- lower entry price;
- learn whether users return often enough for subscription logic.

### Annual

Keep secondary until retention is proven.

## Validation Funnel

Track:

- landing visits;
- assessment starts;
- completed assessments;
- result views;
- paid CTA clicks;
- pricing views;
- auth starts;
- checkout starts;
- successful payments;
- dashboard activation;
- first vacancy fit completion;
- second vacancy fit completion;
- second session return;
- cancellation/refund reasons.

## Decision Gates

Use these thresholds as early directional signals:

- If fewer than 5 percent of completed assessments click paid CTA, the result page or paid promise is weak.
- If users click paid CTA but almost nobody pays 499-799 UAH, the offer is not concrete enough or trust is too low.
- If 1-3 percent of completed assessments pay 999-2499 UAH, continue the project.
- If paid users run only one action and never return, Decivio is a one-time product, not a subscription.
- If paid users run multiple vacancy checks, keep building toward subscription or 90-day plan.

## What Would Invalidate The Product

Consider stopping or pivoting if:

- users complete the free assessment but do not click paid CTAs;
- users say the result is interesting but not actionable;
- vacancy fit output does not change application behavior;
- paid users do not reuse the product during active job search;
- AI costs make low-price plans unprofitable;
- users only want human review and do not trust automated guidance.

## What Would Strengthen The Product

Prioritize:

- visible source/provenance notes for salary and market claims;
- vacancy-specific outputs;
- resume-positioning outputs tied to user context;
- salary scripts with realistic caveats;
- saved history of vacancy checks;
- analytics on paid activation and repeat use.

## Strategic Conclusion

Decivio should continue, but not as a broad career platform.

The next build should prove one narrow commercial behavior:

```text
Will active job seekers pay to check real vacancies and convert the result into resume, interview, and salary actions?
```

If yes, Decivio can grow into a broader career upgrade workspace.

If no, adding more disconnected tools will likely increase complexity without proving demand.

