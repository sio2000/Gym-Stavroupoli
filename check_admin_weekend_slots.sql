-- Check if admin panel has weekend slots marked as inactive
-- Run this in Supabase SQL Editor

-- 1. Check all slots for the admin panel week (8-17 Sep)
SELECT 
    'Admin panel week (8-17 Sep) - All slots' as info,
    COUNT(*) as total_slots,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_slots,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_slots
FROM pilates_schedule_slots 
WHERE date BETWEEN '2025-09-08' AND '2025-09-17';

-- 2. Check weekend slots specifically (Saturday = 6, Sunday = 0)
SELECT 
    'Weekend slots (Sat/Sun) in admin week' as info,
    COUNT(*) as total_weekend_slots,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_weekend_slots,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_weekend_slots
FROM pilates_schedule_slots 
WHERE date BETWEEN '2025-09-08' AND '2025-09-17'
AND EXTRACT(DOW FROM date) IN (0, 6); -- Sunday = 0, Saturday = 6

-- 3. Show specific weekend slots
SELECT 
    date,
    EXTRACT(DOW FROM date) as day_of_week,
    CASE EXTRACT(DOW FROM date)
        WHEN 0 THEN 'Sunday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    start_time,
    is_active,
    max_capacity
FROM pilates_schedule_slots 
WHERE date BETWEEN '2025-09-08' AND '2025-09-17'
AND EXTRACT(DOW FROM date) IN (0, 6)
ORDER BY date, start_time;

-- 4. Check if there are any active weekend slots (should be 0)
SELECT 
    'Active weekend slots (should be 0)' as info,
    COUNT(*) as count
FROM pilates_schedule_slots 
WHERE is_active = true
AND EXTRACT(DOW FROM date) IN (0, 6)
AND date >= '2025-09-08';
