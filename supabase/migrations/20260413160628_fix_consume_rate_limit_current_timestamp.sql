create or replace function public.consume_rate_limit(
  p_key text,
  p_route text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_hits integer;
  current_window_started_at timestamptz;
  current_timestamp_utc timestamptz := now();
  elapsed_seconds integer;
begin
  if p_limit <= 0 then
    raise exception 'p_limit must be > 0';
  end if;

  if p_window_seconds <= 0 then
    raise exception 'p_window_seconds must be > 0';
  end if;

  insert into public.request_rate_limits as rl (
    key,
    route,
    hits,
    window_started_at,
    created_at,
    updated_at
  )
  values (
    p_key,
    p_route,
    1,
    current_timestamp_utc,
    current_timestamp_utc,
    current_timestamp_utc
  )
  on conflict (key) do update
    set route = excluded.route,
        hits = case
          when extract(epoch from (current_timestamp_utc - rl.window_started_at)) >= p_window_seconds then 1
          else rl.hits + 1
        end,
        window_started_at = case
          when extract(epoch from (current_timestamp_utc - rl.window_started_at)) >= p_window_seconds then current_timestamp_utc
          else rl.window_started_at
        end,
        updated_at = current_timestamp_utc
  returning hits, window_started_at
  into current_hits, current_window_started_at;

  elapsed_seconds := greatest(0, floor(extract(epoch from (current_timestamp_utc - current_window_started_at)))::integer);

  if current_hits > p_limit then
    return query
    select false, 0, greatest(1, p_window_seconds - elapsed_seconds);
  end if;

  return query
  select true, greatest(0, p_limit - current_hits), greatest(1, p_window_seconds - elapsed_seconds);
end;
$$;
