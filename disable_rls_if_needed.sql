-- Disable RLS on pilates tables if needed
-- Run this in Supabase SQL Editor ONLY if RLS is causing issues

-- 1. Disable RLS on pilates_schedule_slots
ALTER TABLE pilates_schedule_slots DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on pilates_bookings  
ALTER TABLE pilates_bookings DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('pilates_schedule_slots', 'pilates_bookings');

-- 4. Test access
SELECT COUNT(*) as total_slots FROM pilates_schedule_slots;
SELECT COUNT(*) as available_slots FROM pilates_available_slots;
