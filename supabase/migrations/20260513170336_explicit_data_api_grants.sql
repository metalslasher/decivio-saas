-- Explicit Data API grants for Supabase public schema hardening.
-- RLS still decides row-level access; these grants decide which roles can
-- reach each table or RPC through PostgREST/supabase-js at all.

grant usage on schema public to anon, authenticated, service_role;

-- Do not expose application tables to unauthenticated API callers.
revoke all privileges on table
  public.profiles,
  public.subscriptions,
  public.simulation_projects,
  public.simulations,
  public.simulation_results,
  public.lead_requests,
  public.guest_sessions,
  public.request_rate_limits,
  public.billing_checkouts,
  public.billing_events
from anon;

-- Browser/user-scoped access. Existing RLS policies restrict rows to the
-- signed-in user and block operations that do not have matching policies.
grant select, insert, update, delete on table
  public.profiles,
  public.simulation_projects,
  public.simulations
to authenticated;

grant select on table
  public.subscriptions,
  public.simulation_results
to authenticated;

grant select, insert on table
  public.lead_requests
to authenticated;

-- Server-managed tables are accessed through backend routes with service_role.
revoke all privileges on table
  public.guest_sessions,
  public.request_rate_limits,
  public.billing_checkouts,
  public.billing_events
from authenticated;

grant all privileges on table
  public.profiles,
  public.subscriptions,
  public.simulation_projects,
  public.simulations,
  public.simulation_results,
  public.lead_requests,
  public.guest_sessions,
  public.request_rate_limits,
  public.billing_checkouts,
  public.billing_events
to service_role;

revoke execute on function public.consume_rate_limit(text, text, integer, integer)
from public, anon, authenticated;

grant execute on function public.consume_rate_limit(text, text, integer, integer)
to service_role;
