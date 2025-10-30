-- ═══════════════════════════════════════════════════════════════════════════
-- ΕΠΑΝΑΦΟΡΑ DEPOSITS ΒΑΣΕΙ ΟΝΟΜΑΤΩΝ - ΤΕΛΙΚΗ ΛΥΣΗ
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Χρήστες με 25 μαθήματα
UPDATE pilates_deposits pd
SET deposit_remaining = 25, updated_at = NOW()
FROM user_profiles up
WHERE pd.user_id = up.user_id 
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

-- Χρήστες με 50 μαθήματα
UPDATE pilates_deposits pd
SET deposit_remaining = 50, updated_at = NOW()
FROM user_profiles up
WHERE pd.user_id = up.user_id 
AND pd.is_active = true
AND up.first_name || ' ' || up.last_name IN (
    'Ελεονωρα Τιτοπουλου',
    'Μαρια Νταβιτιδη'
);

-- ladis ladis - 8 μαθήματα
UPDATE pilates_deposits pd
SET deposit_remaining = 8, updated_at = NOW()
FROM user_profiles up
WHERE pd.user_id = up.user_id 
AND pd.is_active = true
AND up.first_name = 'ladis' AND up.last_name = 'ladis';

-- dora dora - 16 μαθήματα
UPDATE pilates_deposits pd
SET deposit_remaining = 16, updated_at = NOW()
FROM user_profiles up
WHERE pd.user_id = up.user_id 
AND pd.is_active = true
AND up.first_name = 'dora' AND up.last_name = 'dora';

-- Χρήστες με 4 μαθήματα
UPDATE pilates_deposits pd
SET deposit_remaining = 4, updated_at = NOW()
FROM user_profiles up
WHERE pd.user_id = up.user_id 
AND pd.is_active = true
AND up.first_name || ' ' || up.last_name IN (
    'til til',
    'demena demena',
    'gkan gkan'
);

-- Χρήστες με 1 μάθημα
UPDATE pilates_deposits pd
SET deposit_remaining = 1, updated_at = NOW()
FROM user_profiles up
WHERE pd.user_id = up.user_id 
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

SELECT 'All deposits updated' as status;

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

SELECT '✅ COMPLETED!' as "STATUS";

