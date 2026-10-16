# Engineering Guide

Status: current conventions for keeping the project easy to change.

## File Organization

- Keep feature code near the route or feature area that owns it.
- Move reusable business logic to `src/lib` only when more than one route/component needs it.
- Prefer domain folders for large logic areas, for example `src/lib/career-switch-analysis`.
- Keep route files thin: fetch data, call helpers, render the page.
- Keep generated result logic, payment logic, and auth/session logic out of visual components.

## Refactoring Rules

- Refactor when a file mixes several responsibilities or makes a planned feature hard to add.
- Avoid large mechanical splits when state is tightly coupled and there is no immediate feature pressure.
- Preserve public imports when possible during structural moves.
- Delete obsolete helpers and specs instead of keeping "maybe later" code in active files.
- After refactoring, run typecheck/build-level verification before committing.

## Component Rules

- Route-level components can orchestrate state.
- Presentational components should receive data and callbacks through props.
- Hiring UI lives in `src/components/hiring`; landing-only UI in `src/components/landing`.
- Do not put public landing styling decisions into cabinet components.

## Data And Flow Rules

- `/hire/new` lets guests generate a draft; publishing requires an account.
- Candidates never register; `/apply/<slug>` must stay fast on cheap phones.
- Paid access must come from subscription/access state, not from successful registration alone.

## Verification

Use the smallest verification that covers the change:

- Docs-only change: `npm run docs:check`.
- Type or helper change: `npx tsc --noEmit`.
- UI or route change: `npm run lint` and `npm run build`.
- Critical flow change: `npm run test:flow`.
- Database/schema change: apply Supabase migrations locally or verify against the target environment.
