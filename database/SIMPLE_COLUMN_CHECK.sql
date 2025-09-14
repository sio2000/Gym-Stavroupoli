SELECT 
    'Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'personal_training_schedules' 
AND table_schema = 'public'
ORDER BY ordinal_position;

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

SELECT 
    'User ID Check' as test_name,
    COUNT(*) as total_records,
    COUNT(user_id) as records_with_user_id,
    COUNT(*) - COUNT(user_id) as records_without_user_id
FROM personal_training_schedules;

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
