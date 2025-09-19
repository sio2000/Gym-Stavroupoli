-- FIX THEODOROS MICHALAKIS MEMBERSHIP DURATION
-- Update his existing membership from 365 days to 30 days

-- ========================================
-- PHASE 1: CURRENT STATUS CHECK
-- ========================================

SELECT 'PHASE 1: Current status for THEODOROS MICHALAKIS...' as phase;

-- Check current membership status
SELECT 'BEFORE FIX - Current membership:' as info;
SELECT 
    m.id as membership_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as current_duration_days,
    (m.end_date - CURRENT_DATE) as days_remaining_before_fix,
    m.status,
    m.created_at
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND m.status = 'active'
ORDER BY m.created_at DESC;

-- ========================================
-- PHASE 2: APPLY THE FIX
-- ========================================

SELECT 'PHASE 2: Applying 30-day duration fix...' as phase;

-- Update THEODOROS's membership to 30-day duration
UPDATE memberships 
SET 
    end_date = start_date + INTERVAL '30 days',
    updated_at = NOW()
WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND status = 'active'
  AND (end_date - start_date) > 30; -- Only update if current duration > 30 days

-- Log how many records were updated
SELECT 'Fix applied:' as info;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Updated ' || COUNT(*) || ' membership(s) to 30-day duration'
        ELSE '⚠️ No memberships needed updating (already ≤30 days)'
    END as update_result
FROM memberships m
WHERE m.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND m.updated_at > NOW() - INTERVAL '1 minute'; -- Recently updated

-- ========================================
-- PHASE 3: VERIFICATION
-- ========================================

SELECT 'PHASE 3: Verification after fix...' as phase;

-- Check membership after fix
SELECT 'AFTER FIX - Updated membership:' as info;
SELECT 
    m.id as membership_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as new_duration_days,
    (m.end_date - CURRENT_DATE) as days_remaining_after_fix,
    m.status,
    m.updated_at
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND m.status = 'active'
ORDER BY m.created_at DESC;

-- ========================================
-- PHASE 4: VALIDATION
-- ========================================

SELECT 'PHASE 4: Validation of fix...' as phase;

-- Validate the fix worked
WITH validation AS (
    SELECT 
        COUNT(*) as total_active_memberships,
        COUNT(CASE WHEN (m.end_date - CURRENT_DATE) <= 30 THEN 1 END) as memberships_30_days_or_less,
        COUNT(CASE WHEN (m.end_date - CURRENT_DATE) > 30 THEN 1 END) as memberships_more_than_30_days,
        MAX(m.end_date - CURRENT_DATE) as max_days_remaining
    FROM memberships m
    WHERE m.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
      AND m.status = 'active'
)
SELECT 
    'VALIDATION RESULTS:' as validation_title,
    CASE 
        WHEN memberships_more_than_30_days = 0 THEN 
            '✅ SUCCESS: All memberships now have ≤30 days remaining'
        ELSE 
            '❌ ISSUE: ' || memberships_more_than_30_days || ' membership(s) still have >30 days'
    END as result,
    'Total active memberships: ' || total_active_memberships as details,
    'Max days remaining: ' || max_days_remaining as max_duration
FROM validation;

-- ========================================
-- PHASE 5: WHAT USER WILL SEE NOW
-- ========================================

SELECT 'PHASE 5: What user will see now...' as phase;

-- Simulate what the user will see in the app
SELECT 'User interface display simulation:' as info;
SELECT 
    up.first_name || ' ' || up.last_name as user_name,
    mp.name as package_name,
    (m.end_date - CURRENT_DATE) as days_remaining,
    '"' || (m.end_date - CURRENT_DATE) || ' ημέρες ακόμα"' as user_display_message,
    CASE 
        WHEN (m.end_date - CURRENT_DATE) <= 30 THEN '✅ User will see correct duration'
        ELSE '❌ User will still see wrong duration'
    END as fix_status
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND m.status = 'active'
ORDER BY m.created_at DESC;

SELECT 'THEODOROS MICHALAKIS MEMBERSHIP DURATION FIX COMPLETED!' as completion_status;
SELECT 'User should now see ≤30 days remaining instead of 365 days!' as expected_result;
