-- Check RLS policies for pilates tables
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled on pilates_schedule_slots
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'pilates_schedule_slots';

-- 2. Check RLS policies for pilates_schedule_slots
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'pilates_schedule_slots';

-- 3. Check if RLS is enabled on pilates_bookings
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'pilates_bookings';

-- 4. Check RLS policies for pilates_bookings
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'pilates_bookings';

-- 5. Test direct access to pilates_schedule_slots
SELECT COUNT(*) as total_slots FROM pilates_schedule_slots;
SELECT COUNT(*) as active_slots FROM pilates_schedule_slots WHERE is_active = true;

-- 6. Test access to pilates_available_slots view
SELECT COUNT(*) as available_slots FROM pilates_available_slots;
