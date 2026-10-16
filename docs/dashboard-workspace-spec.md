# Dashboard Workspace Spec

Status: target paid workspace for the Decivio rebuild.

This document describes what the paid dashboard should become. It replaces the idea of a broad module catalog with a guided job-to-offer workspace.

## Product Role

The dashboard is where the user turns a free diagnosis into practical job-search actions.

It should not feel like:

- a placeholder dashboard;
- a generic AI assistant;
- a menu of unrelated career modules;
- a product roadmap shown to paying users.

It should feel like:

```text
Here is your current position, here is the next job-search action, and here is the output you can use today.
```

## MVP Navigation

Recommended MVP navigation:

- Home
- Market Position
- Vacancy Fit
- Resume Positioning
- Interview And Salary
- Offer Decision
- Access/Profile

Hide navigation items until they contain useful functionality.

## Home

Purpose:

- summarize the user's diagnosis;
- show active access state;
- show the next recommended action;
- show route progress;
- help the user continue from the last useful workspace.

Home should show:

- current role, income, market, and desired income;
- market-position verdict;
- strongest direction;
- main blocker;
- next action CTA.

Home should not show:

- many equal feature cards;
- future modules;
- "coming soon" copy as paid value.

## Market Position

Purpose:

- translate the free result into a paid working baseline;
- explain the user's current market position;
- choose the next practical step.

Inputs:

- saved assessment;
- generated result;
- optional updated income/role/market details later.

Outputs:

- position verdict;
- realistic market direction;
- key blockers;
- recommended action;
- confidence/source notes.

This workspace should not be only a static report. It should push the user toward Vacancy Fit or Resume Positioning.

## Vacancy Fit

Purpose:

- analyze a real vacancy against the user's profile and market diagnosis.

Inputs:

- pasted vacancy text or URL;
- user's current profile and diagnosis.

Outputs:

- apply / skip / maybe recommendation;
- fit score with explanation;
- strong matches;
- weak spots;
- salary angle;
- resume adjustments;
- interview risks;
- next action.

This is the first paid workspace to implement because it is repeatable and close to an active buying moment.

## Resume Positioning

Purpose:

- adapt the user's existing experience to a specific vacancy or market direction.

Inputs:

- user's current role and experience;
- resume text or profile summary;
- selected vacancy or target role direction.

Outputs:

- stronger positioning summary;
- bullet rewrite suggestions;
- missing proof/metrics;
- keywords and experience areas to emphasize;
- warnings about over-claiming.

This is not a generic resume builder. It should stay tied to a vacancy or target direction.

## Interview And Salary

Purpose:

- prepare practical language for recruiter and hiring-manager conversations.

Inputs:

- market diagnosis;
- vacancy fit;
- resume positioning;
- salary expectation.

Outputs:

- likely questions;
- weak-point responses;
- salary expectation script;
- transition explanation;
- short recruiter message.

## Offer Decision

Purpose:

- help late-stage users decide whether to accept, negotiate, or keep searching.

Inputs:

- offer details;
- current income;
- desired income;
- market diagnosis;
- personal constraints.

Outputs:

- offer strength verdict;
- negotiation opportunities;
- risk notes;
- accept/negotiate/decline recommendation;
- negotiation script.

This can ship after Vacancy Fit and Resume Positioning.

## Assistant Role

Do not expose a generic assistant as a primary dashboard item in the MVP.

If an assistant exists, it should be contextual:

- inside a vacancy analysis;
- inside resume positioning;
- inside salary script preparation;
- inside offer evaluation.

## Access/Profile

Purpose:

- show subscription/access state;
- allow sign out;
- show account email;
- show latest simulation ownership;
- avoid mixing account management with product work.

## Empty States

Every empty workspace should ask for the next useful input.

Good:

```text
Paste a vacancy to check whether it is worth applying.
```

Bad:

```text
This module will help you in the future.
```

## MVP Removal List

Remove or hide from paid navigation:

- First days in a new job;
- broad AI assistant;
- workday simulation;
- disconnected career scenarios;
- placeholder-only route cards.

## Completion Criteria

The paid MVP is not complete until a paid user can:

1. open the dashboard after payment or manual full access;
2. see their market diagnosis;
3. paste a real vacancy;
4. receive a useful fit output;
5. get resume or interview/salary actions based on that vacancy;
6. return later and run another vacancy check.

