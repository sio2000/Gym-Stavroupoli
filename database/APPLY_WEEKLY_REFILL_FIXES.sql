-- APPLY WEEKLY REFILL FIXES
-- This script applies the fixes for the weekly refill function

-- ========================================
-- PHASE 1: DROP AND RECREATE FUNCTION WITH FIXES
-- ========================================

SELECT 'PHASE 1: Applying fixes to get_user_weekly_refill_status function...' as phase;

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.get_user_weekly_refill_status(UUID);

-- Create the corrected function with proper next_refill_date calculation
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
        -- Fix: Calculate next Monday for refill
        (CURRENT_DATE + INTERVAL '1 day' * ((8 - EXTRACT(DOW FROM CURRENT_DATE)::integer) % 7))::date as next_refill_date,
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
-- PHASE 3: TEST FUNCTION WITH SAMPLE DATA
-- ========================================

SELECT 'PHASE 3: Testing function with sample data...' as phase;

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

SELECT 'Weekly refill fixes applied successfully!' as result;
