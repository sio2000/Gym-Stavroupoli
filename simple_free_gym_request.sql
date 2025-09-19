-- SIMPLE FREE GYM REQUEST FOR THEODOROS MICHALAKIS
-- Direct insertion of membership request

-- Step 1: Find user ID
SELECT 'Finding user THEODOROS MICHALAKIS...' as step;
SELECT user_id, first_name, last_name, email FROM user_profiles 
WHERE email = 'zige_5@hotmail.com';

-- Step 2: Find Free Gym package and duration
SELECT 'Finding Free Gym package...' as step;
SELECT 
    mp.id as package_id,
    mp.name,
    mpd.id as duration_id,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price
FROM membership_packages mp
JOIN membership_package_durations mpd ON mp.id = mpd.package_id
WHERE mp.name ILIKE '%Free Gym%'
  AND mpd.duration_days = 365
  AND mpd.price = 240.00;

-- Step 3: Manual insertion (replace the IDs with actual values from above)
SELECT 'Creating membership request...' as step;

-- INSERT THE REQUEST (update the IDs based on results above)
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
    '43fa81be-1846-4b64-b136-adca986576ba', -- THEODOROS MICHALAKIS user_id
    (SELECT id FROM membership_packages WHERE name ILIKE '%Free Gym%' LIMIT 1), -- Free Gym package_id
    'year', -- Duration type for 1 year
    240.00, -- Price 240€
    NULL, -- No classes for gym membership
    'pending', -- Status
    NOW(), -- Created at
    NOW() -- Updated at
);

-- Step 4: Verify creation
SELECT 'Verifying request creation...' as step;
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
ORDER BY mr.created_at DESC
LIMIT 1;
