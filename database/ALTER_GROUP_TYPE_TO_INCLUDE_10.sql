-- Safely extend allowed group sizes to include 10 without touching other logic
-- This script updates check constraints where they previously allowed only (2, 3, 6)

-- group_assignments.group_type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints c
    JOIN information_schema.constraint_column_usage u ON c.constraint_name = u.constraint_name
    WHERE u.table_schema = 'public'
      AND u.table_name = 'group_assignments'
      AND u.column_name = 'group_type'
  ) THEN
    BEGIN
      ALTER TABLE public.group_assignments DROP CONSTRAINT IF EXISTS group_assignments_group_type_check;
    EXCEPTION WHEN undefined_object THEN
      -- ignore
    END;
  END IF;
END $$;

ALTER TABLE public.group_assignments
  ADD CONSTRAINT group_assignments_group_type_check
  CHECK (group_type IN (2, 3, 6, 10));

-- group_schedule_templates.group_type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints c
    JOIN information_schema.constraint_column_usage u ON c.constraint_name = u.constraint_name
    WHERE u.table_schema = 'public'
      AND u.table_name = 'group_schedule_templates'
      AND u.column_name = 'group_type'
  ) THEN
    BEGIN
      ALTER TABLE public.group_schedule_templates DROP CONSTRAINT IF EXISTS group_schedule_templates_group_type_check;
    EXCEPTION WHEN undefined_object THEN
    END;
  END IF;
END $$;

ALTER TABLE public.group_schedule_templates
  ADD CONSTRAINT group_schedule_templates_group_type_check
  CHECK (group_type IN (2, 3, 6, 10));

-- personal_training_schedules.group_room_size
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints c
    JOIN information_schema.constraint_column_usage u ON c.constraint_name = u.constraint_name
    WHERE u.table_schema = 'public'
      AND u.table_name = 'personal_training_schedules'
      AND u.column_name = 'group_room_size'
  ) THEN
    BEGIN
      ALTER TABLE public.personal_training_schedules DROP CONSTRAINT IF EXISTS personal_training_schedules_group_room_size_check;
    EXCEPTION WHEN undefined_object THEN
    END;
  END IF;
END $$;

ALTER TABLE public.personal_training_schedules
  ADD CONSTRAINT personal_training_schedules_group_room_size_check
  CHECK (group_room_size IS NULL OR group_room_size IN (2, 3, 6, 10));

-- Optional: comments for documentation (non-breaking)
COMMENT ON COLUMN public.personal_training_schedules.group_room_size IS 'Number of users in the group room (2, 3, 6, or 10)';

