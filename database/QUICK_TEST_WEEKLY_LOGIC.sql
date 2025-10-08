-- QUICK TEST WEEKLY LOGIC
-- This script tests the weekly logic calculations

-- ========================================
-- PHASE 1: TEST CURRENT DATE LOGIC
-- ========================================

SELECT 'PHASE 1: Testing current date logic...' as phase;

SELECT 
    CURRENT_DATE as today,
    EXTRACT(DOW FROM CURRENT_DATE) as day_of_week,
    -- Calculate next Monday
    (CURRENT_DATE + INTERVAL '1 day' * ((8 - EXTRACT(DOW FROM CURRENT_DATE)::integer) % 7))::date as next_monday,
    -- Calculate current week start (Monday)
    (CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::integer - 1 + 7) % 7)::date as current_week_start,
    -- Calculate current week end (Sunday)
    (CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::integer - 1 + 7) % 7 + 6)::date as current_week_end;

-- ========================================
-- PHASE 2: TEST ULTIMATE USER DATA
-- ========================================

SELECT 'PHASE 2: Testing Ultimate user data...' as phase;

SELECT 
    up.user_id,
    up.first_name,
    up.last_name,
    mp.name as package_name,
    m.start_date as activation_date,
    m.end_date as expiration_date,
    pd.deposit_remaining,
    pd.credited_at,
    pd.expires_at
FROM public.user_profiles up
JOIN public.memberships m ON up.user_id = m.user_id
JOIN public.membership_packages mp ON m.package_id = mp.id
LEFT JOIN public.get_active_pilates_deposit(up.user_id) pd ON true
WHERE mp.name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
ORDER BY m.start_date DESC
LIMIT 3;

-- ========================================
-- PHASE 3: TEST WEEKLY REFILL STATUS
-- ========================================

SELECT 'PHASE 3: Testing weekly refill status...' as phase;

-- Test with first Ultimate user
WITH test_user AS (
    SELECT up.user_id
    FROM public.user_profiles up
    JOIN public.memberships m ON up.user_id = m.user_id
    JOIN public.membership_packages mp ON m.package_id = mp.id
    WHERE mp.name IN ('Ultimate', 'Ultimate Medium')
    AND m.is_active = true
    LIMIT 1
)
SELECT 
    user_id,
    package_name,
    activation_date,
    next_refill_date,
    next_refill_week,
    current_deposit_amount,
    target_deposit_amount,
    current_week_start,
    current_week_end
FROM public.get_user_weekly_refill_status((SELECT user_id FROM test_user));

SELECT 'Weekly logic test completed!' as result;
