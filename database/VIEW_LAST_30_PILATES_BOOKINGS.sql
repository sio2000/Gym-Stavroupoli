-- ═══════════════════════════════════════════════════════════════
-- VIEW LAST 30 PILATES BOOKINGS
-- 100% Safe READ-ONLY query - No changes to database
-- Shows: User names, booking dates/times, slots
-- ═══════════════════════════════════════════════════════════════

SELECT 
    -- User Information
    up.first_name || ' ' || up.last_name AS user_name,
    up.email AS user_email,
    
    -- Booking Information
    pb.booking_date AS booking_datetime,
    pb.status AS booking_status,
    pb.created_at AS booking_created_at,
    
    -- Slot Information
    pss.date AS class_date,
    pss.start_time AS class_start_time,
    pss.end_time AS class_end_time,
    pss.max_capacity AS slot_capacity,
    
    -- Additional Info
    pb.id AS booking_id,
    pb.user_id,
    pb.slot_id,
    pb.notes
    
FROM pilates_bookings pb
    
    -- Join with user_profiles to get user names
    INNER JOIN user_profiles up 
        ON pb.user_id = up.id
    
    -- Join with pilates_schedule_slots to get slot details
    INNER JOIN pilates_schedule_slots pss 
        ON pb.slot_id = pss.id

WHERE 
    -- Only confirmed bookings
    pb.status = 'confirmed'
    
    -- Order by most recent first
ORDER BY 
    pb.created_at DESC

LIMIT 30;

-- ═══════════════════════════════════════════════════════════════
-- ALTERNATIVE: Get last 30 users (distinct)
-- Shows which users booked most recently
-- ═══════════════════════════════════════════════════════════════

/*
SELECT DISTINCT ON (pb.user_id)
    up.first_name || ' ' || up.last_name AS user_name,
    up.email AS user_email,
    pb.booking_date AS last_booking_date,
    pss.date AS class_date,
    pss.start_time AS class_start_time
FROM pilates_bookings pb
    INNER JOIN user_profiles up ON pb.user_id = up.id
    INNER JOIN pilates_schedule_slots pss ON pb.slot_id = pss.id
WHERE pb.status = 'confirmed'
ORDER BY pb.user_id, pb.created_at DESC
LIMIT 30;
*/

-- ═══════════════════════════════════════════════════════════════
-- DETAILED VIEW: Last 30 bookings with full details
-- ═══════════════════════════════════════════════════════════════

/*
SELECT 
    ROW_NUMBER() OVER (ORDER BY pb.created_at DESC) AS booking_number,
    up.first_name || ' ' || up.last_name AS user_name,
    up.email AS user_email,
    TO_CHAR(pb.booking_date, 'DD/MM/YYYY HH24:MI') AS booking_datetime,
    TO_CHAR(pss.date, 'DD/MM/YYYY') AS class_date,
    TO_CHAR(pss.start_time, 'HH24:MI') AS class_time,
    pb.status AS status,
    pb.created_at AS created_at
FROM pilates_bookings pb
    INNER JOIN user_profiles up ON pb.user_id = up.id
    INNER JOIN pilates_schedule_slots pss ON pb.slot_id = pss.id
WHERE pb.status = 'confirmed'
ORDER BY pb.created_at DESC
LIMIT 30;
*/

