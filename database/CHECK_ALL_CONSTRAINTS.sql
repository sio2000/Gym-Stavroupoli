-- Check all constraints on personal_training_schedules table
-- This will help us identify any other constraints that might be causing issues

-- 1. Check all constraints on the table
SELECT 
    'All Constraints' as test_name,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'personal_training_schedules'::regclass
ORDER BY conname;

-- 2. Check if there are any triggers that might be interfering
SELECT 
    'Table Triggers' as test_name,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'personal_training_schedules'
ORDER BY trigger_name;

-- 3. Check the table structure to see what columns exist
SELECT 
    'Table Columns' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'personal_training_schedules' 
AND table_schema = 'public'
ORDER BY ordinal_position;
