-- ═══════════════════════════════════════════════════════════════════════════
-- ΕΠΑΝΑΦΟΡΑ PILATES DEPOSITS ΒΑΣΕΙ ΟΝΟΜΑΤΩΝ ΧΡΗΣΤΩΝ
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Χρήστες που είχαν 25 μαθήματα και τώρα έχουν 10
UPDATE pilates_deposits pd
SET deposit_remaining = 25, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND mp.name = 'Pilates'
AND pd.is_active = true
AND up.first_name || ' ' || up.last_name IN (
    'Φιλιππος Πασχαλουδης',
    'κωνσταντινα τζηκα',
    'Ντενια Ιγνατιδου',
    'Δημητρα Γκαγκαλουδη',
    'Νενα Παπαδοπουλου',
    'ΦΩΤΗΣ ΦΩΤΙΑΔΗΣ',
    'Ελευθερία Τσουρεκα',
    'Lina Papad',
    'asdafs asfasdg',
    'nik nik',
    'as as',
    'sadf asdfg',
    'scs scs',
    'Μαρία  Σαββαϊδου '
);

-- Χρήστες που είχαν 50 μαθήματα (pilates_1year)
UPDATE pilates_deposits pd
SET deposit_remaining = 50, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND mp.name = 'Pilates'
AND pd.is_active = true
AND up.first_name || ' ' || up.last_name IN (
    'Ελεονωρα Τιτοπουλου',
    'Μαρια Νταβιτιδη'
);

-- Χρήστες που είχαν 8 μαθήματα
UPDATE pilates_deposits pd
SET deposit_remaining = 8, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND mp.name = 'Pilates'
AND pd.is_active = true
AND up.first_name || ' ' || up.last_name = 'ladis ladis';

-- Χρήστες που είχαν 16 μαθήματα
UPDATE pilates_deposits pd
SET deposit_remaining = 16, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND mp.name = 'Pilates'
AND pd.is_active = true
AND up.first_name || ' ' || up.last_name = 'dora dora';

-- Χρήστες που είχαν 4 μαθήματα
UPDATE pilates_deposits pd
SET deposit_remaining = 4, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND mp.name = 'Pilates'
AND pd.is_active = true
AND up.first_name || ' ' || up.last_name IN (
    'til til',
    'demena demena',
    'gkan gkan'
);

-- Χρήστες που είχαν 1 μάθημα
UPDATE pilates_deposits pd
SET deposit_remaining = 1, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND mp.name = 'Pilates'
AND pd.is_active = true
AND up.first_name || ' ' || up.last_name IN (
    'Αριστείδης Αμανατίδης',
    'model model',
    'apooooo apooooo',
    '4324 5665',
    'Χρήστος ΣΑΛΤΣΙΔΗΣ',
    '111 111',
    '2222 23323'
);

-- VERIFICATION
SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    mp.name AS "Πακέτο",
    pd.deposit_remaining AS "Μαθήματα Τώρα"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN memberships m ON pd.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC;

COMMIT;

SELECT '✅ DONE!' as "STATUS";

