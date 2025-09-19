-- =====================================================
-- ΔΙΑΓΝΩΣΤΙΚΑ QUERIES ΓΙΑ MEMBERSHIP EXPIRATION (FIXED)
-- =====================================================
-- Εκτέλεση στο Supabase SQL Editor για διάγνωση
-- ΔΙΟΡΘΩΜΕΝΟ: Δεν κρασάρει αν δεν υπάρχει pg_cron

-- ========================================
-- STEP 1: SCHEMA ANALYSIS
-- ========================================

-- Show schema for memberships table
SELECT 
    'MEMBERSHIPS TABLE SCHEMA' as analysis_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;

-- Check if critical columns exist
SELECT 
    'COLUMN EXISTENCE CHECK' as analysis_type,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active')
         THEN 'is_active column EXISTS'
         ELSE 'is_active column MISSING' END as is_active_status,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'end_date')
         THEN 'end_date column EXISTS'
         ELSE 'end_date column MISSING' END as end_date_status,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'expires_at')
         THEN 'expires_at column EXISTS'
         ELSE 'expires_at column MISSING' END as expires_at_status;

-- ========================================
-- STEP 2: EXPIRED BUT ACTIVE MEMBERSHIPS
-- ========================================

-- Count rows where end_date <= now() but still marked as active
SELECT 
    'EXPIRED BUT STILL ACTIVE COUNT' as analysis_type,
    COUNT(*) as count
FROM memberships
WHERE end_date <= CURRENT_DATE
AND (
    (CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active')
          THEN is_active = true
          ELSE false END) OR 
    (status = 'active')
);

-- Show details of problematic memberships
SELECT 
    'PROBLEMATIC MEMBERSHIP DETAILS' as analysis_type,
    m.id, 
    m.user_id, 
    m.package_id, 
    m.start_date, 
    m.end_date,
    (CURRENT_DATE - m.end_date) as days_overdue,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active')
        THEN m.is_active::text
        ELSE 'COLUMN_NOT_EXISTS'
    END as is_active,
    m.status,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    mp.package_type
FROM memberships m
LEFT JOIN user_profiles up ON m.user_id = up.user_id
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.end_date <= CURRENT_DATE
AND (
    (EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active') AND m.is_active = true) OR
    (m.status = 'active')
)
ORDER BY m.end_date ASC;

-- ========================================
-- STEP 3: MEMBERSHIP STATUS SUMMARY
-- ========================================

-- Summary of all memberships by status
SELECT 
    'MEMBERSHIP STATUS SUMMARY' as analysis_type,
    status,
    COUNT(*) as total_count,
    COUNT(CASE WHEN end_date <= CURRENT_DATE THEN 1 END) as expired_by_date,
    COUNT(CASE WHEN end_date > CURRENT_DATE THEN 1 END) as still_valid_by_date,
    COUNT(CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active')
        THEN (CASE WHEN is_active = true THEN 1 END)
        ELSE NULL 
    END) as marked_as_active
FROM memberships
GROUP BY status
ORDER BY status;

-- ========================================
-- STEP 4: USERS AFFECTED BY THE BUG
-- ========================================

-- Show users who currently have QR access but shouldn't
SELECT 
    'USERS WITH INCORRECT QR ACCESS' as analysis_type,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    mp.package_type,
    m.start_date,
    m.end_date,
    (CURRENT_DATE - m.end_date) as days_overdue,
    m.status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active')
        THEN m.is_active::text
        ELSE 'COLUMN_NOT_EXISTS'
    END as is_active,
    'SHOULD_NOT_HAVE_QR_ACCESS' as expected_status
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.end_date < CURRENT_DATE
AND (
    (EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active') AND m.is_active = true) OR
    (m.status = 'active')
)
ORDER BY (CURRENT_DATE - m.end_date) DESC;

-- ========================================
-- STEP 5: CHECK FOR EXISTING FUNCTIONS
-- ========================================

-- Check if expiration functions exist
SELECT 
    'EXISTING FUNCTIONS CHECK' as analysis_type,
    proname as function_name,
    CASE 
        WHEN proname = 'expire_memberships' THEN 'Function for manual expiration'
        WHEN proname = 'check_and_expire_memberships' THEN 'Function for checking and expiring'
        WHEN proname = 'scheduled_expire_memberships' THEN 'Function for scheduled expiration'
        ELSE 'Other function'
    END as description
FROM pg_proc 
WHERE proname LIKE '%expire%membership%' OR proname LIKE '%membership%expire%'
ORDER BY proname;

-- ========================================
-- STEP 6: SCHEDULED JOBS CHECK (SAFE)
-- ========================================

-- Safely check if pg_cron extension exists
SELECT 
    'PG_CRON EXTENSION CHECK' as analysis_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
        THEN 'pg_cron extension IS INSTALLED'
        ELSE 'pg_cron extension NOT INSTALLED'
    END as cron_status;

-- Only check cron jobs if extension exists
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- This will only run if pg_cron exists
        RAISE NOTICE 'pg_cron is available - checking for scheduled jobs...';
        
        -- Show existing cron jobs related to memberships
        PERFORM pg_notify('cron_jobs_check', 'Checking cron jobs...');
    ELSE
        RAISE NOTICE 'pg_cron is NOT available - no scheduled jobs possible';
        RAISE NOTICE 'RECOMMENDATION: Use Supabase Edge Functions with scheduled triggers instead';
    END IF;
END $$;

-- ========================================
-- STEP 7: RLS POLICIES CHECK
-- ========================================

-- Check RLS policies for memberships table
SELECT 
    'RLS POLICIES' as analysis_type,
    policyname,
    permissive,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN LEFT(qual, 100) || '...'
        ELSE 'No qualification'
    END as qualification_preview
FROM pg_policies
WHERE tablename = 'memberships'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
    'RLS STATUS' as analysis_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'memberships';

-- ========================================
-- STEP 8: TIMEZONE CHECK
-- ========================================

-- Check timezone settings and current time
SELECT 
    'TIMEZONE CHECK' as analysis_type,
    current_setting('TIMEZONE') as current_timezone,
    NOW() as current_timestamp_with_tz,
    CURRENT_DATE as current_date,
    CURRENT_TIMESTAMP as current_timestamp,
    NOW()::date as now_as_date;

-- ========================================
-- STEP 9: SAMPLE MEMBERSHIP DATA
-- ========================================

-- Show sample of current memberships for context
SELECT 
    'SAMPLE MEMBERSHIP DATA' as analysis_type,
    m.id,
    up.first_name,
    up.last_name,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    (m.end_date - CURRENT_DATE) as days_remaining,
    m.status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active')
        THEN m.is_active::text
        ELSE 'COLUMN_NOT_EXISTS'
    END as is_active,
    CASE 
        WHEN m.end_date >= CURRENT_DATE THEN 'SHOULD_HAVE_QR_ACCESS'
        ELSE 'SHOULD_NOT_HAVE_QR_ACCESS'
    END as expected_qr_access
FROM memberships m
LEFT JOIN user_profiles up ON m.user_id = up.user_id
LEFT JOIN membership_packages mp ON m.package_id = mp.id
ORDER BY m.end_date DESC
LIMIT 10;

-- ========================================
-- FINAL SUMMARY
-- ========================================

SELECT '=== DIAGNOSTIC SUMMARY ===' as final_summary,
       'Ready for root cause analysis' as next_step;
