-- Fix RLS policies for user_metrics table
-- Drop existing policies if they exist
drop policy if exists "user_metrics_select_own" on public.user_metrics;
drop policy if exists "user_metrics_insert_own" on public.user_metrics;
drop policy if exists "user_metrics_update_own" on public.user_metrics;
drop policy if exists "user_metrics_delete_own" on public.user_metrics;

-- Create new policies with proper permissions
create policy "user_metrics_select_own" on public.user_metrics
  for select using (auth.uid() = user_id);

create policy "user_metrics_insert_own" on public.user_metrics
  for insert with check (auth.uid() = user_id);

create policy "user_metrics_update_own" on public.user_metrics
  for update using (auth.uid() = user_id);

create policy "user_metrics_delete_own" on public.user_metrics
  for delete using (auth.uid() = user_id);

-- Also fix user_goals policies
drop policy if exists "user_goals_select_own" on public.user_goals;
drop policy if exists "user_goals_insert_own" on public.user_goals;
drop policy if exists "user_goals_update_own" on public.user_goals;
drop policy if exists "user_goals_delete_own" on public.user_goals;

create policy "user_goals_select_own" on public.user_goals
  for select using (auth.uid() = user_id);

create policy "user_goals_insert_own" on public.user_goals
  for insert with check (auth.uid() = user_id);

create policy "user_goals_update_own" on public.user_goals
  for update using (auth.uid() = user_id);

create policy "user_goals_delete_own" on public.user_goals
  for delete using (auth.uid() = user_id);

-- Also fix user_achievements policies
drop policy if exists "user_achievements_select_own" on public.user_achievements;
drop policy if exists "user_achievements_insert_own" on public.user_achievements;
drop policy if exists "user_achievements_update_own" on public.user_achievements;
drop policy if exists "user_achievements_delete_own" on public.user_achievements;

create policy "user_achievements_select_own" on public.user_achievements
  for select using (auth.uid() = user_id);

create policy "user_achievements_insert_own" on public.user_achievements
  for insert with check (auth.uid() = user_id);

create policy "user_achievements_update_own" on public.user_achievements
  for update using (auth.uid() = user_id);

create policy "user_achievements_delete_own" on public.user_achievements
  for delete using (auth.uid() = user_id);

-- Also fix user_challenges policies
drop policy if exists "user_challenges_select_own" on public.user_challenges;
drop policy if exists "user_challenges_insert_own" on public.user_challenges;
drop policy if exists "user_challenges_update_own" on public.user_challenges;
drop policy if exists "user_challenges_delete_own" on public.user_challenges;

create policy "user_challenges_select_own" on public.user_challenges
  for select using (auth.uid() = user_id);

create policy "user_challenges_insert_own" on public.user_challenges
  for insert with check (auth.uid() = user_id);

create policy "user_challenges_update_own" on public.user_challenges
  for update using (auth.uid() = user_id);

create policy "user_challenges_delete_own" on public.user_challenges
  for delete using (auth.uid() = user_id);

-- Also fix user_app_visits policies
drop policy if exists "user_app_visits_select_own" on public.user_app_visits;
drop policy if exists "user_app_visits_insert_own" on public.user_app_visits;
drop policy if exists "user_app_visits_update_own" on public.user_app_visits;
drop policy if exists "user_app_visits_delete_own" on public.user_app_visits;

create policy "user_app_visits_select_own" on public.user_app_visits
  for select using (auth.uid() = user_id);

create policy "user_app_visits_insert_own" on public.user_app_visits
  for insert with check (auth.uid() = user_id);

create policy "user_app_visits_update_own" on public.user_app_visits
  for update using (auth.uid() = user_id);

create policy "user_app_visits_delete_own" on public.user_app_visits
  for delete using (auth.uid() = user_id);
