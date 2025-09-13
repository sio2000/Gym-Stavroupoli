/* CHECK EXISTING DATA - ΕΛΕΓΧΟΣ ΥΠΑΡΧΟΝΤΩΝ ΔΕΔΟΜΕΝΩΝ
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check all personal training schedules */
SELECT 
    'All Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    month,
    year,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC;

/* 2. Check schedule data structure */
SELECT 
    'Schedule Data Structure' as test_name,
    id,
    trainer_name,
    schedule_data
FROM personal_training_schedules 
LIMIT 3;

/* 3. Check if there are any schedules for Mike */
SELECT 
    'Mike Schedules' as test_name,
    COUNT(*) as count,
    trainer_name
FROM personal_training_schedules 
WHERE trainer_name = 'Mike'
GROUP BY trainer_name;

/* 4. Check if there are any schedules for Jordan */
SELECT 
    'Jordan Schedules' as test_name,
    COUNT(*) as count,
    trainer_name
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan'
GROUP BY trainer_name;

/* 5. Check users that have schedules */
SELECT 
    'Users with Schedules' as test_name,
    up.first_name,
    up.last_name,
    up.email,
    pts.trainer_name,
    pts.status
FROM user_profiles up
JOIN personal_training_schedules pts ON up.user_id = pts.user_id
ORDER BY pts.created_at DESC;

/* 6. Test get_trainer_users function for Mike */
SELECT 
    'Mike Users via Function' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Mike')
LIMIT 5;

/* 7. Test get_trainer_users function for Jordan */
SELECT 
    'Jordan Users via Function' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Jordan')
LIMIT 5;

/* Success message */
SELECT 'Data check completed!' as message;
