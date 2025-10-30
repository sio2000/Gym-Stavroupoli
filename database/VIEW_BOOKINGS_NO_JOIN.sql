-- Simple query WITHOUT joins (to avoid RLS issues)
-- Shows bookings directly

SELECT 
    user_id,
    slot_id,
    booking_date,
    status,
    created_at
FROM pilates_bookings
WHERE status = 'confirmed'
ORDER BY created_at DESC
LIMIT 30;

