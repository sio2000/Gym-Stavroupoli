-- Check max_capacity in pilates_schedule_slots
SELECT 
  id,
  date,
  start_time,
  max_capacity,
  is_active,
  created_at
FROM pilates_schedule_slots 
WHERE date >= '2025-09-13' 
  AND date <= '2025-09-22'
ORDER BY date, start_time
LIMIT 10;
