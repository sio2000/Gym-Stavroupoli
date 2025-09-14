-- Backup migration: Disable RLS completely if needed
-- Use this only if the main RLS fix doesn't work

-- Disable RLS completely for all user tables
alter table public.user_metrics disable row level security;
alter table public.user_goals disable row level security;
alter table public.user_achievements disable row level security;
alter table public.user_challenges disable row level security;
alter table public.user_app_visits disable row level security;

-- Grant all permissions to authenticated users
grant all on public.user_metrics to authenticated;
grant all on public.user_goals to authenticated;
grant all on public.user_achievements to authenticated;
grant all on public.user_challenges to authenticated;
grant all on public.user_app_visits to authenticated;
