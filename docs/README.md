# Decivio Documentation

These docs describe the current product, not historical prompts or early design ideas.

## Active Documents

- `codebase-map.md`: where the main product areas live in the repository.
- `engineering-guide.md`: conventions for adding and refactoring code.
- `documentation-workflow.md`: how and when docs should be updated.
- `billing-flow.md`: current checkout, mono status, and dashboard-access behavior.
- `database-setup.md`: how to apply Supabase migrations and run the critical flow test.
- `database-spec.md`: current database schema and table behavior.
- `product-flow.md`: current public user path from simulation to paid dashboard.
- `onboarding-spec.md`: current four-step `/simulate` form.
- `results-page-spec.md`: current `/results` behavior and data contract.

## Documentation Rules

- Code and migrations are the source of truth.
- Update docs in the same commit when changing public flow, auth, billing, database schema, simulation fields, or result payloads.
- Delete obsolete specs instead of keeping them as active docs.
- Keep historical ideas in issues/backlog, not in `docs/`.
- Keep files UTF-8 encoded and check for broken mojibake before committing.
- Prefer short documents that answer "what is current?" over long aspirational specs.

## Recommended Maintenance Flow

Before a product-facing release:

1. Run `npm run docs:check`.
2. Check whether `/simulate`, `/results`, `/pricing`, auth, checkout, or dashboard access changed.
3. Update the matching doc only where behavior actually changed.
4. Run `npm run test:flow` when the critical user path is affected.
