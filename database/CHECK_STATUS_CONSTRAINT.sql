-- Check the status constraint on personal_training_schedules table
-- This will help us understand why declining a schedule fails

-- 1. Check what constraints exist on the table
SELECT 
    'Table Constraints' as test_name,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'personal_training_schedules'::regclass
ORDER BY conname;

-- 2. Check what status values currently exist
SELECT 
    'Current Status Values' as test_name,
    status,
    COUNT(*) as count
FROM personal_training_schedules 
GROUP BY status
ORDER BY status;

-- 3. Check the specific constraint that's failing
SELECT 
    'Status Check Constraint' as test_name,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'personal_training_schedules'::regclass
AND conname LIKE '%status%';
