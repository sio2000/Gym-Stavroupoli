-- User personal metrics, goals, achievements, challenges
-- All tables are per-user with RLS policies

-- 1) Metrics history (weight, height, body_fat, water_intake, etc.)
create table if not exists public.user_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_date date not null default current_date,
  weight_kg numeric(6,2),
  height_cm numeric(6,2),
  body_fat_pct numeric(5,2),
  water_liters numeric(6,2),
  age_years integer,
  gender text check (gender in ('male','female','other')),
  sleep_hours numeric(4,2),
  sleep_quality text, -- e.g. 'poor','fair','good','excellent'
  steps_per_day integer,
  workout_type text, -- e.g. 'weights','running','HIIT','pilates','free_gym'
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2) Goals per user (target weight, body fat, water, etc.)
create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_type text not null check (goal_type in ('weight','body_fat','water','custom')),
  target_value numeric(10,2) not null,
  unit text not null, -- 'kg', '%', 'L', etc
  title text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, goal_type)
);

-- 3) Achievements (derived, but we also persist to show history/badges)
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null, -- e.g. 'WATER_STREAK_7', 'WEIGHT_DOWN_5KG'
  title text not null,
  description text,
  unlocked_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  unique(user_id, code)
);

-- 4) Challenges / Suggestions assigned to user
create table if not exists public.user_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending','in_progress','completed')),
  assigned_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique(user_id, code)
);

-- 5) RLS
alter table public.user_metrics enable row level security;
alter table public.user_goals enable row level security;
alter table public.user_achievements enable row level security;
alter table public.user_challenges enable row level security;

-- Policies: users can manage only their own rows
drop policy if exists "user_metrics_select_own" on public.user_metrics;
create policy "user_metrics_select_own" on public.user_metrics
  for select using (auth.uid() = user_id);
drop policy if exists "user_metrics_insert_own" on public.user_metrics;
create policy "user_metrics_insert_own" on public.user_metrics
  for insert with check (auth.uid() = user_id);
drop policy if exists "user_metrics_update_own" on public.user_metrics;
create policy "user_metrics_update_own" on public.user_metrics
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_metrics_delete_own" on public.user_metrics;
create policy "user_metrics_delete_own" on public.user_metrics
  for delete using (auth.uid() = user_id);

drop policy if exists "user_goals_select_own" on public.user_goals;
create policy "user_goals_select_own" on public.user_goals
  for select using (auth.uid() = user_id);
drop policy if exists "user_goals_upsert_own" on public.user_goals;
create policy "user_goals_upsert_own" on public.user_goals
  for insert with check (auth.uid() = user_id);
drop policy if exists "user_goals_update_own" on public.user_goals;
create policy "user_goals_update_own" on public.user_goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_goals_delete_own" on public.user_goals;
create policy "user_goals_delete_own" on public.user_goals
  for delete using (auth.uid() = user_id);

drop policy if exists "user_achievements_select_own" on public.user_achievements;
create policy "user_achievements_select_own" on public.user_achievements
  for select using (auth.uid() = user_id);
drop policy if exists "user_achievements_insert_own" on public.user_achievements;
create policy "user_achievements_insert_own" on public.user_achievements
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_challenges_select_own" on public.user_challenges;
create policy "user_challenges_select_own" on public.user_challenges
  for select using (auth.uid() = user_id);
drop policy if exists "user_challenges_upsert_own" on public.user_challenges;
create policy "user_challenges_upsert_own" on public.user_challenges
  for insert with check (auth.uid() = user_id);
drop policy if exists "user_challenges_update_own" on public.user_challenges;
create policy "user_challenges_update_own" on public.user_challenges
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6) Updated timestamps triggers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists user_metrics_set_updated_at on public.user_metrics;
create trigger user_metrics_set_updated_at
before update on public.user_metrics
for each row execute function public.set_updated_at();

drop trigger if exists user_goals_set_updated_at on public.user_goals;
create trigger user_goals_set_updated_at
before update on public.user_goals
for each row execute function public.set_updated_at();


