-- REPLACE THEODOROS FREE GYM REQUEST
-- Delete existing approved request and create new pending request
-- User: THEODOROS MICHALAKIS (zige_5@hotmail.com)

-- ========================================
-- PHASE 1: CHECK CURRENT STATUS
-- ========================================

SELECT 'PHASE 1: Checking THEODOROS current requests...' as phase;

-- Check existing membership requests
SELECT 'BEFORE CHANGES - Current requests:' as info;
SELECT 
    mr.id as request_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.created_at,
    mr.approved_at,
    mr.rejected_at
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba' -- THEODOROS
ORDER BY mr.created_at DESC;

-- Check existing active memberships (should also be deleted)
SELECT 'BEFORE CHANGES - Active memberships:' as info;
SELECT 
    m.id as membership_id,
    up.first_name,
    up.last_name,
    mp.name as package_name,
    m.status,
    m.start_date,
    m.end_date,
    (m.end_date - CURRENT_DATE) as days_remaining
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND m.status = 'active';

-- ========================================
-- PHASE 2: DELETE EXISTING DATA
-- ========================================

SELECT 'PHASE 2: Deleting existing requests and memberships...' as phase;

-- Delete existing membership requests for THEODOROS
DELETE FROM membership_requests 
WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba';

-- Delete existing active memberships for THEODOROS
DELETE FROM memberships 
WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND status = 'active';

-- Log deletion results
SELECT 'Deletion completed:' as info;
SELECT 
    'Deleted membership requests: ' || 
    COALESCE((
        SELECT COUNT(*)::text 
        FROM membership_requests 
        WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba'
    ), '0') as requests_remaining,
    'Deleted active memberships: ' || 
    COALESCE((
        SELECT COUNT(*)::text 
        FROM memberships 
        WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba' 
        AND status = 'active'
    ), '0') as memberships_remaining;

-- ========================================
-- PHASE 3: CREATE NEW FREE GYM REQUEST
-- ========================================

SELECT 'PHASE 3: Creating new Free Gym request...' as phase;

-- Find Free Gym package
WITH free_gym_package AS (
    SELECT 
        mp.id as package_id,
        mpd.id as duration_id,
        mpd.duration_type,
        mpd.price,
        mpd.classes_count
    FROM membership_packages mp
    JOIN membership_package_durations mpd ON mp.id = mpd.package_id
    WHERE mp.name ILIKE '%Free Gym%'
      AND mpd.duration_type = 'year'
      AND mpd.price = 240.00
    LIMIT 1
)
INSERT INTO membership_requests (
    id,
    user_id,
    package_id,
    duration_type,
    requested_price,
    classes_count,
    status,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    '43fa81be-1846-4b64-b136-adca986576ba', -- THEODOROS user_id
    fgp.package_id,
    fgp.duration_type,
    fgp.price,
    fgp.classes_count,
    'pending', -- Status: pending for approval
    NOW(),
    NOW()
FROM free_gym_package fgp;

-- ========================================
-- PHASE 4: VERIFICATION
-- ========================================

SELECT 'PHASE 4: Verifying new request creation...' as phase;

-- Verify new request was created
SELECT 'AFTER CHANGES - New request:' as info;
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
ORDER BY mr.created_at DESC;

-- Verify no active memberships exist
SELECT 'AFTER CHANGES - Active memberships (should be empty):' as info;
SELECT 
    COUNT(*) as active_memberships_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No active memberships'
        ELSE '❌ ERROR: ' || COUNT(*) || ' active memberships still exist'
    END as verification_result
FROM memberships 
WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND status = 'active';

-- ========================================
-- PHASE 5: FINAL STATUS SUMMARY
-- ========================================

SELECT 'PHASE 5: Final status summary...' as phase;

-- Final summary for THEODOROS
WITH final_summary AS (
    SELECT 
        up.first_name,
        up.last_name,
        up.email,
        COUNT(DISTINCT CASE WHEN mr.status = 'pending' THEN mr.id END) as pending_requests,
        COUNT(DISTINCT CASE WHEN mr.status = 'approved' THEN mr.id END) as approved_requests,
        COUNT(DISTINCT CASE WHEN m.status = 'active' THEN m.id END) as active_memberships,
        STRING_AGG(DISTINCT mp.name, ', ') as requested_packages
    FROM user_profiles up
    LEFT JOIN membership_requests mr ON up.user_id = mr.user_id
    LEFT JOIN membership_packages mp ON mr.package_id = mp.id
    LEFT JOIN memberships m ON up.user_id = m.user_id
    WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
    GROUP BY up.user_id, up.first_name, up.last_name, up.email
)
SELECT 
    'FINAL STATUS FOR ' || first_name || ' ' || last_name || ':' as user_status,
    'Email: ' || email as contact,
    'Pending Requests: ' || pending_requests || ' (should be 1)' as pending_status,
    'Approved Requests: ' || approved_requests || ' (should be 0)' as approved_status,
    'Active Memberships: ' || active_memberships || ' (should be 0)' as membership_status,
    'Requested Packages: ' || COALESCE(requested_packages, 'None') as packages,
    CASE 
        WHEN pending_requests = 1 AND approved_requests = 0 AND active_memberships = 0 THEN
            '✅ SUCCESS: Clean state with 1 pending Free Gym request'
        ELSE
            '❌ ISSUE: Status not as expected'
    END as overall_status
FROM final_summary;

SELECT 'THEODOROS FREE GYM REQUEST REPLACEMENT COMPLETED!' as completion_status;
SELECT 'User now has clean pending request for Free Gym (1 year, 240€)' as result;
SELECT 'Admin can approve this request when ready' as next_step;
