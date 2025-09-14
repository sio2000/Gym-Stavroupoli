-- CHECK FREE GYM PACKAGE - Έλεγχος αν υπάρχει το Free Gym package
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος packages στη βάση
SELECT 'Checking membership packages...' as step;

SELECT 
    id,
    name,
    description,
    is_active,
    created_at
FROM membership_packages 
ORDER BY name;

-- 2. Έλεγχος Free Gym package συγκεκριμένα
SELECT 'Checking Free Gym package...' as step;

SELECT 
    id,
    name,
    description,
    is_active,
    created_at
FROM membership_packages 
WHERE name = 'Free Gym';

-- 3. Έλεγχος duration options για Free Gym
SELECT 'Checking Free Gym duration options...' as step;

SELECT 
    mpd.id,
    mpd.package_id,
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym'
ORDER BY mpd.duration_days;

-- 4. Έλεγχος αν υπάρχουν requests για Free Gym
SELECT 'Checking Free Gym requests...' as step;

SELECT 
    mr.id,
    mr.user_id,
    up.first_name,
    up.last_name,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.created_at
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
JOIN user_profiles up ON mr.user_id = up.user_id
WHERE mp.name = 'Free Gym'
ORDER BY mr.created_at DESC;

-- 5. Έλεγχος αν υπάρχουν active memberships για Free Gym
SELECT 'Checking Free Gym active memberships...' as step;

SELECT 
    m.id,
    m.user_id,
    up.first_name,
    up.last_name,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.is_active,
    m.created_at
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
JOIN user_profiles up ON m.user_id = up.user_id
WHERE mp.name = 'Free Gym'
ORDER BY m.created_at DESC;
