create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists public.progress (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.entitlements (
  user_id uuid primary key references auth.users on delete cascade,
  ads_removed boolean not null default false,
  stripe_customer_id text,
  purchased_at timestamptz
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  stripe_session_id text unique,
  amount integer,
  currency text,
  status text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.entitlements enable row level security;
alter table public.purchases enable row level security;

create policy "profiles owner select" on public.profiles for select using (auth.uid() = id);
create policy "profiles owner insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles owner update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "progress owner select" on public.progress for select using (auth.uid() = user_id);
create policy "progress owner insert" on public.progress for insert with check (auth.uid() = user_id);
create policy "progress owner update" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "entitlements owner select" on public.entitlements for select using (auth.uid() = user_id);
create policy "entitlements owner insert" on public.entitlements for insert with check (auth.uid() = user_id);

create policy "purchases owner select" on public.purchases for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
