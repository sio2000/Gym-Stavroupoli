-- FIX MEMBERSHIP RLS POLICIES
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Διαγραφή υπαρχόντων policies για memberships
DROP POLICY IF EXISTS "Users can view their own memberships" ON memberships;
DROP POLICY IF EXISTS "Users can view memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can view all memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can insert memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can update memberships" ON memberships;

-- 2. Δημιουργία νέων RLS policies για memberships

-- Policy: Users can view their own memberships
CREATE POLICY "Users can view their own memberships" ON memberships
    FOR SELECT USING (user_id = auth.uid());

-- Policy: Admins and secretaries can view all memberships
CREATE POLICY "Admins can view all memberships" ON memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- Policy: Admins and secretaries can insert memberships
CREATE POLICY "Admins can insert memberships" ON memberships
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- Policy: Admins and secretaries can update memberships
CREATE POLICY "Admins can update memberships" ON memberships
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- 3. Ενεργοποίηση RLS για memberships (αν δεν είναι ήδη ενεργό)
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- 4. Έλεγχος αν οι policies δημιουργήθηκαν σωστά
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'memberships'
ORDER BY policyname;
