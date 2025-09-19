-- Fix foreign key constraints for group programs overview
-- This script ensures the proper foreign key relationships exist

-- Add foreign key constraint between personal_training_schedules and user_profiles if it doesn't exist
DO $$
BEGIN
  -- Check if the foreign key constraint exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'personal_training_schedules_user_id_fkey'
    AND table_name = 'personal_training_schedules'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE personal_training_schedules
    ADD CONSTRAINT personal_training_schedules_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint personal_training_schedules_user_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint personal_training_schedules_user_id_fkey already exists';
  END IF;
END $$;

-- Verify the constraint exists
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'personal_training_schedules'
  AND kcu.column_name = 'user_id';

-- Also check what training_type values exist in the database
SELECT 
  training_type,
  COUNT(*) as count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM personal_training_schedules
GROUP BY training_type
ORDER BY training_type;

-- Check the month/year distribution of group programs
SELECT 
  month,
  year,
  training_type,
  COUNT(*) as count
FROM personal_training_schedules
WHERE training_type = 'group'
GROUP BY month, year, training_type
ORDER BY year, month;
