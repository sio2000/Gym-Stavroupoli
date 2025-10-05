-- Script για να δοκιμάσουμε διάφορα σενάρια ληγμένων συνδρομών
-- Αυτό θα μας βοηθήσει να επιβεβαιώσουμε ότι η λογική λειτουργεί σωστά

-- 1. Δημιούργησε test συνδρομές με διάφορες ημερομηνίες λήξης
-- (Αντιγράψε και επικόλλησε αυτό το script στο psql ή pgAdmin)

-- Βήμα 1: Βρες έναν υπαρχόντα χρήστη
SELECT '=== STEP 1: FIND TEST USER ===' as step;
SELECT user_id, first_name, last_name, email 
FROM user_profiles 
WHERE email LIKE '%test%' OR email LIKE '%example%' OR first_name LIKE '%Test%'
LIMIT 1;

-- Βήμα 2: Βρες υπαρχόντα packages
SELECT '=== STEP 2: FIND TEST PACKAGES ===' as step;
SELECT id, name, description 
FROM membership_packages 
WHERE is_active = true 
ORDER BY name;

-- Βήμα 3: Δημιούργησε test συνδρομές (UNCOMMENT για να εκτελεστεί)
/*
-- Παρακάτω είναι τα SQL statements για να δημιουργήσεις test συνδρομές
-- Αντικατέστησε τα UUIDs με τα πραγματικά από τα προηγούμενα queries

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
    'YOUR_USER_ID_HERE', -- Αντικατέστησε με πραγματικό user_id
    'YOUR_FREE_GYM_PACKAGE_ID_HERE', -- Αντικατέστησε με πραγματικό package_id
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
    'YOUR_USER_ID_HERE', -- Αντικατέστησε με πραγματικό user_id
    'YOUR_PILATES_PACKAGE_ID_HERE', -- Αντικατέστησε με πραγματικό package_id
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
    'YOUR_USER_ID_HERE', -- Αντικατέστησε με πραγματικό user_id
    'YOUR_ULTIMATE_PACKAGE_ID_HERE', -- Αντικατέστησε με πραγματικό package_id
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
    'YOUR_USER_ID_HERE', -- Αντικατέστησε με πραγματικό user_id
    'YOUR_PERSONAL_TRAINING_PACKAGE_ID_HERE', -- Αντικατέστησε με πραγματικό package_id
    CURRENT_DATE - INTERVAL '20 days', -- Έναρξη 20 μέρες πριν
    CURRENT_DATE + INTERVAL '10 days', -- Λήξη σε 10 μέρες
    true, -- Ενεργή
    'active',
    NOW(),
    NOW()
);
*/

-- Βήμα 4: Έλεγχος των test δεδομένων
SELECT '=== STEP 4: CHECK TEST DATA ===' as step;
SELECT 
    m.user_id,
    up.first_name,
    up.last_name,
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
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.created_at >= NOW() - INTERVAL '1 hour' -- Μόνο τα test δεδομένα
ORDER BY m.end_date DESC;

-- Βήμα 5: Δοκίμασε τη λογική φιλτραρίσματος
SELECT '=== STEP 5: TEST FILTERING LOGIC ===' as step;
-- Αυτό είναι το query που χρησιμοποιεί η getUserActiveMemberships function
SELECT 
    m.user_id,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.is_active,
    m.status
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.is_active = true 
    AND m.end_date >= CURRENT_DATE -- Αυτό είναι το κλειδί!
    AND m.created_at >= NOW() - INTERVAL '1 hour' -- Μόνο τα test δεδομένα
ORDER BY m.end_date DESC;

-- Βήμα 6: Δες ποιες συνδρομές θα φιλτραριστούν έξω
SELECT '=== STEP 6: MEMBERSHIPS THAT SHOULD BE FILTERED OUT ===' as step;
SELECT 
    m.user_id,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.is_active,
    m.status,
    CURRENT_DATE - m.end_date as days_expired
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.is_active = true 
    AND m.end_date < CURRENT_DATE -- Αυτές θα φιλτραριστούν έξω
    AND m.created_at >= NOW() - INTERVAL '1 hour' -- Μόνο τα test δεδομένα
ORDER BY m.end_date DESC;
