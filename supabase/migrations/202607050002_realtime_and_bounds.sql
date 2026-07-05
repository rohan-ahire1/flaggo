do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'match_results'
  ) then
    alter publication supabase_realtime add table public.match_results;
  end if;
end $$;

create or replace function public.validate_leaderboard_score()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.board like 'daily-%' and new.score not between 0 and 10 then
    raise exception 'leaderboard score out of bounds for board %', new.board;
  elsif (new.board like 'arcade-%' or new.board like 'trivia-%') and new.score not between 0 and 1000 then
    raise exception 'leaderboard score out of bounds for board %', new.board;
  elsif new.board = 'xp-alltime' and new.score not between 0 and 5000000 then
    raise exception 'leaderboard score out of bounds for board %', new.board;
  end if;

  return new;
end;
$$;

drop trigger if exists leaderboard_score_bounds on public.leaderboard_scores;
create trigger leaderboard_score_bounds
  before insert or update on public.leaderboard_scores
  for each row execute function public.validate_leaderboard_score();
