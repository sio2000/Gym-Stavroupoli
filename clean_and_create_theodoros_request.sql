-- CLEAN AND CREATE NEW THEODOROS FREE GYM REQUEST
-- Simple script to clean up and create fresh request

-- Step 1: Delete existing data for THEODOROS
SELECT 'Cleaning up existing data for THEODOROS MICHALAKIS...' as step1;

-- Delete membership requests
DELETE FROM membership_requests 
WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba';

-- Delete active memberships  
DELETE FROM memberships 
WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND status = 'active';

-- Step 2: Create new Free Gym request
SELECT 'Creating new Free Gym request...' as step2;

-- Insert new pending Free Gym request
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
) VALUES (
    gen_random_uuid(),
    '43fa81be-1846-4b64-b136-adca986576ba', -- THEODOROS user_id
    (SELECT id FROM membership_packages WHERE name ILIKE '%Free Gym%' LIMIT 1), -- Free Gym package
    'year', -- 1 year duration
    240.00, -- 240€ price
    NULL, -- No classes for gym
    'pending', -- Pending status for approval
    NOW(),
    NOW()
);

-- Step 3: Verify the result
SELECT 'Verification - New request created:' as step3;
SELECT 
    mr.id,
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

-- Step 4: Confirm clean state
SELECT 'Verification - Clean state:' as step4;
SELECT 
    'Active Memberships: ' || COUNT(DISTINCT m.id) as memberships,
    'Pending Requests: ' || COUNT(DISTINCT mr.id) as requests
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.status = 'active'
LEFT JOIN membership_requests mr ON up.user_id = mr.user_id AND mr.status = 'pending'
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba';

SELECT '✅ THEODOROS NOW HAS CLEAN PENDING FREE GYM REQUEST!' as success;
