# Decivio Documentation

These docs describe the current product contracts and the approved rebuild direction.

## Active Documents

- `product-concept.md`: approved strategic direction and product guardrails.
- `market-validation.md`: demand hypotheses, pricing tests, and decision gates.
- `product-flow.md`: target public user path from landing to paid workspace.
- `onboarding-spec.md`: target `/simulate` assessment.
- `results-page-spec.md`: target `/results` diagnosis.
- `dashboard-workspace-spec.md`: target paid job-to-offer workspace.
- `billing-flow.md`: current checkout, mono status, and dashboard-access behavior.
- `database-setup.md`: how to apply Supabase migrations and run the critical flow test.
- `database-spec.md`: current database schema and table behavior.
- `codebase-map.md`: where the main product areas live in the repository.
- `engineering-guide.md`: conventions for adding and refactoring code.
- `documentation-workflow.md`: how and when docs should be updated.

## Documentation Rules

- Code and migrations remain the source of truth for shipped behavior.
- Product strategy lives in `product-concept.md` and `market-validation.md`.
- During the rebuild, route-level docs may describe target behavior when their status says so.
- Before release, route-level docs must match shipped behavior.
- Update docs in the same commit when changing public flow, auth, billing, database schema, simulation fields, result payloads, or dashboard structure.
- Delete obsolete specs instead of keeping them as active docs.
- Keep historical ideas in issues/backlog, not in `docs/`.
- Keep files UTF-8 encoded and check for broken mojibake before committing.

## Recommended Maintenance Flow

Before a product-facing release:

1. Run `npm run docs:check`.
2. Check whether `/simulate`, `/results`, `/pricing`, auth, checkout, or dashboard access changed.
3. Update the matching doc only where behavior actually changed.
4. Run `npm run test:flow` when the critical user path is affected.

