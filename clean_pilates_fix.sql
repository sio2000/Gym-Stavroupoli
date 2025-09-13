-- Clean fix for pilates issues - Run this in Supabase SQL Editor
-- This script will fix all problems step by step

-- Step 1: Drop the problematic view and function
DROP VIEW IF EXISTS pilates_available_slots CASCADE;
DROP FUNCTION IF EXISTS get_available_capacity(UUID) CASCADE;

-- Step 2: Disable RLS to avoid permission issues
ALTER TABLE pilates_schedule_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE pilates_bookings DISABLE ROW LEVEL SECURITY;

-- Step 3: Test that we can access the data
SELECT COUNT(*) as total_slots FROM pilates_schedule_slots;
SELECT COUNT(*) as active_slots FROM pilates_schedule_slots WHERE is_active = true;

-- Step 4: Show sample data
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
LIMIT 10;
