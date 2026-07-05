-- Username-only accounts: let privacy-conscious users sign up with just a
-- username + password (no email). Supabase Auth still needs an email, so the
-- app derives a synthetic one (<username>@users.flaggo.app). To make the
-- signup-time availability check trustworthy we track the username in profiles
-- with a case-insensitive unique index, and expose an anon-callable RPC that
-- returns only a boolean (no row data leaks past the owner-only RLS policy).

alter table public.profiles add column if not exists username text;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

-- Availability check, callable before the user has a session (anon).
-- security definer so it can see rows the caller's RLS policy hides; returns
-- only true/false so it can't be used to enumerate profile data.
create or replace function public.username_available(candidate text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(candidate)
  );
$$;

grant execute on function public.username_available(text) to anon, authenticated;

-- Seed username from signup metadata alongside display_name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'username', '')
  )
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
