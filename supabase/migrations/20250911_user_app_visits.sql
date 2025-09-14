-- Create user_app_visits table to track user visits to the application
create table if not exists public.user_app_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  visit_date timestamp with time zone default now(),
  session_duration_minutes integer,
  page_visited text,
  user_agent text,
  created_at timestamp with time zone default now()
);

-- Create index for better performance
create index if not exists idx_user_app_visits_user_id on public.user_app_visits(user_id);
create index if not exists idx_user_app_visits_visit_date on public.user_app_visits(visit_date);

-- Enable RLS
alter table public.user_app_visits enable row level security;

-- RLS Policies
drop policy if exists "user_app_visits_select_own" on public.user_app_visits;
create policy "user_app_visits_select_own" on public.user_app_visits
  for select using (auth.uid() = user_id);

drop policy if exists "user_app_visits_insert_own" on public.user_app_visits;
create policy "user_app_visits_insert_own" on public.user_app_visits
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_app_visits_update_own" on public.user_app_visits;
create policy "user_app_visits_update_own" on public.user_app_visits
  for update using (auth.uid() = user_id);

drop policy if exists "user_app_visits_delete_own" on public.user_app_visits;
create policy "user_app_visits_delete_own" on public.user_app_visits
  for delete using (auth.uid() = user_id);

-- Function to track app visit
create or replace function public.track_app_visit(
  p_user_id uuid,
  p_page_visited text default null,
  p_session_duration_minutes integer default null
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_app_visits (user_id, page_visited, session_duration_minutes)
  values (p_user_id, p_page_visited, p_session_duration_minutes);
end;
$$;

-- Function to get monthly visits count
create or replace function public.get_user_monthly_visits(p_user_id uuid, p_month integer, p_year integer)
returns integer
language plpgsql
security definer
as $$
declare
  visit_count integer;
begin
  select count(*) into visit_count
  from public.user_app_visits
  where user_id = p_user_id
    and extract(month from visit_date) = p_month
    and extract(year from visit_date) = p_year;
  
  return coalesce(visit_count, 0);
end;
$$;
