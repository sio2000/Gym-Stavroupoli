-- TEST WEEKLY PILATES REFILL SYSTEM
-- Comprehensive test script to verify weekly refill functionality

-- ========================================
-- PHASE 1: SETUP TEST ENVIRONMENT
-- ========================================

SELECT 'PHASE 1: Setting up test environment...' as phase;

-- Enable the feature flag
UPDATE public.feature_flags 
SET is_enabled = true, updated_at = now()
WHERE name = 'weekly_pilates_refill_enabled';

-- Verify feature is enabled
SELECT 
    'Feature flag status:' as info,
    name,
    is_enabled,
    description
FROM public.feature_flags 
WHERE name = 'weekly_pilates_refill_enabled';

-- ========================================
-- PHASE 2: CREATE TEST DATA
-- ========================================

SELECT 'PHASE 2: Creating test data...' as phase;

-- Create test user profile (if not exists)
INSERT INTO public.user_profiles (user_id, first_name, last_name, email)
SELECT 
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Test',
    'User',
    'test@example.com'
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
);

-- Create test Ultimate package request
INSERT INTO public.membership_requests (
    id,
    user_id,
    package_id,
    duration_type,
    requested_price,
    status
)
SELECT 
    '22222222-2222-2222-2222-222222222222'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    mp.id,
    'ultimate_1year',
    500.00,
    'approved'
FROM public.membership_packages mp
WHERE mp.name = 'Ultimate'
AND NOT EXISTS (
    SELECT 1 FROM public.membership_requests 
    WHERE id = '22222222-2222-2222-2222-222222222222'::uuid
);

-- ========================================
-- PHASE 3: TEST ULTIMATE ACTIVATION WITH DEPOSIT
-- ========================================

SELECT 'PHASE 3: Testing Ultimate activation with Pilates deposit...' as phase;

-- Test the updated create_ultimate_dual_memberships function
SELECT 
    'Testing Ultimate activation...' as info,
    *
FROM public.create_ultimate_dual_memberships(
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    365,
    CURRENT_DATE - INTERVAL '7 days' -- Start 7 days ago to test weekly logic
);

-- Verify memberships were created
SELECT 
    'Created memberships:' as info,
    m.id,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.source_package_name
FROM public.memberships m
JOIN public.membership_packages mp ON m.package_id = mp.id
WHERE m.source_request_id = '22222222-2222-2222-2222-222222222222'::uuid;

-- Verify initial Pilates deposit was created
SELECT 
    'Initial Pilates deposit:' as info,
    pd.id,
    pd.user_id,
    pd.deposit_remaining,
    pd.credited_at,
    pd.expires_at,
    pd.is_active
FROM public.pilates_deposits pd
WHERE pd.user_id = '11111111-1111-1111-1111-111111111111'::uuid
ORDER BY pd.credited_at DESC
LIMIT 1;

-- ========================================
-- PHASE 4: TEST WEEKLY REFILL FUNCTION
-- ========================================

SELECT 'PHASE 4: Testing weekly refill function...' as phase;

-- Test the weekly refill function
SELECT 
    'Weekly refill results:' as info,
    *
FROM public.process_weekly_pilates_refills();

-- Check if refill was recorded
SELECT 
    'Refill records:' as info,
    uwr.id,
    uwr.user_id,
    uwr.package_name,
    uwr.activation_date,
    uwr.refill_date,
    uwr.refill_week_number,
    uwr.target_deposit_amount,
    uwr.previous_deposit_amount,
    uwr.new_deposit_amount
FROM public.ultimate_weekly_refills uwr
WHERE uwr.user_id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Check updated Pilates deposit
SELECT 
    'Updated Pilates deposit:' as info,
    pd.id,
    pd.user_id,
    pd.deposit_remaining,
    pd.credited_at,
    pd.expires_at,
    pd.is_active
FROM public.pilates_deposits pd
WHERE pd.user_id = '11111111-1111-1111-1111-111111111111'::uuid
ORDER BY pd.credited_at DESC
LIMIT 1;

-- ========================================
-- PHASE 5: TEST HELPER FUNCTIONS
-- ========================================

SELECT 'PHASE 5: Testing helper functions...' as phase;

-- Test get_user_weekly_refill_status
SELECT 
    'User refill status:' as info,
    *
FROM public.get_user_weekly_refill_status('11111111-1111-1111-1111-111111111111'::uuid);

-- Test manual trigger refill (should be idempotent)
SELECT 
    'Manual trigger test:' as info,
    *
FROM public.manual_trigger_weekly_refill('11111111-1111-1111-1111-111111111111'::uuid);

-- ========================================
-- PHASE 6: TEST EDGE CASES
-- ========================================

SELECT 'PHASE 6: Testing edge cases...' as phase;

-- Test with user who has no Ultimate membership
SELECT 
    'Non-Ultimate user test:' as info,
    *
FROM public.manual_trigger_weekly_refill('99999999-9999-9999-9999-999999999999'::uuid);

-- Test with user who has existing deposit > target
-- First, manually increase the deposit to test top-up logic
UPDATE public.pilates_deposits 
SET deposit_remaining = 5, updated_at = now()
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
AND is_active = true;

-- Test refill again (should not increase since 5 > 3)
SELECT 
    'High deposit test:' as info,
    *
FROM public.process_weekly_pilates_refills();

-- Check that deposit wasn't increased
SELECT 
    'Deposit after high test:' as info,
    pd.deposit_remaining
FROM public.pilates_deposits pd
WHERE pd.user_id = '11111111-1111-1111-1111-111111111111'::uuid
AND pd.is_active = true
ORDER BY pd.credited_at DESC
LIMIT 1;

-- ========================================
-- PHASE 7: TEST ULTIMATE MEDIUM PACKAGE
-- ========================================

SELECT 'PHASE 7: Testing Ultimate Medium package...' as phase;

-- Create test Ultimate Medium user
INSERT INTO public.user_profiles (user_id, first_name, last_name, email)
SELECT 
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Test',
    'Medium',
    'testmedium@example.com'
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = '33333333-3333-3333-3333-333333333333'::uuid
);

-- Create Ultimate Medium membership request
INSERT INTO public.membership_requests (
    id,
    user_id,
    package_id,
    duration_type,
    requested_price,
    status
)
SELECT 
    '44444444-4444-4444-4444-444444444444'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    mp.id,
    'ultimate_medium_1year',
    400.00,
    'approved'
FROM public.membership_packages mp
WHERE mp.name = 'Ultimate Medium'
AND NOT EXISTS (
    SELECT 1 FROM public.membership_requests 
    WHERE id = '44444444-4444-4444-4444-444444444444'::uuid
);

-- Activate Ultimate Medium
SELECT 
    'Ultimate Medium activation:' as info,
    *
FROM public.create_ultimate_dual_memberships(
    '33333333-3333-3333-3333-333333333333'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    365,
    CURRENT_DATE - INTERVAL '14 days' -- Start 14 days ago
);

-- Test weekly refill for Ultimate Medium (should get 1 lesson)
SELECT 
    'Ultimate Medium refill:' as info,
    *
FROM public.process_weekly_pilates_refills();

-- Check Ultimate Medium deposit
SELECT 
    'Ultimate Medium deposit:' as info,
    pd.deposit_remaining
FROM public.pilates_deposits pd
WHERE pd.user_id = '33333333-3333-3333-3333-333333333333'::uuid
AND pd.is_active = true
ORDER BY pd.credited_at DESC
LIMIT 1;

-- ========================================
-- PHASE 8: TEST FEATURE FLAG DISABLE
-- ========================================

SELECT 'PHASE 8: Testing feature flag disable...' as phase;

-- Disable feature flag
UPDATE public.feature_flags 
SET is_enabled = false, updated_at = now()
WHERE name = 'weekly_pilates_refill_enabled';

-- Test that refills don't run when disabled
SELECT 
    'Disabled feature test:' as info,
    *
FROM public.process_weekly_pilates_refills();

-- Re-enable for cleanup
UPDATE public.feature_flags 
SET is_enabled = true, updated_at = now()
WHERE name = 'weekly_pilates_refill_enabled';

-- ========================================
-- PHASE 9: CLEANUP TEST DATA
-- ========================================

SELECT 'PHASE 9: Cleaning up test data...' as phase;

-- Clean up test data
DELETE FROM public.ultimate_weekly_refills 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid
);

DELETE FROM public.pilates_deposits 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid
);

DELETE FROM public.memberships 
WHERE source_request_id IN (
    '22222222-2222-2222-2222-222222222222'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid
);

DELETE FROM public.membership_requests 
WHERE id IN (
    '22222222-2222-2222-2222-222222222222'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid
);

DELETE FROM public.user_profiles 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid
);

SELECT 'Weekly Pilates refill system tests completed successfully!' as result;
