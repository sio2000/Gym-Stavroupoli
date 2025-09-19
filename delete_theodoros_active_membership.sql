-- DELETE THEODOROS MICHALAKIS ACTIVE MEMBERSHIP
-- Remove any active memberships for this user, keep only pending requests

-- ========================================
-- PHASE 1: CHECK CURRENT STATUS
-- ========================================

SELECT 'PHASE 1: Checking THEODOROS MICHALAKIS current status...' as phase;

-- Check current active memberships
SELECT 'BEFORE DELETION - Active memberships:' as info;
SELECT 
    m.id as membership_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.status,
    m.start_date,
    m.end_date,
    (m.end_date - CURRENT_DATE) as days_remaining,
    m.created_at
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba' -- THEODOROS
  AND m.status = 'active'
ORDER BY m.created_at DESC;

-- Check pending membership requests (these should remain)
SELECT 'BEFORE DELETION - Pending requests (will keep):' as info;
SELECT 
    mr.id as request_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.created_at
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba' -- THEODOROS
  AND mr.status = 'pending'
ORDER BY mr.created_at DESC;

-- ========================================
-- PHASE 2: DELETE ACTIVE MEMBERSHIPS
-- ========================================

SELECT 'PHASE 2: Deleting active memberships...' as phase;

-- Delete all active memberships for THEODOROS
DELETE FROM memberships 
WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba' -- THEODOROS
  AND status = 'active';

-- Log deletion result
SELECT 'Deletion completed:' as info;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: All active memberships deleted'
        ELSE '❌ ERROR: ' || COUNT(*) || ' active memberships still exist'
    END as deletion_result
FROM memberships 
WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND status = 'active';

-- ========================================
-- PHASE 3: VERIFICATION
-- ========================================

SELECT 'PHASE 3: Verification after deletion...' as phase;

-- Verify no active memberships remain
SELECT 'AFTER DELETION - Active memberships (should be empty):' as info;
SELECT 
    m.id,
    up.first_name,
    up.last_name,
    mp.name,
    m.status,
    m.start_date,
    m.end_date
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND m.status = 'active';

-- Verify pending requests still exist
SELECT 'AFTER DELETION - Pending requests (should remain):' as info;
SELECT 
    mr.id as request_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.created_at
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND mr.status = 'pending'
ORDER BY mr.created_at DESC;

-- ========================================
-- PHASE 4: CLEAN UP RELATED DATA (OPTIONAL)
-- ========================================

SELECT 'PHASE 4: Cleaning up related data...' as phase;

-- Check if there are any personal training schedules that should be cleaned up
SELECT 'Personal training schedules to review:' as info;
SELECT 
    pts.id,
    up.first_name,
    up.last_name,
    pts.training_type,
    pts.user_type,
    pts.status,
    pts.month,
    pts.year,
    pts.created_at
FROM personal_training_schedules pts
JOIN user_profiles up ON pts.user_id = up.user_id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
ORDER BY pts.created_at DESC;

-- Note: We're not automatically deleting schedules as they might be needed for reference
-- Admin can manually delete them if needed

-- ========================================
-- PHASE 5: FINAL STATUS
-- ========================================

SELECT 'PHASE 5: Final status summary...' as phase;

-- Final summary
WITH final_status AS (
    SELECT 
        COUNT(DISTINCT CASE WHEN m.status = 'active' THEN m.id END) as active_memberships,
        COUNT(DISTINCT CASE WHEN mr.status = 'pending' THEN mr.id END) as pending_requests,
        COUNT(DISTINCT pts.id) as training_schedules
    FROM user_profiles up
    LEFT JOIN memberships m ON up.user_id = m.user_id
    LEFT JOIN membership_requests mr ON up.user_id = mr.user_id
    LEFT JOIN personal_training_schedules pts ON up.user_id = pts.user_id
    WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
)
SELECT 
    'FINAL STATUS FOR THEODOROS MICHALAKIS:' as status_title,
    'Active Memberships: ' || active_memberships || ' (should be 0)' as memberships_status,
    'Pending Requests: ' || pending_requests || ' (should be ≥1)' as requests_status,
    'Training Schedules: ' || training_schedules || ' (for reference)' as schedules_status,
    CASE 
        WHEN active_memberships = 0 AND pending_requests > 0 THEN 
            '✅ SUCCESS: No active memberships, has pending requests for approval'
        WHEN active_memberships = 0 AND pending_requests = 0 THEN
            '⚠️ WARNING: No active memberships and no pending requests'
        ELSE 
            '❌ ERROR: Still has active memberships'
    END as overall_status
FROM final_status;

SELECT 'THEODOROS MEMBERSHIP DELETION COMPLETED!' as completion_status;
