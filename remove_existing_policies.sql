-- Remove existing RLS policies and disable RLS completely
-- Run this in Supabase SQL Editor

-- Step 1: Drop all existing policies on pilates_schedule_slots
DROP POLICY IF EXISTS "Anyone can view active pilates slots" ON pilates_schedule_slots;
DROP POLICY IF EXISTS "Admin can manage pilates slots" ON pilates_schedule_slots;
DROP POLICY IF EXISTS "Users can view pilates slots" ON pilates_schedule_slots;

-- Step 2: Drop all existing policies on pilates_bookings
DROP POLICY IF EXISTS "Anyone can view pilates bookings" ON pilates_bookings;
DROP POLICY IF EXISTS "Users can create pilates bookings" ON pilates_bookings;
DROP POLICY IF EXISTS "Users can update their own pilates bookings" ON pilates_bookings;
DROP POLICY IF EXISTS "Users can delete their own pilates bookings" ON pilates_bookings;

-- Step 3: Disable RLS completely
ALTER TABLE pilates_schedule_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE pilates_bookings DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('pilates_schedule_slots', 'pilates_bookings');

-- Step 5: Test access
SELECT COUNT(*) as total_slots FROM pilates_schedule_slots;
SELECT COUNT(*) as active_slots FROM pilates_schedule_slots WHERE is_active = true;
