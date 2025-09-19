-- Reset Group Data for Testing
-- Run this in Supabase SQL Editor to clear all group data for fresh testing

-- Step 1: Show current data
SELECT 'BEFORE CLEANUP:' as status;

SELECT 
  COUNT(*) as active_assignments,
  MIN(assignment_date) as earliest_date,
  MAX(assignment_date) as latest_date
FROM group_assignments 
WHERE is_active = true;

SELECT 
  COUNT(*) as group_programs,
  MIN(created_at) as earliest_program,
  MAX(created_at) as latest_program
FROM personal_training_schedules
WHERE training_type = 'group';

-- Step 2: Clear all group assignments
SELECT 'CLEARING GROUP ASSIGNMENTS...' as status;

DELETE FROM group_assignments WHERE is_active = true;

-- Step 3: Clear all group programs 
SELECT 'CLEARING GROUP PROGRAMS...' as status;

DELETE FROM personal_training_schedules WHERE training_type = 'group';

-- Step 4: Reset any user weekly assignments
SELECT 'CLEARING USER WEEKLY ASSIGNMENTS...' as status;

DELETE FROM user_weekly_assignments;

-- Step 5: Verify cleanup
SELECT 'AFTER CLEANUP:' as status;

SELECT 
  COUNT(*) as remaining_assignments
FROM group_assignments 
WHERE is_active = true;

SELECT 
  COUNT(*) as remaining_programs
FROM personal_training_schedules
WHERE training_type = 'group';

SELECT 
  COUNT(*) as remaining_weekly_assignments
FROM user_weekly_assignments;

SELECT '✅ ALL GROUP DATA CLEARED - READY FOR TESTING!' as final_status;
