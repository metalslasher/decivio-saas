# Decivio Documentation

Decivio is an AI hiring assistant for Ukrainian small and medium businesses.

## Start Here

- `product-concept.md`: what we build, for whom, why, monetization, guardrails. Source of truth.
- `roadmap.md`: iteration plan and handoff notes for the next work session. Update it at the end of every session.

## Engineering References

- `codebase-map.md`: where things live.
- `engineering-guide.md`: conventions.
- `database-spec.md`: database tables (hiring tables at the top).
- `database-setup.md`: applying migrations locally and remotely.
- `billing-flow.md`: monobank checkout and access behavior.
- `documentation-workflow.md`: how docs are maintained.

## Rules

- Code and migrations are the source of truth for shipped behavior.
- Update docs in the same commit when changing public flow, auth, billing, schema, or AI contracts.
- Delete obsolete specs instead of keeping them.
- Keep files UTF-8 encoded.
