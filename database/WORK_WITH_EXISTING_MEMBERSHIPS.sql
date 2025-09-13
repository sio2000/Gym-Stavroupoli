-- WORK WITH EXISTING MEMBERSHIPS - Δουλεύει με την υπάρχουσα δομή
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

-- 2. Δημιουργία functions που δουλεύουν με την υπάρχουσα δομή
SELECT 'Creating functions for existing structure...' as step;

-- Function για αυτόματη λήξη συνδρομών (χρησιμοποιεί is_active)
CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS void AS $$
BEGIN
    UPDATE memberships 
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true 
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
        is_active = false,
        updated_at = NOW()
    WHERE 
        is_active = true 
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
    AND m.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function για στατιστικά συνδρομών
CREATE OR REPLACE FUNCTION get_membership_stats()
RETURNS TABLE (
    total_memberships BIGINT,
    active_memberships BIGINT,
    expired_memberships BIGINT,
    expiring_this_week BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_memberships,
        COUNT(*) FILTER (WHERE is_active = true) as active_memberships,
        COUNT(*) FILTER (WHERE is_active = false) as expired_memberships,
        COUNT(*) FILTER (WHERE is_active = true AND end_date <= CURRENT_DATE + INTERVAL '7 days') as expiring_this_week
    FROM memberships;
END;
$$ LANGUAGE plpgsql;

-- Function για έλεγχο ενεργών συνδρομών
CREATE OR REPLACE FUNCTION get_user_active_memberships(user_uuid UUID)
RETURNS TABLE (
    membership_id UUID,
    package_name TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        mp.name,
        m.start_date,
        m.end_date,
        m.is_active
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.user_id = user_uuid
    AND m.is_active = true
    ORDER BY m.end_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Δημιουργία view που δουλεύει με την υπάρχουσα δομή
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
    m.start_date,
    m.end_date,
    m.is_active,
    CASE 
        WHEN m.end_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN m.end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'EXPIRING_SOON'
        ELSE 'ACTIVE'
    END as expiration_status,
    m.created_at
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
ORDER BY m.end_date DESC;

-- 4. Δημιουργία indexes για βελτιστοποίηση
SELECT 'Creating indexes...' as step;

CREATE INDEX IF NOT EXISTS idx_memberships_is_active ON memberships(is_active);
CREATE INDEX IF NOT EXISTS idx_memberships_expiration ON memberships(is_active, end_date) WHERE is_active = true;

-- 5. Δημιουργία RLS policies (αν δεν υπάρχουν)
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

-- 6. Δημιουργία triggers
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

-- 7. Test functions
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

-- 8. Έλεγχος ότι όλα δουλεύουν
SELECT 'Final verification...' as step;

-- Έλεγχος ότι όλα τα απαραίτητα στοιχεία υπάρχουν
DO $$
DECLARE
    verification_passed BOOLEAN := TRUE;
BEGIN
    -- Έλεγχος columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active') THEN
        RAISE NOTICE 'FAILED: is_active column missing';
        verification_passed := FALSE;
    ELSE
        RAISE NOTICE 'PASSED: is_active column exists';
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

-- 9. Εμφάνιση στατιστικών
SELECT 'Final statistics...' as step;

SELECT 
    'Total memberships:' as stat,
    COUNT(*) as count
FROM memberships;

SELECT 
    'Active memberships:' as stat,
    COUNT(*) as count
FROM memberships 
WHERE is_active = true;

SELECT 
    'Expired memberships:' as stat,
    COUNT(*) as count
FROM memberships 
WHERE is_active = false;

SELECT 'COMPLETION: Membership system setup completed successfully!' as final_status;
