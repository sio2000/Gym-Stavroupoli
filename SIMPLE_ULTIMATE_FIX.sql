-- SIMPLE ULTIMATE FIX - Απλή διόρθωση Ultimate συστήματος
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΔΙΑΓΡΑΦΗ ΥΠΑΡΧΟΝΤΩΝ CONSTRAINTS
-- ========================================

-- Διαγραφή υπαρχόντων foreign key constraints
ALTER TABLE ultimate_installment_locks 
DROP CONSTRAINT IF EXISTS ultimate_installment_locks_locked_by_fkey;

ALTER TABLE ultimate_installment_locks 
DROP CONSTRAINT IF EXISTS ultimate_installment_locks_deleted_by_fkey;

-- ========================================
-- ΒΗΜΑ 2: ΔΗΜΙΟΥΡΓΙΑ USER PROFILE
-- ========================================

-- Δημιουργία user profile για το admin user
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'first_name', 'Admin'),
    COALESCE(au.raw_user_meta_data->>'last_name', 'User'),
    au.email,
    'admin',
    NOW(),
    NOW()
FROM auth.users au
WHERE au.id = 'ff37b8f6-29b2-4598-9f8f-351940e755a2'
AND NOT EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- ΒΗΜΑ 3: ΔΗΜΙΟΥΡΓΙΑ FOREIGN KEYS
-- ========================================

-- Δημιουργία foreign keys που επιτρέπουν NULL
ALTER TABLE ultimate_installment_locks
ADD CONSTRAINT ultimate_installment_locks_locked_by_fkey
FOREIGN KEY (locked_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

ALTER TABLE ultimate_installment_locks
ADD CONSTRAINT ultimate_installment_locks_deleted_by_fkey
FOREIGN KEY (deleted_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

-- ========================================
-- ΒΗΜΑ 4: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- ========================================

-- Έλεγχος user profile
SELECT 
    'User profile check:' as info,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE user_id = 'ff37b8f6-29b2-4598-9f8f-351940e755a2';

-- Έλεγχος foreign keys
SELECT 
    'Foreign keys:' as info,
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
    AND tc.table_name = 'ultimate_installment_locks';

-- Έλεγχος Ultimate requests
SELECT 
    'Ultimate requests:' as info,
    COUNT(*) as count
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate';

SELECT 'Simple Ultimate fix applied successfully!' as status;




