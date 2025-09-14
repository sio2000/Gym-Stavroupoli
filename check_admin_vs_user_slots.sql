-- Compare admin panel slots vs user calendar slots
-- Run this in Supabase SQL Editor

-- 1. Check what the admin panel should show (8-17 Sep, Monday-Friday only)
SELECT 
    'Admin panel week (8-17 Sep) - All slots' as info,
    COUNT(*) as total_slots,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_slots,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_slots
FROM pilates_schedule_slots 
WHERE date BETWEEN '2025-09-08' AND '2025-09-17';

-- 2. Check what the user calendar should show (15-24 Sep based on logs)
SELECT 
    'User calendar week (15-24 Sep) - All slots' as info,
    COUNT(*) as total_slots,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_slots,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_slots
FROM pilates_schedule_slots 
WHERE date BETWEEN '2025-09-15' AND '2025-09-24';

-- 3. Show admin panel slots by date
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

-- 4. Show user calendar slots by date
SELECT 
    'User calendar slots by date' as info,
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
WHERE date BETWEEN '2025-09-15' AND '2025-09-24'
GROUP BY date, EXTRACT(DOW FROM date)
ORDER BY date;

-- 5. Check if there are any slots for the user calendar week
SELECT 
    'Slots for user calendar week (15-24 Sep)' as info,
    COUNT(*) as count
FROM pilates_schedule_slots 
WHERE date BETWEEN '2025-09-15' AND '2025-09-24'
AND is_active = true;
