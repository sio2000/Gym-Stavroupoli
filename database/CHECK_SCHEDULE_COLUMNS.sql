-- Check what columns exist in personal_training_schedules table
-- This will help us understand why user_id is undefined

-- 1. Check table structure
SELECT 
    'Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'personal_training_schedules' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check sample data with all columns
SELECT 
    'Sample Data' as test_name,
    id,
    user_id,
    trainer_name,
    month,
    year,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC
LIMIT 3;

-- 3. Check if user_id column exists and has data
SELECT 
    'User ID Check' as test_name,
    COUNT(*) as total_records,
    COUNT(user_id) as records_with_user_id,
    COUNT(*) - COUNT(user_id) as records_without_user_id
FROM personal_training_schedules;

-- 4. Check specific records for Jordan
SELECT 
    'Jordan Records' as test_name,
    id,
    user_id,
    trainer_name,
    month,
    year,
    status
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan'
ORDER BY created_at DESC;

-- Success message
SELECT 'Column check completed!' as message;
