-- Privacy fix: never use a user's email as their (publicly-visible) display_name.
-- 1) Replace the signup trigger so display_name falls back to NULL, not email.
--    Email-login users then have no handle until they explicitly choose one
--    (the app prompts for a handle before any public leaderboard submission).
-- 2) Backfill: scrub any existing email-shaped handles. (Safe/idempotent; on a
--    fresh project this affects zero rows.)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  insert into public.progress (user_id, data)
  values (new.id, '{}'::jsonb)
  on conflict (user_id) do nothing;

  insert into public.entitlements (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Backfill existing data (none expected on a new project, but safe to run).
update public.profiles set display_name = null where display_name like '%@%';
delete from public.leaderboard_scores where display_name like '%@%';
delete from public.match_results where display_name like '%@%';
