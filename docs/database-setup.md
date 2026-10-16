# Database Setup

This project uses Supabase/PostgreSQL migrations from `supabase/migrations`.

## Apply Migrations Locally

1. Install and authenticate Supabase CLI.
2. Start the local Supabase stack:

```bash
supabase start
```

3. Recreate the local database and apply all migrations:

```bash
supabase db reset
```

`supabase db reset` reruns every file from `supabase/migrations`.

## Apply Migrations Remotely

1. Link the local project to the Supabase project:

```bash
supabase link --project-ref <your-project-ref>
```

2. Push local migrations to the remote database:

```bash
supabase db push
```

3. Verify the schema in Supabase SQL Editor or Table Editor.

## Flow Tests

The current critical user path is covered by:

```bash
npm run test:flow
```

Flow covered:

```text
/simulate -> /results -> /pricing -> registration/login -> checkout -> /dashboard
```

Notes:

- The test expects the app to have a reachable Supabase configuration.
- `DECIVIO_TEST_MODE=1` enables deterministic mock AI and local mono checkout simulation.
- The flow test should not call OpenAI or create a real mono payment.
- Billing edge states can be simulated with `testCheckoutStatus`; see `docs/billing-flow.md`.

## Supabase Choice For Tests

There are two supported ways to run the flow test.

### Local Supabase

Use this when testing migrations, RLS, triggers, and schema changes before pushing them:

```bash
supabase start
supabase db reset
npm run test:flow
```

### Remote Supabase

Use this when the real Supabase project is already configured and the goal is to verify the product flow without running the local Supabase stack.

If `.env.local` points to local Supabase, create a local-only `.env.flow.local` file with the remote flow-test values:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

`.env.flow.local` is gitignored and is read only by `playwright.flow.config.ts`.

Rules:

- keep `DECIVIO_TEST_MODE=1` so AI and mono stay mocked;
- use a non-production test account/email pattern in Playwright;
- expect test rows to be written to the configured remote project;
- clean up test users/simulations if the remote project is shared with production data;
- do not use remote tests for unverified migrations that have not been applied to that project.

The Playwright config should not force a local Supabase URL. It inherits Supabase values from `DECIVIO_FLOW_*` shell variables, `.env.flow.local`, `.env.local`, or the parent shell, in that order.

## Notes

- Migrations include RLS policies, FK constraints, indexes, and `updated_at` triggers.
- Migrations include the `auth.users` trigger that creates/updates `public.profiles`.
- If the schema changes, update `docs/database-spec.md` in the same commit.
