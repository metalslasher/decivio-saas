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

## Local Flow Test

The current critical user path is covered by:

```bash
npm run test:flow
```

Flow covered:

```text
/simulate -> /results -> /pricing -> registration/login -> checkout -> /dashboard
```

Notes:

- The test expects the local app and local Supabase configuration to be usable.
- `DECIVIO_TEST_MODE=1` enables deterministic mock AI and a local successful mono checkout.
- The flow test should not call OpenAI or create a real mono payment.

## Notes

- Migrations include RLS policies, FK constraints, indexes, and `updated_at` triggers.
- Migrations include the `auth.users` trigger that creates/updates `public.profiles`.
- If the schema changes, update `docs/database-spec.md` in the same commit.
