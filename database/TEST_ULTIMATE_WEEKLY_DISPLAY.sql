-- TEST ULTIMATE WEEKLY DISPLAY FUNCTIONALITY
-- This script tests the weekly display functionality for Ultimate users

-- ========================================
-- PHASE 1: CHECK FEATURE FLAG STATUS
-- ========================================

SELECT 'PHASE 1: Checking feature flag status...' as phase;

SELECT 
    name,
    is_enabled,
    description,
    updated_at
FROM public.feature_flags 
WHERE name = 'weekly_pilates_refill_enabled';

-- ========================================
-- PHASE 2: FIND ULTIMATE USERS
-- ========================================

SELECT 'PHASE 2: Finding Ultimate users...' as phase;

SELECT 
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.start_date as activation_date,
    m.end_date as expiration_date,
    m.is_active
FROM public.user_profiles up
JOIN public.memberships m ON up.user_id = m.user_id
JOIN public.membership_packages mp ON m.package_id = mp.id
WHERE mp.name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
ORDER BY m.start_date DESC
LIMIT 5;

-- ========================================
-- PHASE 3: TEST WEEKLY REFILL STATUS FUNCTION
-- ========================================

SELECT 'PHASE 3: Testing weekly refill status function...' as phase;

-- Test with first Ultimate user found
WITH ultimate_user AS (
    SELECT up.user_id
    FROM public.user_profiles up
    JOIN public.memberships m ON up.user_id = m.user_id
    JOIN public.membership_packages mp ON m.package_id = mp.id
    WHERE mp.name IN ('Ultimate', 'Ultimate Medium')
    AND m.is_active = true
    LIMIT 1
)
SELECT 
    public.get_user_weekly_refill_status(u.user_id)
FROM ultimate_user u;

-- ========================================
-- PHASE 4: CHECK PILATES DEPOSITS
-- ========================================

SELECT 'PHASE 4: Checking Pilates deposits for Ultimate users...' as phase;

SELECT 
    pd.user_id,
    up.first_name,
    up.last_name,
    pd.deposit_remaining,
    pd.credited_at,
    pd.expires_at,
    pd.is_active
FROM public.pilates_deposits pd
JOIN public.user_profiles up ON pd.user_id = up.user_id
JOIN public.memberships m ON pd.user_id = m.user_id
JOIN public.membership_packages mp ON m.package_id = mp.id
WHERE mp.name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
AND pd.is_active = true
ORDER BY pd.credited_at DESC
LIMIT 5;

-- ========================================
-- PHASE 5: SIMULATE WEEKLY REFILL
-- ========================================

SELECT 'PHASE 5: Testing weekly refill process...' as phase;

-- Run the weekly refill process
SELECT public.process_weekly_pilates_refills();

SELECT 'Ultimate weekly display functionality test completed!' as result;
