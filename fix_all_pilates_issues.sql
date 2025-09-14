-- Fix all pilates issues - Run this in Supabase SQL Editor
-- This script will fix all the problems step by step

-- 1. Drop the view first (it depends on the function)
DROP VIEW IF EXISTS pilates_available_slots CASCADE;

-- 2. Drop the function with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS get_available_capacity(UUID) CASCADE;

-- 3. Recreate the function with correct column references
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
    
    -- Βρες πόσες κρατήσεις υπάρχουν (using table prefix to avoid ambiguity)
    SELECT COUNT(*) INTO booked_count
    FROM pilates_bookings
    WHERE pilates_bookings.slot_id = slot_id AND status = 'confirmed';
    
    RETURN max_cap - booked_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate the view
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

-- 5. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view active pilates slots" ON pilates_schedule_slots;
DROP POLICY IF EXISTS "Anyone can view pilates bookings" ON pilates_bookings;
DROP POLICY IF EXISTS "Users can create pilates bookings" ON pilates_bookings;
DROP POLICY IF EXISTS "Users can update their own pilates bookings" ON pilates_bookings;

-- 6. Create new RLS policies
CREATE POLICY "Anyone can view active pilates slots" ON pilates_schedule_slots
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view pilates bookings" ON pilates_bookings
    FOR SELECT USING (true);

CREATE POLICY "Users can create pilates bookings" ON pilates_bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own pilates bookings" ON pilates_bookings
    FOR UPDATE USING (true);

-- 7. Test the function
SELECT get_available_capacity('00000000-0000-0000-0000-000000000000') as test_result;

-- 8. Test the view
SELECT COUNT(*) as total_available_slots FROM pilates_available_slots;

-- 9. Test direct table access
SELECT COUNT(*) as total_slots FROM pilates_schedule_slots;
SELECT COUNT(*) as active_slots FROM pilates_schedule_slots WHERE is_active = true;

-- 10. Show some sample data
SELECT * FROM pilates_available_slots LIMIT 5;
