-- DISABLE RLS POLICIES FOR MEMBERSHIPS TABLE

-- 1. Απενεργοποίηση RLS για τον πίνακα memberships
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;

-- 2. Διαγραφή όλων των υπαρχόντων policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON memberships;
DROP POLICY IF EXISTS "Users can view memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can view all memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can insert memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can update memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can manage all memberships" ON memberships;
