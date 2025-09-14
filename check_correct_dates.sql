-- Check the correct dates for admin panel vs user calendar
-- Run this in Supabase SQL Editor

-- 1. Check what dates we have in the database
SELECT 
    'All dates in database' as info,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    COUNT(*) as total_slots
FROM pilates_schedule_slots;

-- 2. Check active slots by date range
SELECT 
    'Active slots by date range' as info,
    date,
    COUNT(*) as slot_count
FROM pilates_schedule_slots 
WHERE is_active = true
GROUP BY date
ORDER BY date;

-- 3. Check what the admin panel should show (8-17 Sep)
SELECT 
    'Admin panel week (8-17 Sep)' as info,
    COUNT(*) as total_slots,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_slots
FROM pilates_schedule_slots 
WHERE date BETWEEN '2025-09-08' AND '2025-09-17';

-- 4. Check what the user calendar is trying to show (1-10 Sep)
SELECT 
    'User calendar week (1-10 Sep)' as info,
    COUNT(*) as total_slots,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_slots
FROM pilates_schedule_slots 
WHERE date BETWEEN '2025-09-01' AND '2025-09-10';

-- 5. Show specific slots for admin panel week
SELECT 
    'Admin panel slots by date' as info,
    date,
    EXTRACT(DOW FROM date) as day_of_week,
    CASE EXTRACT(DOW FROM date)
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 0 THEN 'Sunday'
    END as day_name,
    COUNT(*) as total_slots,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_slots
FROM pilates_schedule_slots 
WHERE date BETWEEN '2025-09-08' AND '2025-09-17'
GROUP BY date, EXTRACT(DOW FROM date)
ORDER BY date;
