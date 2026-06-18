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
