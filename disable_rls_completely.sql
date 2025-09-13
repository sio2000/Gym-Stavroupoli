-- Completely disable RLS on pilates tables
-- Run this in Supabase SQL Editor

-- Step 1: Disable RLS (this will automatically drop all policies)
ALTER TABLE pilates_schedule_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE pilates_bookings DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled
SELECT 
    'pilates_schedule_slots' as table_name,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pilates_schedule_slots'

UNION ALL

SELECT 
    'pilates_bookings' as table_name,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pilates_bookings';

-- Step 3: Test that we can access the data
SELECT 'Testing access to pilates_schedule_slots' as test;
SELECT COUNT(*) as total_slots FROM pilates_schedule_slots;
SELECT COUNT(*) as active_slots FROM pilates_schedule_slots WHERE is_active = true;

-- Step 4: Show some sample data
SELECT 
    id,
    date,
    start_time,
    end_time,
    max_capacity,
    is_active
FROM pilates_schedule_slots 
WHERE is_active = true 
AND date >= CURRENT_DATE
ORDER BY date, start_time
LIMIT 5;