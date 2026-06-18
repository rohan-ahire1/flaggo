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
