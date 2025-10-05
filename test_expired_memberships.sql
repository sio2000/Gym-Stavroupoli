-- Test script για ληγμένες συνδρομές
-- 1. Δες όλες τις ενεργές συνδρομές
SELECT '=== ALL ACTIVE MEMBERSHIPS ===' as info;
SELECT 
    user_id, 
    package_id, 
    start_date, 
    end_date, 
    is_active, 
    status,
    CASE 
        WHEN end_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN end_date = CURRENT_DATE THEN 'EXPIRES_TODAY'
        ELSE 'ACTIVE'
    END as membership_status
FROM memberships 
WHERE is_active = true 
ORDER BY end_date DESC 
LIMIT 20;

-- 2. Δες μόνο τις ληγμένες συνδρομές
SELECT '=== EXPIRED MEMBERSHIPS ===' as info;
SELECT 
    user_id, 
    package_id, 
    start_date, 
    end_date, 
    is_active, 
    status,
    CURRENT_DATE - end_date as days_expired
FROM memberships 
WHERE is_active = true 
    AND end_date < CURRENT_DATE 
ORDER BY end_date DESC;

-- 3. Δες συνδρομές που λήγουν σήμερα
SELECT '=== EXPIRING TODAY ===' as info;
SELECT 
    user_id, 
    package_id, 
    start_date, 
    end_date, 
    is_active, 
    status
FROM memberships 
WHERE is_active = true 
    AND end_date = CURRENT_DATE;

-- 4. Δες ενεργές συνδρομές (που δεν έχουν λήξει)
SELECT '=== ACTIVE MEMBERSHIPS (NOT EXPIRED) ===' as info;
SELECT 
    user_id, 
    package_id, 
    start_date, 
    end_date, 
    is_active, 
    status,
    end_date - CURRENT_DATE as days_remaining
FROM memberships 
WHERE is_active = true 
    AND end_date > CURRENT_DATE 
ORDER BY end_date ASC;
