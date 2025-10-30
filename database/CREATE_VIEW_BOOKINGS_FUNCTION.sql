-- Create a function to view bookings without RLS restrictions
-- This will work regardless of RLS

CREATE OR REPLACE FUNCTION view_last_30_pilates_bookings()
RETURNS TABLE (
    user_name text,
    user_email text,
    booking_datetime timestamptz,
    booking_status text,
    class_date date,
    class_start_time time,
    class_end_time time,
    slot_capacity integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.first_name || ' ' || up.last_name AS user_name,
        up.email AS user_email,
        pb.booking_date AS booking_datetime,
        pb.status AS booking_status,
        pss.date AS class_date,
        pss.start_time AS class_start_time,
        pss.end_time AS class_end_time,
        pss.max_capacity AS slot_capacity
    FROM pilates_bookings pb
        INNER JOIN user_profiles up ON pb.user_id = up.id
        INNER JOIN pilates_schedule_slots pss ON pb.slot_id = pss.id
    WHERE pb.status = 'confirmed'
    ORDER BY pb.created_at DESC
    LIMIT 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now run this to see the results:
SELECT * FROM view_last_30_pilates_bookings();

