create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_full_name text;
begin
  metadata_full_name := nullif(
    trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')),
    ''
  );

  insert into public.profiles (id, email, full_name, created_at, updated_at)
  values (new.id, new.email, metadata_full_name, now(), now())
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = now();

  return new;
end;
$$;
