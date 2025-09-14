-- FIX EXISTING MEMBERSHIPS TABLE - Διόρθωση υπάρχοντος πίνακα memberships
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος υπάρχουσας δομής
SELECT 'Checking existing memberships table structure...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;

-- 2. Προσθήκη missing columns
SELECT 'Adding missing columns...' as step;

-- Προσθήκη duration_type column
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS duration_type TEXT;

-- Προσθήκη status column (αντικαθιστά το is_active)
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Προσθήκη approved_by column
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL;

-- Προσθήκη approved_at column
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Δημιουργία constraints για τα νέα columns
SELECT 'Adding constraints...' as step;

-- Constraint για duration_type (με έλεγχο ύπαρξης)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_duration_type'
    ) THEN
        ALTER TABLE memberships 
        ADD CONSTRAINT check_duration_type 
        CHECK (duration_type IN ('year', 'semester', 'month', 'lesson'));
    END IF;
END $$;

-- Constraint για status (με έλεγχο ύπαρξης)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_status'
    ) THEN
        ALTER TABLE memberships 
        ADD CONSTRAINT check_status 
        CHECK (status IN ('active', 'expired', 'cancelled', 'suspended'));
    END IF;
END $$;

-- 4. Migration δεδομένων από is_active σε status
SELECT 'Migrating data from is_active to status...' as step;

UPDATE memberships 
SET status = CASE 
    WHEN is_active = true THEN 'active'
    WHEN is_active = false THEN 'expired'
    ELSE 'active'
END
WHERE status IS NULL;

-- 5. Δημιουργία indexes για τα νέα columns
SELECT 'Creating indexes...' as step;

CREATE INDEX IF NOT EXISTS idx_memberships_duration_type ON memberships(duration_type);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_approved_by ON memberships(approved_by);
CREATE INDEX IF NOT EXISTS idx_memberships_expiration ON memberships(status, end_date) WHERE status = 'active';

-- 6. Δημιουργία RLS policies (αν δεν υπάρχουν)
SELECT 'Setting up RLS policies...' as step;

-- Ενεργοποίηση RLS
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON memberships;
CREATE POLICY "Users can view own memberships" ON memberships
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins and secretaries can view all memberships
DROP POLICY IF EXISTS "Admins can view all memberships" ON memberships;
CREATE POLICY "Admins can view all memberships" ON memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- Policy: Only admins and secretaries can insert memberships
DROP POLICY IF EXISTS "Admins can insert memberships" ON memberships;
CREATE POLICY "Admins can insert memberships" ON memberships
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- Policy: Only admins and secretaries can update memberships
DROP POLICY IF EXISTS "Admins can update memberships" ON memberships;
CREATE POLICY "Admins can update memberships" ON memberships
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- 7. Δημιουργία functions
SELECT 'Creating functions...' as step;

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_membership_stats();
DROP FUNCTION IF EXISTS get_user_membership_status(UUID);
DROP FUNCTION IF EXISTS get_user_active_memberships(UUID);

-- Function για αυτόματη λήξη συνδρομών
CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS void AS $$
BEGIN
    UPDATE memberships 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function για έλεγχο και λήξη συνδρομών
CREATE OR REPLACE FUNCTION check_and_expire_memberships()
RETURNS void AS $$
BEGIN
    -- Ενημέρωση συνδρομών που έχουν λήξει
    UPDATE memberships 
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE 
        status = 'active' 
        AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function για έλεγχο ενεργών συνδρομών χρήστη
CREATE OR REPLACE FUNCTION get_user_membership_status(user_uuid UUID)
RETURNS TABLE (
    has_active_membership BOOLEAN,
    active_memberships_count INTEGER,
    next_expiration_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) > 0 as has_active_membership,
        COUNT(*)::INTEGER as active_memberships_count,
        MIN(m.end_date) as next_expiration_date
    FROM memberships m
    WHERE m.user_id = user_uuid
    AND m.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function για στατιστικά συνδρομών
CREATE OR REPLACE FUNCTION get_membership_stats()
RETURNS TABLE (
    total_memberships BIGINT,
    active_memberships BIGINT,
    expired_memberships BIGINT,
    expiring_this_week BIGINT,
    total_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_memberships,
        COUNT(*) FILTER (WHERE status = 'active') as active_memberships,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_memberships,
        COUNT(*) FILTER (WHERE status = 'active' AND end_date <= CURRENT_DATE + INTERVAL '7 days') as expiring_this_week,
        COALESCE(SUM(mpd.price), 0) as total_revenue
    FROM memberships m
    LEFT JOIN membership_package_durations mpd ON m.package_id = mpd.package_id AND m.duration_type = mpd.duration_type
    WHERE m.status IN ('active', 'expired');
END;
$$ LANGUAGE plpgsql;

-- Function για έλεγχο ενεργών συνδρομών
CREATE OR REPLACE FUNCTION get_user_active_memberships(user_uuid UUID)
RETURNS TABLE (
    membership_id UUID,
    package_name TEXT,
    duration_type TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        mp.name,
        m.duration_type,
        m.start_date,
        m.end_date,
        m.status
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.user_id = user_uuid
    AND m.status = 'active'
    ORDER BY m.end_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Δημιουργία view
SELECT 'Creating membership overview view...' as step;

-- View για εύκολη παρακολούθηση συνδρομών
CREATE OR REPLACE VIEW membership_overview AS
SELECT 
    m.id,
    m.user_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.duration_type,
    m.start_date,
    m.end_date,
    m.status,
    CASE 
        WHEN m.end_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN m.end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'EXPIRING_SOON'
        ELSE 'ACTIVE'
    END as expiration_status,
    m.approved_at,
    m.created_at
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
ORDER BY m.end_date DESC;

-- 9. Δημιουργία triggers
SELECT 'Creating triggers...' as step;

-- Trigger για updated_at
CREATE OR REPLACE FUNCTION update_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_memberships_updated_at ON memberships;
CREATE TRIGGER trigger_update_memberships_updated_at
    BEFORE UPDATE ON memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_memberships_updated_at();

-- 10. Έλεγχος τελικής δομής
SELECT 'Final structure verification...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;

-- 11. Test functions
SELECT 'Testing functions...' as step;

-- Test expire_memberships function
DO $$
BEGIN
    PERFORM expire_memberships();
    RAISE NOTICE 'expire_memberships function executed successfully';
END $$;

-- Test get_membership_stats function
DO $$
DECLARE
    stats_record RECORD;
BEGIN
    SELECT * INTO stats_record FROM get_membership_stats();
    RAISE NOTICE 'get_membership_stats function executed successfully';
    RAISE NOTICE 'Total memberships: %, Active: %, Expired: %', 
        stats_record.total_memberships, 
        stats_record.active_memberships, 
        stats_record.expired_memberships;
END $$;

-- 12. Τελικός έλεγχος
SELECT 'Final verification...' as step;

-- Έλεγχος ότι όλα τα απαραίτητα στοιχεία υπάρχουν
DO $$
DECLARE
    verification_passed BOOLEAN := TRUE;
BEGIN
    -- Έλεγχος columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'status') THEN
        RAISE NOTICE 'FAILED: status column missing';
        verification_passed := FALSE;
    ELSE
        RAISE NOTICE 'PASSED: status column exists';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'duration_type') THEN
        RAISE NOTICE 'FAILED: duration_type column missing';
        verification_passed := FALSE;
    ELSE
        RAISE NOTICE 'PASSED: duration_type column exists';
    END IF;
    
    -- Έλεγχος functions
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'expire_memberships') THEN
        RAISE NOTICE 'FAILED: expire_memberships function missing';
        verification_passed := FALSE;
    ELSE
        RAISE NOTICE 'PASSED: expire_memberships function exists';
    END IF;
    
    -- Τελικό αποτέλεσμα
    IF verification_passed THEN
        RAISE NOTICE 'SUCCESS: All membership system components created successfully!';
    ELSE
        RAISE EXCEPTION 'FAILED: Some components are missing. Please check the errors above.';
    END IF;
END $$;

SELECT 'COMPLETION: Memberships table fixed and enhanced successfully!' as final_status;
