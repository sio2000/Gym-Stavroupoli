-- FIX FOREIGN KEYS - Διόρθωση Foreign Keys για Ultimate πίνακα
-- Τρέξε αυτό το script στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΔΗΜΙΟΥΡΓΙΑ FOREIGN KEYS
-- ========================================

-- Δημιουργία foreign key για user_id -> user_profiles
ALTER TABLE ultimate_membership_requests 
ADD CONSTRAINT ultimate_membership_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Δημιουργία foreign key για package_id -> membership_packages  
ALTER TABLE ultimate_membership_requests 
ADD CONSTRAINT ultimate_membership_requests_package_id_fkey 
FOREIGN KEY (package_id) REFERENCES membership_packages(id) ON DELETE CASCADE;

-- ========================================
-- ΒΗΜΑ 2: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- ========================================

-- Ελέγχος των νέων foreign keys
SELECT 
    'Foreign keys created:' as info,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'ultimate_membership_requests';

-- Δοκιμή του query που χρησιμοποιεί το frontend
SELECT 
    'Test query result:' as info,
    COUNT(*) as count
FROM ultimate_membership_requests umr
LEFT JOIN user_profiles up ON umr.user_id = up.user_id
LEFT JOIN membership_packages mp ON umr.package_id = mp.id;

SELECT 'Foreign keys fixed successfully!' as status;




