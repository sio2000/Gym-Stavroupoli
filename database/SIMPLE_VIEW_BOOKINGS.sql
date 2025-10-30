-- Simple query to view Pilates bookings
-- This is the active query (not commented)

SELECT 
    up.first_name || ' ' || up.last_name AS user_name,
    up.email AS user_email,
    pb.booking_date AS booking_datetime,
    pb.status AS booking_status,
    pss.date AS class_date,
    pss.start_time AS class_start_time,
    pss.end_time AS class_end_time
FROM pilates_bookings pb
    INNER JOIN user_profiles up ON pb.user_id = up.id
    INNER JOIN pilates_schedule_slots pss ON pb.slot_id = pss.id
WHERE pb.status = 'confirmed'
ORDER BY pb.created_at DESC
LIMIT 30;

