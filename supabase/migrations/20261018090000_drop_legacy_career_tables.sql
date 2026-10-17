-- Removes data structures of the retired B2C career product (pivot on 2026-10-16).
-- Kept: profiles (without profile_context), subscriptions, billing, rate limits, avatars bucket.

drop table if exists public.simulation_results cascade;
drop table if exists public.simulations cascade;
drop table if exists public.simulation_projects cascade;
drop table if exists public.lead_requests cascade;
drop table if exists public.guest_sessions cascade;
drop table if exists public.market_profiles_cache cascade;

alter table if exists public.profiles
  drop column if exists profile_context;
