-- FIX WEEKLY REFILL FUNCTION
-- This script fixes the EXTRACT error in get_user_weekly_refill_status function

-- ========================================
-- PHASE 1: DROP AND RECREATE FUNCTION
-- ========================================

SELECT 'PHASE 1: Fixing get_user_weekly_refill_status function...' as phase;

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.get_user_weekly_refill_status(UUID);

-- Create the corrected function
CREATE OR REPLACE FUNCTION public.get_user_weekly_refill_status(p_user_id uuid)
RETURNS TABLE(
    user_id uuid,
    package_name text,
    activation_date date,
    next_refill_date date,
    next_refill_week integer,
    current_deposit_amount integer,
    target_deposit_amount integer,
    is_refill_due boolean,
    current_week_start date,
    current_week_end date
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.user_id,
        mp.name as package_name,
        m.start_date as activation_date,
        (m.start_date + INTERVAL '1 day' * (7 * CEIL((CURRENT_DATE - m.start_date)::integer / 7.0 + 1)))::date as next_refill_date,
        CEIL((CURRENT_DATE - m.start_date)::integer / 7.0)::integer as next_refill_week,
        COALESCE(pd.deposit_remaining, 0) as current_deposit_amount,
        CASE 
            WHEN mp.name = 'Ultimate' THEN 3
            WHEN mp.name = 'Ultimate Medium' THEN 1
            ELSE 0
        END as target_deposit_amount,
        ((CURRENT_DATE - m.start_date)::integer % 7 = 0) as is_refill_due,
        -- Current week start (Monday of current week)
        (CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::integer - 1 + 7) % 7)::date as current_week_start,
        -- Current week end (Sunday of current week)
        (CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::integer - 1 + 7) % 7 + 6)::date as current_week_end
    FROM public.memberships m
    JOIN public.membership_packages mp ON m.package_id = mp.id
    LEFT JOIN public.get_active_pilates_deposit(m.user_id) pd ON true
    WHERE m.user_id = p_user_id
    AND m.source_package_name IN ('Ultimate', 'Ultimate Medium')
    AND m.is_active = true
    AND m.start_date <= CURRENT_DATE
    AND m.end_date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- PHASE 2: GRANT PERMISSIONS
-- ========================================

SELECT 'PHASE 2: Granting permissions...' as phase;

GRANT EXECUTE ON FUNCTION public.get_user_weekly_refill_status(UUID) TO authenticated;

-- ========================================
-- PHASE 3: TEST FUNCTION
-- ========================================

SELECT 'PHASE 3: Testing function...' as phase;

-- Test the function with a sample user
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
    public.get_user_weekly_refill_status(u.user_id)
FROM test_user u;

SELECT 'Weekly refill function fixed successfully!' as result;
