-- Clear Group Assignments for Testing
-- This script safely clears group assignments to allow fresh testing

-- 1. Backup existing data (optional - for safety)
SELECT 'Backing up existing group assignments...' as step;

-- Show current data before clearing
SELECT 
  'Current group assignments count: ' || COUNT(*) as info
FROM group_assignments 
WHERE is_active = true;

SELECT 
  'Current group programs count: ' || COUNT(*) as info  
FROM personal_training_schedules
WHERE training_type = 'group';

-- 2. Clear group assignments (but keep the table structure)
SELECT 'Clearing group assignments...' as step;

-- Soft delete - set is_active to false instead of hard delete
UPDATE group_assignments 
SET is_active = false, 
    updated_at = NOW(),
    notes = COALESCE(notes, '') || ' [CLEARED FOR TESTING]'
WHERE is_active = true;

-- Alternative: Hard delete if you want complete cleanup
-- DELETE FROM group_assignments WHERE is_active = true;

-- 3. Optional: Clear group programs too (if needed for complete reset)
-- Uncomment the lines below if you want to clear group programs as well

-- UPDATE personal_training_schedules 
-- SET training_type = 'individual'
-- WHERE training_type = 'group';

-- 4. Verify cleanup
SELECT 'Verification after cleanup...' as step;

SELECT 
  'Active group assignments after cleanup: ' || COUNT(*) as result
FROM group_assignments 
WHERE is_active = true;

SELECT 
  'Group programs remaining: ' || COUNT(*) as result
FROM personal_training_schedules
WHERE training_type = 'group';

-- 5. Show what was cleared
SELECT 
  COUNT(*) as cleared_assignments_count,
  MIN(created_at) as oldest_cleared,
  MAX(created_at) as newest_cleared
FROM group_assignments 
WHERE is_active = false 
  AND notes LIKE '%CLEARED FOR TESTING%';

SELECT 'Group assignments cleared successfully for testing!' as status;
