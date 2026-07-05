-- Tighten RPC execution and make RLS auth checks cheaper at scale.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

alter function public.top_scores(text, integer) security invoker;
alter function public.friends_leaderboard() security invoker;

revoke execute on function public.friends_leaderboard() from public, anon;
grant execute on function public.friends_leaderboard() to authenticated;
grant execute on function public.top_scores(text, integer) to anon, authenticated;

create index if not exists purchases_user_id_idx on public.purchases (user_id);
create index if not exists matches_created_by_idx on public.matches (created_by);
create index if not exists match_results_user_id_idx on public.match_results (user_id);

drop policy if exists "profiles owner select" on public.profiles;
drop policy if exists "profiles owner insert" on public.profiles;
drop policy if exists "profiles owner update" on public.profiles;
create policy "profiles owner select" on public.profiles for select using ((select auth.uid()) = id);
create policy "profiles owner insert" on public.profiles for insert with check ((select auth.uid()) = id);
create policy "profiles owner update" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "progress owner select" on public.progress;
drop policy if exists "progress owner insert" on public.progress;
drop policy if exists "progress owner update" on public.progress;
create policy "progress owner select" on public.progress for select using ((select auth.uid()) = user_id);
create policy "progress owner insert" on public.progress for insert with check ((select auth.uid()) = user_id);
create policy "progress owner update" on public.progress for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "entitlements owner select" on public.entitlements;
drop policy if exists "entitlements owner insert" on public.entitlements;
create policy "entitlements owner select" on public.entitlements for select using ((select auth.uid()) = user_id);
create policy "entitlements owner insert" on public.entitlements for insert with check ((select auth.uid()) = user_id);

drop policy if exists "purchases owner select" on public.purchases;
create policy "purchases owner select" on public.purchases for select using ((select auth.uid()) = user_id);

drop policy if exists "leaderboard owner insert" on public.leaderboard_scores;
drop policy if exists "leaderboard owner update" on public.leaderboard_scores;
create policy "leaderboard owner insert" on public.leaderboard_scores for insert with check ((select auth.uid()) = user_id);
create policy "leaderboard owner update" on public.leaderboard_scores for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "matches owner insert" on public.matches;
create policy "matches owner insert" on public.matches for insert with check ((select auth.uid()) = created_by);

drop policy if exists "match_results owner upsert" on public.match_results;
drop policy if exists "match_results owner update" on public.match_results;
create policy "match_results owner upsert" on public.match_results for insert with check ((select auth.uid()) = user_id);
create policy "match_results owner update" on public.match_results for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "friend_links owner all" on public.friend_links;
create policy "friend_links owner all" on public.friend_links for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
