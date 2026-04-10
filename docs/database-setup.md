# Database setup

This project uses Supabase/PostgreSQL migrations from `supabase/migrations`.

## Apply migrations locally

1. Install and authenticate Supabase CLI.
2. Start local Supabase stack:

```bash
supabase start
```

3. Apply all migrations to local database:

```bash
supabase db reset
```

`supabase db reset` recreates the local DB and re-runs all files from `supabase/migrations`.

## Apply migrations to Supabase (remote)

1. Link the local project to your Supabase project:

```bash
supabase link --project-ref <your-project-ref>
```

2. Push local migrations to remote database:

```bash
supabase db push
```

3. Verify schema in Supabase SQL editor or Dashboard Table Editor.

## Notes

- Migration includes RLS policies, FK constraints, indexes, and `updated_at` triggers.
- Migration also includes `auth.users` trigger to auto-create a row in `public.profiles`.
- If you later add Prisma, sync models from this schema and map JSONB columns as `Json`.
