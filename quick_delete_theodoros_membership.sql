-- QUICK DELETE THEODOROS ACTIVE MEMBERSHIP
-- Simple and direct deletion

-- Check what will be deleted
SELECT 'WHAT WILL BE DELETED:' as info;
SELECT 
    m.id,
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

-- DELETE ACTIVE MEMBERSHIPS
DELETE FROM memberships 
WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND status = 'active';

-- Verify deletion
SELECT 'AFTER DELETION:' as info;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No active memberships remain'
        ELSE '❌ ERROR: ' || COUNT(*) || ' active memberships still exist'
    END as result
FROM memberships 
WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND status = 'active';

-- Check pending requests remain
SELECT 'PENDING REQUESTS (should remain):' as info;
SELECT 
    mr.id,
    mp.name,
    mr.status,
    mr.created_at
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mr.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND mr.status = 'pending'
ORDER BY mr.created_at DESC;
