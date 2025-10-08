-- ENABLE WEEKLY REFILL FEATURE
-- This script enables the weekly Pilates refill feature for Ultimate users

-- ========================================
-- PHASE 1: ENABLE FEATURE FLAG
-- ========================================

SELECT 'PHASE 1: Enabling weekly Pilates refill feature...' as phase;

UPDATE public.feature_flags 
SET is_enabled = true, updated_at = now()
WHERE name = 'weekly_pilates_refill_enabled';

-- ========================================
-- PHASE 2: VERIFY FEATURE IS ENABLED
-- ========================================

SELECT 'PHASE 2: Verifying feature is enabled...' as phase;

SELECT 
    name,
    is_enabled,
    description,
    updated_at
FROM public.feature_flags 
WHERE name = 'weekly_pilates_refill_enabled';

-- ========================================
-- PHASE 3: TEST WEEKLY REFILL FUNCTION
-- ========================================

SELECT 'PHASE 3: Testing weekly refill function...' as phase;

-- Test the function (it should run without errors)
SELECT public.process_weekly_pilates_refills();

SELECT 'Weekly refill feature enabled successfully!' as result;
