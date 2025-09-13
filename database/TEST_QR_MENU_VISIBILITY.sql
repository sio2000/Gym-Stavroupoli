-- TEST QR MENU VISIBILITY - Έλεγχος εμφάνισης QR Code menu
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος χρηστών με active memberships
SELECT 'Checking users with active memberships...' as step;

SELECT 
    m.id as membership_id,
    m.user_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.is_active,
    m.approved_at
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.is_active = true
ORDER BY m.created_at DESC;

-- 2. Έλεγχος Free Gym memberships συγκεκριμένα
SELECT 'Checking Free Gym memberships...' as step;

SELECT 
    m.id as membership_id,
    m.user_id,
    up.first_name,
    up.last_name,
    up.email,
    m.start_date,
    m.end_date,
    m.is_active,
    m.approved_at
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.is_active = true 
AND mp.name = 'Free Gym'
ORDER BY m.created_at DESC;

-- 3. Έλεγχος pending requests
SELECT 'Checking pending membership requests...' as step;

SELECT 
    mr.id as request_id,
    mr.user_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    mr.duration_type,
    mr.status,
    mr.created_at
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mr.status = 'pending'
ORDER BY mr.created_at DESC;

-- 4. Έλεγχος approved requests
SELECT 'Checking approved membership requests...' as step;

SELECT 
    mr.id as request_id,
    mr.user_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    mr.duration_type,
    mr.status,
    mr.approved_at
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mr.status = 'approved'
ORDER BY mr.approved_at DESC;

SELECT 'QR Menu visibility test completed!' as final_status;
