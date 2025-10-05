-- Script για να αφαιρέσει τις ληγμένες συνδρομές από το UI
-- Αυτό θα κάνει τις ληγμένες συνδρομές inactive

-- 1. Πρώτα δες πόσες συνδρομές θα επηρεαστούν
SELECT '=== MEMBERSHIPS TO BE DEACTIVATED ===' as info;
SELECT 
    COUNT(*) as total_expired,
    COUNT(DISTINCT user_id) as affected_users
FROM memberships 
WHERE is_active = true 
    AND end_date < CURRENT_DATE;

-- 2. Δες λεπτομέρειες των συνδρομών που θα επηρεαστούν
SELECT '=== DETAILS OF EXPIRED MEMBERSHIPS ===' as info;
SELECT 
    m.user_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    CURRENT_DATE - m.end_date as days_expired
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.is_active = true 
    AND m.end_date < CURRENT_DATE 
ORDER BY m.end_date DESC;

-- 3. Ενημέρωσε τις ληγμένες συνδρομές (UNCOMMENT για να εκτελεστεί)
/*
UPDATE memberships 
SET is_active = false, 
    status = 'expired',
    updated_at = NOW()
WHERE is_active = true 
    AND end_date < CURRENT_DATE;
*/

-- 4. Επαλήθευση - δες τις συνδρομές που θα παραμείνουν ενεργές
SELECT '=== REMAINING ACTIVE MEMBERSHIPS ===' as info;
SELECT 
    COUNT(*) as total_active,
    COUNT(DISTINCT user_id) as active_users
FROM memberships 
WHERE is_active = true 
    AND end_date >= CURRENT_DATE;
