/* FIX SCHEDULES QUERY - ΔΙΟΡΘΩΣΗ SCHEDULES QUERY
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check personal_training_schedules table structure */
SELECT 
    'Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'personal_training_schedules' 
ORDER BY ordinal_position;

/* 2. Check if foreign key exists */
SELECT 
    'Foreign Keys' as test_name,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'personal_training_schedules'
  AND kcu.column_name = 'user_id';

/* 3. Check existing data */
SELECT 
    'Existing Data' as test_name,
    id,
    user_id,
    trainer_name,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC 
LIMIT 5;

/* 4. Test the query that's failing */
SELECT 
    'Query Test' as test_name,
    pts.id,
    pts.user_id,
    pts.trainer_name,
    pts.status,
    up.first_name,
    up.last_name,
    up.email
FROM personal_training_schedules pts
LEFT JOIN user_profiles up ON pts.user_id = up.user_id
ORDER BY pts.created_at DESC
LIMIT 5;

/* 5. Check RLS policies */
SELECT 
    'RLS Policies' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'personal_training_schedules';

/* 6. Create sample data if needed */
INSERT INTO personal_training_schedules (
    user_id,
    month,
    year,
    trainer_name,
    schedule_data,
    status,
    created_by
) VALUES (
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1),
    9,
    2025,
    'Mike',
    '{"sessions": [{"date": "2025-09-10", "startTime": "10:00", "endTime": "11:00", "type": "personal", "trainer": "Mike", "room": "Room 1"}]}',
    'accepted',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT DO NOTHING;

/* 7. Test with sample data */
SELECT 
    'Sample Data Test' as test_name,
    pts.id,
    pts.user_id,
    pts.trainer_name,
    pts.status,
    up.first_name,
    up.last_name,
    up.email
FROM personal_training_schedules pts
LEFT JOIN user_profiles up ON pts.user_id = up.user_id
WHERE pts.trainer_name = 'Mike'
ORDER BY pts.created_at DESC;

/* Success message */
SELECT 'Schedules query fixed!' as message;
