-- Check date mismatch between admin and user calendar
-- Run this in Supabase SQL Editor

-- 1. Check what dates we have in the database
SELECT 
    'Current date' as info,
    CURRENT_DATE as value

UNION ALL

SELECT 
    'Admin panel week start' as info,
    '2025-09-08'::date as value

UNION ALL

SELECT 
    'Admin panel week end' as info,
    '2025-09-17'::date as value

UNION ALL

SELECT 
    'User calendar week start' as info,
    '2025-09-15'::date as value

UNION ALL

SELECT 
    'User calendar week end' as info,
    '2025-09-28'::date as value;

-- 2. Check slots for admin panel week (8-17 Sep)
SELECT 
    'Admin panel week slots' as info,
    COUNT(*) as count
FROM pilates_schedule_slots 
WHERE date BETWEEN '2025-09-08' AND '2025-09-17'
AND is_active = true

UNION ALL

-- 3. Check slots for user calendar week (15-28 Sep)
SELECT 
    'User calendar week slots' as info,
    COUNT(*) as count
FROM pilates_schedule_slots 
WHERE date BETWEEN '2025-09-15' AND '2025-09-28'
AND is_active = true;

-- 4. Show all active slots with their day of week
SELECT 
    date,
    EXTRACT(DOW FROM date) as day_of_week,
    CASE EXTRACT(DOW FROM date)
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    COUNT(*) as slot_count
FROM pilates_schedule_slots 
WHERE is_active = true
AND date >= '2025-09-08'
GROUP BY date, EXTRACT(DOW FROM date)
ORDER BY date;

-- 5. Check specifically for weekend slots
SELECT 
    'Weekend slots (Sat/Sun)' as info,
    COUNT(*) as count
FROM pilates_schedule_slots 
WHERE is_active = true
AND EXTRACT(DOW FROM date) IN (0, 6) -- Sunday = 0, Saturday = 6
AND date >= '2025-09-08';
