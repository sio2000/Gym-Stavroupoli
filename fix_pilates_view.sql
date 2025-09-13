-- Fix the ambiguous column reference in pilates_available_slots view
-- Run this in Supabase SQL Editor

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_available_capacity(UUID);

-- 2. Recreate the function with proper column references
CREATE OR REPLACE FUNCTION get_available_capacity(slot_id UUID)
RETURNS INTEGER AS $$
DECLARE
    max_cap INTEGER;
    booked_count INTEGER;
BEGIN
    -- Βρες τη μέγιστη χωρητικότητα
    SELECT max_capacity INTO max_cap
    FROM pilates_schedule_slots
    WHERE id = slot_id AND is_active = true;
    
    IF max_cap IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Βρες πόσες κρατήσεις υπάρχουν
    SELECT COUNT(*) INTO booked_count
    FROM pilates_bookings
    WHERE pilates_bookings.slot_id = get_available_capacity.slot_id AND status = 'confirmed';
    
    RETURN max_cap - booked_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the view
DROP VIEW IF EXISTS pilates_available_slots;

CREATE OR REPLACE VIEW pilates_available_slots AS
SELECT 
    s.id,
    s.date,
    s.start_time,
    s.end_time,
    s.max_capacity,
    get_available_capacity(s.id) as available_capacity,
    CASE 
        WHEN get_available_capacity(s.id) = 0 THEN 'full'
        WHEN get_available_capacity(s.id) <= 1 THEN 'almost_full'
        ELSE 'available'
    END as status
FROM pilates_schedule_slots s
WHERE s.is_active = true
AND s.date >= CURRENT_DATE
ORDER BY s.date, s.start_time;

-- 4. Test the view
SELECT * FROM pilates_available_slots LIMIT 5;
