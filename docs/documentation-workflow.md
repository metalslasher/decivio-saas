# Documentation Workflow

Status: current working process for project documentation.

## What Docs Are For

Docs are the short current map of the product, codebase, and approved direction. They should help Codex, you, or another developer quickly answer:

- how the product works now;
- where the relevant code lives;
- which flow is considered correct;
- which target behavior is approved for the rebuild;
- which database/API contracts must not be broken;
- which product guardrails should guide implementation.

Docs are not a backlog, archive, or place for old task descriptions.

## Current Vs Target Docs

Most docs should describe shipped behavior.

During the Decivio rebuild, some route-level docs intentionally describe target behavior before code fully catches up. Those files must say so in their status line.

Before a release:

- target docs must either be implemented or updated back to actual behavior;
- placeholder-only product promises must be removed from user-facing code;
- stale modules should be deleted or hidden instead of documented as active paid value.

## When To Update Docs

Update docs in the same commit when changing:

- public flow between `/simulate`, `/results`, `/pricing`, auth, checkout, and `/dashboard`;
- simulation form fields or validation;
- result payload shape or displayed result logic;
- pricing, checkout, subscription, or dashboard access rules;
- Supabase schema, RLS policies, triggers, or storage setup;
- dashboard structure or module ownership;
- major repository structure.

Small visual tweaks do not need docs unless they change product behavior or a shared convention.

## What You Need To Do

You do not need to manually edit docs every time. The most useful thing is to tell Codex when a task changes behavior:

```text
Зроби цю правку і онови docs, якщо змінюється flow/schema/auth/billing/dashboard structure.
```

For bigger ideas, use one of two modes:

- "спочатку опиши в docs/spec, потім реалізуй" when the product decision is still being shaped;
- "реалізуй і після цього приведи docs до фактичного стану" when behavior is already clear.

## Maintenance Cadence

- Every product-facing feature: update affected docs in the same commit.
- Every database/auth/billing change: update docs immediately.
- Before adding an outside developer: review `docs/codebase-map.md` and `docs/engineering-guide.md`.
- After a large milestone: run a short docs audit and delete stale details.

## Local Check

Run:

```bash
npm run docs:check
```

This catches common stale references, old paths, removed onboarding fields, and likely encoding artifacts in `docs/`.

