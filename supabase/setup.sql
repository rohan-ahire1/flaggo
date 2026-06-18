-- Worldly DB setup — paste this entire file into Supabase SQL Editor and Run.
-- Combines migrations 202606180001 + 202606180002 + 202606180003 (idempotent; safe to re-run).

-- ============================================================
-- 202606180001_flaggo_v1.sql
-- ============================================================
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


-- ============================================================
-- 202606180002_leaderboards.sql
-- ============================================================
create table if not exists public.leaderboard_scores (
  user_id uuid not null references auth.users on delete cascade,
  board text not null,
  score integer not null,
  display_name text not null,
  updated_at timestamptz default now(),
  primary key (user_id, board)
);

create index if not exists leaderboard_scores_board_score_idx
  on public.leaderboard_scores (board, score desc);

alter table public.leaderboard_scores enable row level security;

create policy "leaderboard owner insert" on public.leaderboard_scores
  for insert with check (auth.uid() = user_id);

create policy "leaderboard owner update" on public.leaderboard_scores
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "leaderboard public select" on public.leaderboard_scores
  for select using (true);

create or replace function public.top_scores(p_board text, p_limit integer default 50)
returns table (rank bigint, display_name text, score integer, is_me boolean)
language sql
stable
security definer set search_path = public
as $$
  select
    row_number() over (order by score desc, updated_at asc) as rank,
    display_name,
    score,
    (user_id = auth.uid()) as is_me
  from public.leaderboard_scores
  where board = p_board
  order by score desc, updated_at asc
  limit greatest(1, least(p_limit, 200));
$$;

grant execute on function public.top_scores(text, integer) to anon, authenticated;


-- ============================================================
-- 202606180003_matches.sql
-- ============================================================
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users on delete cascade,
  seed text not null,
  config jsonb not null,
  created_at timestamptz default now()
);

create table if not exists public.match_results (
  match_id uuid not null references public.matches on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  display_name text not null,
  score integer not null,
  total integer not null,
  finished_at timestamptz default now(),
  primary key (match_id, user_id)
);

create table if not exists public.friend_links (
  user_id uuid not null references auth.users on delete cascade,
  friend_id uuid not null references auth.users on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);

create index if not exists match_results_match_idx on public.match_results (match_id);
create index if not exists friend_links_friend_idx on public.friend_links (friend_id);

alter table public.matches enable row level security;
alter table public.match_results enable row level security;
alter table public.friend_links enable row level security;

create policy "matches public select" on public.matches for select using (true);
create policy "matches owner insert" on public.matches for insert with check (auth.uid() = created_by);

create policy "match_results public select" on public.match_results for select using (true);
create policy "match_results owner upsert" on public.match_results
  for insert with check (auth.uid() = user_id);
create policy "match_results owner update" on public.match_results
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "friend_links owner all" on public.friend_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.friends_leaderboard()
returns table (rank bigint, handle text, matches_played bigint, wins bigint, total_score bigint)
language sql
stable
security definer set search_path = public
as $$
  with people as (
    select auth.uid() as user_id
    union
    select friend_id from public.friend_links where user_id = auth.uid()
  ),
  match_tops as (
    select
      r.match_id,
      max(r.score) as top_score
    from public.match_results r
    group by r.match_id
  ),
  match_top_counts as (
    select
      r.match_id,
      t.top_score,
      count(*) as top_count
    from public.match_results r
    join match_tops t on t.match_id = r.match_id and t.top_score = r.score
    group by r.match_id, t.top_score
  ),
  match_stats as (
    select r.match_id, r.user_id, r.display_name, r.score, t.top_score, t.top_count
    from public.match_results r
    join people p on p.user_id = r.user_id
    join match_top_counts t on t.match_id = r.match_id
  ),
  aggregate_stats as (
    select
      user_id,
      (array_agg(display_name order by score desc, match_id))[1] as handle,
      count(*) as matches_played,
      count(*) filter (where score = top_score and top_count = 1) as wins,
      coalesce(sum(score), 0) as total_score
    from match_stats
    group by user_id
  )
  select
    row_number() over (order by wins desc, total_score desc, matches_played asc, handle asc) as rank,
    handle,
    matches_played,
    wins,
    total_score
  from aggregate_stats
  order by wins desc, total_score desc, matches_played asc, handle asc;
$$;

grant execute on function public.friends_leaderboard() to anon, authenticated;


