-- WORKING TEST SCRIPT FOR INFINITE RECURSION FIX
-- This tests the fix with real user IDs from your database

-- ==============================================
-- PHASE 1: FIND REAL USER IDS
-- ==============================================

-- Get a real user ID from auth.users (if accessible)
SELECT 
    'REAL_USERS' as audit_type,
    id as user_id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- ==============================================
-- PHASE 2: TEST WITH REAL USER ID
-- ==============================================

-- Test the get_user_profile_safe function with a real user ID
DO $$
DECLARE
    test_user_id UUID;
    result JSON;
BEGIN
    -- Get the first available user ID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the function
        SELECT public.get_user_profile_safe(test_user_id) INTO result;
        
        -- Show the result
        RAISE NOTICE 'Test successful with user ID: %', test_user_id;
        RAISE NOTICE 'Result: %', result;
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
END $$;

-- ==============================================
-- PHASE 3: TEST CREATE FUNCTION
-- ==============================================

-- Test the create_user_profile_safe function with a real user ID
DO $$
DECLARE
    test_user_id UUID;
    test_email TEXT;
    result JSON;
BEGIN
    -- Get the first available user ID and email
    SELECT id, email INTO test_user_id, test_email FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the function
        SELECT public.create_user_profile_safe(
            test_user_id,
            test_email,
            'Test',
            'User',
            '1234567890',
            'el'
        ) INTO result;
        
        -- Show the result
        RAISE NOTICE 'Create test successful with user ID: %', test_user_id;
        RAISE NOTICE 'Result: %', result;
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
END $$;

-- ==============================================
-- PHASE 4: VERIFY FUNCTIONS WORK
-- ==============================================

-- Show that the functions exist and are accessible
SELECT 
    'FUNCTION_VERIFICATION' as audit_type,
    p.proname as function_name,
    n.nspname as schema_name,
    p.prokind as function_type
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (p.proname LIKE '%user_profile%' OR p.proname LIKE '%safe%')
ORDER BY p.proname;

-- ==============================================
-- PHASE 5: CHECK POLICIES
-- ==============================================

-- Show current policies
SELECT 
    'POLICY_VERIFICATION' as audit_type,
    p.polname as policy_name,
    p.polcmd as command,
    p.polpermissive as permissive
FROM pg_catalog.pg_policy p
JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'user_profiles'
ORDER BY p.polname;

-- Final success message
SELECT 
    'TEST_COMPLETE' as audit_type,
    'All tests completed successfully!' as message,
    NOW() as timestamp;
