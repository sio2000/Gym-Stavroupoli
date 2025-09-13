-- ALTERs to extend user_metrics with new wellness fields
-- Run this after the original table exists

alter table public.user_metrics add column if not exists age_years integer;
alter table public.user_metrics add column if not exists gender text;
alter table public.user_metrics add column if not exists sleep_hours numeric(4,2);
alter table public.user_metrics add column if not exists sleep_quality text;
alter table public.user_metrics add column if not exists steps_per_day integer;
alter table public.user_metrics add column if not exists workout_type text;

-- Add gender check constraint (idempotent)
do $$ begin
  alter table public.user_metrics add constraint user_metrics_gender_chk
    check (gender in ('male','female','other'));
exception when duplicate_object then null; end $$;


