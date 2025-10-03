-- FINAL ULTIMATE FIX - Τελική διόρθωση για Ultimate σύστημα
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΔΙΑΓΡΑΦΗ ΥΠΑΡΧΟΝΤΩΝ CONSTRAINTS & POLICIES
-- ========================================

-- Διαγραφή υπαρχόντων foreign key constraints
ALTER TABLE ultimate_installment_locks 
DROP CONSTRAINT IF EXISTS ultimate_installment_locks_locked_by_fkey;

ALTER TABLE ultimate_installment_locks 
DROP CONSTRAINT IF EXISTS ultimate_installment_locks_deleted_by_fkey;

-- Διαγραφή υπαρχόντων policies
DROP POLICY IF EXISTS "Admins can manage ultimate locks" ON ultimate_installment_locks;
DROP POLICY IF EXISTS "Secretaries can manage ultimate locks" ON ultimate_installment_locks;

-- ========================================
-- ΒΗΜΑ 2: ΔΗΜΙΟΥΡΓΙΑ ΣΩΣΤΩΝ FOREIGN KEYS
-- ========================================

-- Δημιουργία foreign keys που δείχνουν στον user_profiles
ALTER TABLE ultimate_installment_locks
ADD CONSTRAINT ultimate_installment_locks_locked_by_fkey
FOREIGN KEY (locked_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

ALTER TABLE ultimate_installment_locks
ADD CONSTRAINT ultimate_installment_locks_deleted_by_fkey
FOREIGN KEY (deleted_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

-- ========================================
-- ΒΗΜΑ 3: ΔΗΜΙΟΥΡΓΙΑ POLICIES
-- ========================================

-- Policy για admins
CREATE POLICY "Admins can manage ultimate locks" ON ultimate_installment_locks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role IN ('admin', 'super_admin')
        )
    );

-- Policy για secretaries
CREATE POLICY "Secretaries can manage ultimate locks" ON ultimate_installment_locks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'secretary'
        )
    );

-- ========================================
-- ΒΗΜΑ 4: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- ========================================

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

-- Έλεγχος policies
SELECT 
    'Policies:' as info,
    policyname,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'ultimate_installment_locks';

-- Έλεγχος πίνακα
SELECT 
    'Table structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ultimate_installment_locks'
ORDER BY ordinal_position;

SELECT 'Ultimate system fixed successfully!' as status;
