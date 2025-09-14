-- TEST PERSONAL TRAINING CODES - ΔΟΚΙΜΗ PERSONAL TRAINING CODES
-- Εκτέλεση στο Supabase SQL Editor

-- Check current structure
SELECT 
    'Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'personal_training_codes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert a new code
INSERT INTO personal_training_codes (
    code,
    user_id,
    sessions_remaining,
    package_type,
    created_by,
    is_active
) VALUES (
    'TEST12345',
    '00000000-0000-0000-0000-000000000004',
    5,
    'personal_training',
    '00000000-0000-0000-0000-000000000001',
    true
) ON CONFLICT (code) DO NOTHING;

-- Test query that AdminPanel uses
SELECT 
    'AdminPanel Query Test' as test_name,
    user_id,
    code,
    package_type,
    sessions_remaining
FROM personal_training_codes 
WHERE is_active = true;

-- Test query with user info
SELECT 
    'Codes with User Info' as test_name,
    ptc.code,
    ptc.sessions_remaining,
    ptc.package_type,
    up.first_name,
    up.last_name,
    up.email
FROM personal_training_codes ptc
JOIN user_profiles up ON ptc.user_id = up.user_id
WHERE ptc.is_active = true;

-- Check RLS policies
SELECT 
    'RLS Policies' as test_name,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'personal_training_codes'
AND schemaname = 'public';

-- Success message
SELECT 'Personal training codes test completed!' as message;
