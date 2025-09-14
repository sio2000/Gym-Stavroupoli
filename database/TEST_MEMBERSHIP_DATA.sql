-- TEST MEMBERSHIP DATA - Έλεγχος δεδομένων συνδρομών
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος αν υπάρχουν πακέτα συνδρομών
SELECT 'Checking membership_packages table...' as message;

SELECT 
    id,
    name,
    description,
    package_type,
    is_active,
    created_at
FROM membership_packages
ORDER BY created_at DESC;

-- 2. Έλεγχος αν υπάρχουν duration options
SELECT 'Checking membership_package_durations table...' as message;

SELECT 
    mpd.id,
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
ORDER BY mp.name, mpd.duration_days;

-- 3. Έλεγχος αν υπάρχουν αιτήματα συνδρομών
SELECT 'Checking membership_requests table...' as message;

SELECT 
    mr.id,
    up.first_name,
    up.last_name,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.created_at
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
ORDER BY mr.created_at DESC;

-- 4. Έλεγχος RLS policies
SELECT 'Checking RLS policies...' as message;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('membership_packages', 'membership_package_durations', 'membership_requests')
ORDER BY tablename, policyname;

-- 5. Έλεγχος αν ο πίνακας membership_packages έχει δεδομένα
SELECT 'Count of membership_packages:' as message, COUNT(*) as count FROM membership_packages;

-- 6. Έλεγχος αν ο πίνακας membership_package_durations έχει δεδομένα  
SELECT 'Count of membership_package_durations:' as message, COUNT(*) as count FROM membership_package_durations;

-- 7. Έλεγχος αν ο πίνακας membership_requests έχει δεδομένα
SELECT 'Count of membership_requests:' as message, COUNT(*) as count FROM membership_requests;
