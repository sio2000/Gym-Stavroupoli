-- CREATE FREE GYM MEMBERSHIP REQUEST FOR THEODOROS MICHALAKIS
-- Manual insertion of 1-year Free Gym package request (240€)
-- User: zige_5@hotmail.com, THEODOROS MICHALAKIS, 6930952930

-- ========================================
-- PHASE 1: VERIFY USER EXISTS
-- ========================================

SELECT 'PHASE 1: Verifying user exists...' as phase;

-- Find the user by email and details
SELECT 'User verification:' as info;
SELECT 
    user_id,
    first_name,
    last_name,
    email,
    phone,
    role,
    created_at
FROM user_profiles 
WHERE email = 'zige_5@hotmail.com'
   OR (first_name ILIKE '%THEODOR%' AND last_name ILIKE '%MICHALAK%')
   OR phone = '6930952930';

-- Store user_id for later use
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user_id
    SELECT user_id INTO target_user_id
    FROM user_profiles 
    WHERE email = 'zige_5@hotmail.com'
       OR (first_name ILIKE '%THEODOR%' AND last_name ILIKE '%MICHALAK%')
       OR phone = '6930952930'
    LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: THEODOROS MICHALAKIS (zige_5@hotmail.com)';
    ELSE
        RAISE NOTICE 'Found user: % (ID: %)', 'THEODOROS MICHALAKIS', target_user_id;
    END IF;
END $$;

-- ========================================
-- PHASE 2: VERIFY FREE GYM PACKAGE EXISTS
-- ========================================

SELECT 'PHASE 2: Verifying Free Gym package exists...' as phase;

-- Find Free Gym package
SELECT 'Free Gym package verification:' as info;
SELECT 
    id as package_id,
    name,
    description,
    package_type,
    duration_days,
    price,
    is_active
FROM membership_packages 
WHERE name ILIKE '%Free Gym%' 
   OR package_type = 'gym'
   OR description ILIKE '%gym%'
ORDER BY name;

-- Find Free Gym package durations (1 year = 365 days)
SELECT 'Free Gym package durations:' as info;
SELECT 
    mpd.id as duration_id,
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE (mp.name ILIKE '%Free Gym%' OR mp.package_type = 'gym')
  AND mpd.duration_days = 365 -- 1 year
  AND mpd.price = 240.00 -- 240€
ORDER BY mp.name, mpd.duration_days;

-- ========================================
-- PHASE 3: CREATE MEMBERSHIP REQUEST
-- ========================================

SELECT 'PHASE 3: Creating membership request...' as phase;

-- Insert membership request
WITH user_data AS (
    SELECT user_id
    FROM user_profiles 
    WHERE email = 'zige_5@hotmail.com'
       OR (first_name ILIKE '%THEODOR%' AND last_name ILIKE '%MICHALAK%')
       OR phone = '6930952930'
    LIMIT 1
),
package_data AS (
    SELECT 
        mp.id as package_id,
        mpd.id as duration_id,
        mpd.duration_type,
        mpd.price,
        mpd.classes_count
    FROM membership_packages mp
    JOIN membership_package_durations mpd ON mp.id = mpd.package_id
    WHERE (mp.name ILIKE '%Free Gym%' OR mp.package_type = 'gym')
      AND mpd.duration_days = 365 -- 1 year
      AND mpd.price = 240.00 -- 240€
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
    gen_random_uuid() as id,
    ud.user_id,
    pd.package_id,
    pd.duration_type,
    pd.price as requested_price,
    pd.classes_count,
    'pending' as status,
    NOW() as created_at,
    NOW() as updated_at
FROM user_data ud
CROSS JOIN package_data pd
WHERE EXISTS (SELECT 1 FROM user_data)
  AND EXISTS (SELECT 1 FROM package_data);

-- ========================================
-- PHASE 4: VERIFICATION
-- ========================================

SELECT 'PHASE 4: Verifying request creation...' as phase;

-- Verify the request was created
SELECT 'Created membership request:' as info;
SELECT 
    mr.id as request_id,
    up.first_name,
    up.last_name,
    up.email,
    up.phone,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.classes_count,
    mr.status,
    mr.created_at
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE up.email = 'zige_5@hotmail.com'
   OR (up.first_name ILIKE '%THEODOR%' AND up.last_name ILIKE '%MICHALAK%')
   OR up.phone = '6930952930'
ORDER BY mr.created_at DESC
LIMIT 5;

-- ========================================
-- PHASE 5: SUMMARY
-- ========================================

SELECT 'PHASE 5: Request creation summary...' as phase;

-- Summary of what was created
WITH request_summary AS (
    SELECT 
        COUNT(*) as requests_created,
        STRING_AGG(mp.name, ', ') as package_names,
        STRING_AGG(mr.duration_type, ', ') as duration_types,
        STRING_AGG(mr.requested_price::text, ', ') as prices
    FROM membership_requests mr
    JOIN user_profiles up ON mr.user_id = up.user_id
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE (up.email = 'zige_5@hotmail.com'
       OR (up.first_name ILIKE '%THEODOR%' AND up.last_name ILIKE '%MICHALAK%')
       OR up.phone = '6930952930')
    AND mr.created_at > NOW() - INTERVAL '1 minute' -- Just created
)
SELECT 
    'FREE GYM REQUEST CREATION SUMMARY:' as summary_title,
    CASE 
        WHEN requests_created > 0 THEN 
            '✅ SUCCESS: Created ' || requests_created || ' membership request(s)'
        ELSE 
            '❌ ERROR: No requests were created'
    END as result,
    CASE 
        WHEN requests_created > 0 THEN
            'Package: ' || package_names || ' | Duration: ' || duration_types || ' | Price: ' || prices || '€'
        ELSE
            'Please check if user and package exist'
    END as details
FROM request_summary;

SELECT 'FREE GYM MEMBERSHIP REQUEST CREATION COMPLETED!' as completion_status;
