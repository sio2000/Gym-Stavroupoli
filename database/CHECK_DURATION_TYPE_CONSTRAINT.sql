-- Check the duration_type constraint
-- This will show us what values are allowed for duration_type

-- Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_package_durations'::regclass 
AND conname LIKE '%duration_type%';

-- Check existing duration types in the table
SELECT DISTINCT duration_type FROM membership_package_durations ORDER BY duration_type;
