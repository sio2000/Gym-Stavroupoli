-- Script για να δημιουργήσω test data με ληγμένες συνδρομές
-- Αυτό θα μας βοηθήσει να δοκιμάσουμε τη λογική

-- 1. Βρες έναν υπαρχόντα χρήστη για τεστ
SELECT '=== FIND TEST USER ===' as info;
SELECT user_id, first_name, last_name, email 
FROM user_profiles 
LIMIT 1;

-- 2. Βρες υπαρχόντα packages για τεστ
SELECT '=== FIND TEST PACKAGES ===' as info;
SELECT id, name, description 
FROM membership_packages 
WHERE is_active = true 
LIMIT 3;

-- 3. Δημιούργησε test συνδρομές με διάφορες ημερομηνίες λήξης
-- (UNCOMMENT για να εκτελεστεί)

/*
-- Συνδρομή που έληξε χθες
INSERT INTO memberships (
    user_id, 
    package_id, 
    start_date, 
    end_date, 
    is_active, 
    status,
    created_at,
    updated_at
) VALUES (
    (SELECT user_id FROM user_profiles LIMIT 1), -- Χρήστης
    (SELECT id FROM membership_packages WHERE name = 'Free Gym' LIMIT 1), -- Package
    CURRENT_DATE - INTERVAL '30 days', -- Έναρξη 30 μέρες πριν
    CURRENT_DATE - INTERVAL '1 day', -- Λήξη χθες
    true, -- Ενεργή (αλλά ληγμένη)
    'active',
    NOW(),
    NOW()
);

-- Συνδρομή που έληξε πριν από 7 μέρες
INSERT INTO memberships (
    user_id, 
    package_id, 
    start_date, 
    end_date, 
    is_active, 
    status,
    created_at,
    updated_at
) VALUES (
    (SELECT user_id FROM user_profiles LIMIT 1), -- Χρήστης
    (SELECT id FROM membership_packages WHERE name = 'Pilates' LIMIT 1), -- Package
    CURRENT_DATE - INTERVAL '35 days', -- Έναρξη 35 μέρες πριν
    CURRENT_DATE - INTERVAL '7 days', -- Λήξη πριν από 7 μέρες
    true, -- Ενεργή (αλλά ληγμένη)
    'active',
    NOW(),
    NOW()
);

-- Συνδρομή που λήγει σήμερα
INSERT INTO memberships (
    user_id, 
    package_id, 
    start_date, 
    end_date, 
    is_active, 
    status,
    created_at,
    updated_at
) VALUES (
    (SELECT user_id FROM user_profiles LIMIT 1), -- Χρήστης
    (SELECT id FROM membership_packages WHERE name = 'Ultimate' LIMIT 1), -- Package
    CURRENT_DATE - INTERVAL '90 days', -- Έναρξη 90 μέρες πριν
    CURRENT_DATE, -- Λήξη σήμερα
    true, -- Ενεργή
    'active',
    NOW(),
    NOW()
);

-- Συνδρομή που είναι ενεργή για 10 μέρες ακόμα
INSERT INTO memberships (
    user_id, 
    package_id, 
    start_date, 
    end_date, 
    is_active, 
    status,
    created_at,
    updated_at
) VALUES (
    (SELECT user_id FROM user_profiles LIMIT 1), -- Χρήστης
    (SELECT id FROM membership_packages WHERE name = 'Personal Training' LIMIT 1), -- Package
    CURRENT_DATE - INTERVAL '20 days', -- Έναρξη 20 μέρες πριν
    CURRENT_DATE + INTERVAL '10 days', -- Λήξη σε 10 μέρες
    true, -- Ενεργή
    'active',
    NOW(),
    NOW()
);
*/

-- 4. Έλεγχος των test δεδομένων
SELECT '=== TEST DATA CREATED ===' as info;
SELECT 
    m.user_id,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.is_active,
    m.status,
    CASE 
        WHEN m.end_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN m.end_date = CURRENT_DATE THEN 'EXPIRES_TODAY'
        ELSE 'ACTIVE'
    END as membership_status,
    CASE 
        WHEN m.end_date < CURRENT_DATE THEN CURRENT_DATE - m.end_date
        ELSE m.end_date - CURRENT_DATE
    END as days_diff
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.created_at >= NOW() - INTERVAL '1 hour' -- Μόνο τα test δεδομένα
ORDER BY m.end_date DESC;
