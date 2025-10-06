-- Create table to persist per-user Existing Sessions presets for Group weekly plans
-- Run this in Supabase SQL editor

create table if not exists public.user_group_weekly_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  weekly_frequency integer not null check (weekly_frequency between 1 and 7),
  sessions jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, weekly_frequency)
);

create index if not exists idx_ugwp_user on public.user_group_weekly_presets(user_id);
create index if not exists idx_ugwp_user_freq on public.user_group_weekly_presets(user_id, weekly_frequency);

-- Trigger to maintain updated_at
create or replace function public.update_ugwp_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_update_ugwp_updated_at') then
    create trigger trg_update_ugwp_updated_at
      before update on public.user_group_weekly_presets
      for each row execute function public.update_ugwp_updated_at();
  end if;
end $$;

alter table public.user_group_weekly_presets enable row level security;

-- Allow admins full access
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'user_group_weekly_presets' and policyname = 'Admins manage UGWP') then
    create policy "Admins manage UGWP" on public.user_group_weekly_presets
      for all using (
        exists(select 1 from public.user_profiles up where up.user_id = auth.uid() and up.role = 'admin')
      );
  end if;
end $$;

-- Allow users to read their own presets
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'user_group_weekly_presets' and policyname = 'Users read their UGWP') then
    create policy "Users read their UGWP" on public.user_group_weekly_presets
      for select using (user_id = auth.uid());
  end if;
end $$;

