-- FIX ULTIMATE POLICIES - Διόρθωση policies
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΔΙΑΓΡΑΦΗ ΥΠΑΡΧΟΝΤΩΝ POLICIES
-- ========================================

-- Διαγραφή υπαρχόντων policies
DROP POLICY IF EXISTS "Admins can manage ultimate locks" ON ultimate_installment_locks;
DROP POLICY IF EXISTS "Secretaries can manage ultimate locks" ON ultimate_installment_locks;

-- ========================================
-- ΒΗΜΑ 2: ΔΗΜΙΟΥΡΓΙΑ ΝΕΩΝ POLICIES
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
-- ΒΗΜΑ 3: ΕΛΕΓΧΟΣ
-- ========================================

-- Έλεγχος των policies
SELECT 
    'Policies created:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'ultimate_installment_locks';

SELECT 'Policies fixed!' as status;




