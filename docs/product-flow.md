# Product Flow

Status: target public product flow for the Decivio rebuild.

This document describes the intended user path. Some implementation details may still be catching up during the rebuild. Keep this file aligned with code before a release.

## Correct User Path

1. User lands on `/`.
2. Header CTA opens `/simulate`.
3. User completes the career position assessment without registration.
4. App creates a guest simulation and opens `/results?simulationId=<id>`.
5. Result page gives a useful free diagnosis and recommends one next paid action.
6. User goes to `/pricing`.
7. User chooses either an entry offer, monthly plan, or 90-day career upgrade plan.
8. If not authenticated, user signs up or logs in before checkout.
9. Guest simulation is attached to the authenticated account.
10. App creates a mono checkout.
11. After successful payment, user lands in `/dashboard`.
12. Dashboard opens the guided job-to-offer workspace, starting from the user's saved diagnosis.

## Product Logic

The public flow should not sell a generic dashboard.

It should sell a practical route:

```text
Understand position -> Check vacancies -> Position resume -> Prepare interview and salary arguments -> Decide on offers
```

The free result is a trust-building diagnosis. The paid workspace is the practical action layer.

## Auth Rules

- Header "Вхід" opens login.
- Header CTA sends users to `/simulate`, not registration.
- Registration happens only when needed for checkout, account ownership, or explicit login.
- Guest simulations should be claimable after signup/login.
- A user should not reach the paid workspace without active paid access or explicit manual full-access override.

## Billing Rules

- The MVP should prefer a 90-day career upgrade plan as the main paid offer.
- Monthly can remain as a lower-entry option.
- Annual should be secondary until retention is proven.
- Local test mode must not call real mono APIs.
- Production must use real mono callbacks/status checks before opening paid access.
- Failed, expired, canceled, reversed, pending, and processing payment states should keep the user on a clear recovery path instead of opening the paid workspace.

## Free Result Responsibilities

The free result should:

- confirm that Decivio understood the user's role, income, market, goal, English level, search status, and resume readiness;
- show a compact diagnosis of current market position;
- explain whether the user likely needs better targeting, better positioning, stronger resume proof, interview preparation, or salary calibration;
- recommend one next paid action;
- lead naturally to pricing.

The free result should not:

- rewrite the resume;
- analyze unlimited vacancies;
- generate full interview scripts;
- provide detailed salary negotiation language;
- expose enough paid value that the workspace feels unnecessary.

## Paid Workspace Responsibilities

The paid workspace should:

- start from the user's saved market diagnosis;
- show the next recommended action;
- let the user paste a vacancy for fit analysis;
- convert vacancy output into resume positioning and interview/salary talking points;
- keep modules in route order instead of presenting unrelated tools.

The workspace should not:

- show placeholder-only modules as paid value;
- include late-stage features such as first days in a new job in the MVP;
- lead with a general AI assistant.

## Dashboard Navigation Direction

Target MVP navigation:

- Home
- Market Position
- Vacancy Fit
- Resume Positioning
- Interview And Salary
- Offer Decision
- Access/Profile

Items can be hidden until their workspace has real functionality.

