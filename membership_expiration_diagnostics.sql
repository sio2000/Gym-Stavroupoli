-- =====================================================
-- ΔΙΑΓΝΩΣΤΙΚΑ QUERIES ΓΙΑ MEMBERSHIP EXPIRATION
-- =====================================================
-- Εκτέλεση στο Supabase SQL Editor για διάγνωση

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

-- ========================================
-- STEP 2: EXPIRED BUT ACTIVE MEMBERSHIPS
-- ========================================

-- Count rows where end_date <= now() but is_active is true (if column exists)
SELECT 
    'EXPIRED BUT STILL ACTIVE' as analysis_type,
    COUNT(*) as count
FROM memberships
WHERE end_date <= CURRENT_DATE
AND (
    (is_active IS TRUE) OR 
    (status = 'active')
);

-- Show details of expired but active memberships
SELECT 
    'EXPIRED MEMBERSHIP DETAILS' as analysis_type,
    m.id, 
    m.user_id, 
    m.package_id, 
    m.start_date, 
    m.end_date,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active')
        THEN m.is_active::text
        ELSE 'COLUMN_NOT_EXISTS'
    END as is_active,
    m.status,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name
FROM memberships m
LEFT JOIN user_profiles up ON m.user_id = up.user_id
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.end_date <= CURRENT_DATE
AND (
    (EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active') AND m.is_active = true) OR
    (m.status = 'active')
)
ORDER BY m.end_date DESC;

-- ========================================
-- STEP 3: MISSING EXPIRATION DATES
-- ========================================

-- Count memberships with NULL end_date
SELECT 
    'MISSING END_DATES' as analysis_type,
    COUNT(*) as count
FROM memberships
WHERE end_date IS NULL;

-- Show memberships with missing end_dates
SELECT 
    'MISSING END_DATE DETAILS' as analysis_type,
    m.id,
    m.user_id,
    m.start_date,
    m.end_date,
    m.status,
    up.first_name,
    up.last_name,
    mp.name as package_name
FROM memberships m
LEFT JOIN user_profiles up ON m.user_id = up.user_id
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.end_date IS NULL;

-- ========================================
-- STEP 4: OVERALL MEMBERSHIP STATUS
-- ========================================

-- Summary of all memberships by status
SELECT 
    'MEMBERSHIP STATUS SUMMARY' as analysis_type,
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN end_date <= CURRENT_DATE THEN 1 END) as expired_by_date,
    COUNT(CASE WHEN end_date > CURRENT_DATE THEN 1 END) as still_valid_by_date
FROM memberships
GROUP BY status
ORDER BY status;

-- ========================================
-- STEP 5: CHECK FOR SCHEDULED JOBS
-- ========================================

-- Check if pg_cron extension exists and any scheduled jobs
SELECT 
    'SCHEDULED JOBS CHECK' as analysis_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
        THEN 'pg_cron extension is installed'
        ELSE 'pg_cron extension NOT installed'
    END as cron_status;

-- If pg_cron exists, check for scheduled jobs
SELECT 
    'CRON JOBS' as analysis_type,
    jobname,
    schedule,
    command,
    active
FROM cron.job
WHERE command LIKE '%membership%' OR command LIKE '%expire%'
ORDER BY jobname;

-- ========================================
-- STEP 6: RLS POLICIES CHECK
-- ========================================

-- Check RLS policies for memberships table
SELECT 
    'RLS POLICIES' as analysis_type,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'memberships'
ORDER BY policyname;

-- ========================================
-- STEP 7: CURRENT ACTIVE USERS
-- ========================================

-- Show users with active memberships
SELECT 
    'CURRENTLY ACTIVE USERS' as analysis_type,
    COUNT(DISTINCT m.user_id) as active_users_count
FROM memberships m
WHERE m.status = 'active'
AND m.end_date >= CURRENT_DATE;

-- Show users who should have QR access
SELECT 
    'QR ACCESS USERS' as analysis_type,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active')
        THEN m.is_active::text
        ELSE 'COLUMN_NOT_EXISTS'
    END as is_active,
    CASE 
        WHEN m.end_date >= CURRENT_DATE THEN 'SHOULD_HAVE_ACCESS'
        ELSE 'SHOULD_NOT_HAVE_ACCESS'
    END as qr_access_status
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.status = 'active'
ORDER BY m.end_date DESC;

-- ========================================
-- STEP 8: TIMEZONE CHECK
-- ========================================

-- Check timezone settings
SELECT 
    'TIMEZONE CHECK' as analysis_type,
    current_setting('TIMEZONE') as current_timezone,
    NOW() as current_timestamp_with_tz,
    CURRENT_DATE as current_date,
    CURRENT_TIMESTAMP as current_timestamp;

-- ========================================
-- FINAL SUMMARY
-- ========================================

SELECT '=== DIAGNOSTIC SUMMARY ===' as final_summary;
