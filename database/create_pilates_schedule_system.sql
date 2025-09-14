-- CREATE PILATES SCHEDULE SYSTEM
-- Δημιουργία συστήματος προγράμματος pilates με κρατήσεις

-- 1. Δημιουργία πίνακα pilates_schedule_slots για τα διαθέσιμα slots
CREATE TABLE IF NOT EXISTS pilates_schedule_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 4,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, start_time)
);

-- 2. Δημιουργία πίνακα pilates_bookings για τις κρατήσεις
CREATE TABLE IF NOT EXISTS pilates_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES pilates_schedule_slots(id) ON DELETE CASCADE,
    booking_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, slot_id) -- Ένας χρήστης μπορεί να κλείσει μόνο ένα slot
);

-- 3. Δημιουργία indexes για βελτιστοποίηση
CREATE INDEX IF NOT EXISTS idx_pilates_slots_date ON pilates_schedule_slots(date);
CREATE INDEX IF NOT EXISTS idx_pilates_slots_active ON pilates_schedule_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_pilates_bookings_user ON pilates_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_pilates_bookings_slot ON pilates_bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_pilates_bookings_status ON pilates_bookings(status);

-- 4. Δημιουργία RLS policies
ALTER TABLE pilates_schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilates_bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Όλοι μπορούν να βλέπουν τα διαθέσιμα slots
CREATE POLICY "Anyone can view active pilates slots" ON pilates_schedule_slots
    FOR SELECT USING (is_active = true);

-- Policy: Μόνο admins μπορούν να διαχειρίζονται τα slots
CREATE POLICY "Admins can manage pilates slots" ON pilates_schedule_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy: Χρήστες μπορούν να βλέπουν τις δικές τους κρατήσεις
CREATE POLICY "Users can view own pilates bookings" ON pilates_bookings
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Χρήστες μπορούν να δημιουργούν κρατήσεις μόνο για εαυτούς
CREATE POLICY "Users can create own pilates bookings" ON pilates_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Χρήστες μπορούν να ακυρώνουν τις δικές τους κρατήσεις
CREATE POLICY "Users can update own pilates bookings" ON pilates_bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admins μπορούν να βλέπουν όλες τις κρατήσεις
CREATE POLICY "Admins can view all pilates bookings" ON pilates_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 5. Δημιουργία function για υπολογισμό διαθέσιμων θέσεων
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

-- 6. Δημιουργία view για εύκολη προβολή διαθέσιμων slots
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

-- 7. Δημιουργία trigger για ενημέρωση updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pilates_slots_updated_at
    BEFORE UPDATE ON pilates_schedule_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pilates_bookings_updated_at
    BEFORE UPDATE ON pilates_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
