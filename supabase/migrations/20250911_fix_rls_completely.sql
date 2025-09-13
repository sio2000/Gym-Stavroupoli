-- Complete RLS fix for all user tables
-- This migration will fix all RLS issues

-- First, disable RLS temporarily to fix the policies
alter table public.user_metrics disable row level security;
alter table public.user_goals disable row level security;
alter table public.user_achievements disable row level security;
alter table public.user_challenges disable row level security;
alter table public.user_app_visits disable row level security;

-- Drop all existing policies
drop policy if exists "user_metrics_select_own" on public.user_metrics;
drop policy if exists "user_metrics_insert_own" on public.user_metrics;
drop policy if exists "user_metrics_update_own" on public.user_metrics;
drop policy if exists "user_metrics_delete_own" on public.user_metrics;

drop policy if exists "user_goals_select_own" on public.user_goals;
drop policy if exists "user_goals_insert_own" on public.user_goals;
drop policy if exists "user_goals_update_own" on public.user_goals;
drop policy if exists "user_goals_delete_own" on public.user_goals;

drop policy if exists "user_achievements_select_own" on public.user_achievements;
drop policy if exists "user_achievements_insert_own" on public.user_achievements;
drop policy if exists "user_achievements_update_own" on public.user_achievements;
drop policy if exists "user_achievements_delete_own" on public.user_achievements;

drop policy if exists "user_challenges_select_own" on public.user_challenges;
drop policy if exists "user_challenges_insert_own" on public.user_challenges;
drop policy if exists "user_challenges_update_own" on public.user_challenges;
drop policy if exists "user_challenges_delete_own" on public.user_challenges;

drop policy if exists "user_app_visits_select_own" on public.user_app_visits;
drop policy if exists "user_app_visits_insert_own" on public.user_app_visits;
drop policy if exists "user_app_visits_update_own" on public.user_app_visits;
drop policy if exists "user_app_visits_delete_own" on public.user_app_visits;

-- Re-enable RLS
alter table public.user_metrics enable row level security;
alter table public.user_goals enable row level security;
alter table public.user_achievements enable row level security;
alter table public.user_challenges enable row level security;
alter table public.user_app_visits enable row level security;

-- Create simple and effective policies for user_metrics
create policy "user_metrics_all" on public.user_metrics
  for all using (auth.uid() = user_id);

-- Create simple and effective policies for user_goals
create policy "user_goals_all" on public.user_goals
  for all using (auth.uid() = user_id);

-- Create simple and effective policies for user_achievements
create policy "user_achievements_all" on public.user_achievements
  for all using (auth.uid() = user_id);

-- Create simple and effective policies for user_challenges
create policy "user_challenges_all" on public.user_challenges
  for all using (auth.uid() = user_id);

-- Create simple and effective policies for user_app_visits
create policy "user_app_visits_all" on public.user_app_visits
  for all using (auth.uid() = user_id);

-- Grant necessary permissions
grant all on public.user_metrics to authenticated;
grant all on public.user_goals to authenticated;
grant all on public.user_achievements to authenticated;
grant all on public.user_challenges to authenticated;
grant all on public.user_app_visits to authenticated;
