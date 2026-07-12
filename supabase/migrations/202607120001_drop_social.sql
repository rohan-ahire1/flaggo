-- Flaggo went single-player: drop multiplayer matches, friends, and leaderboards.
-- Apply whenever convenient; the app no longer reads or writes these objects.

drop function if exists public.friends_leaderboard();
drop function if exists public.top_scores(text, integer);
drop function if exists public.validate_leaderboard_score() cascade;

drop table if exists public.friend_links;
drop table if exists public.match_results;
drop table if exists public.matches;
drop table if exists public.leaderboard_scores;
