-- COMPLETE MEMBERSHIP SETUP - Πλήρης ρύθμιση συστήματος συνδρομών
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- PHASE 1: PREREQUISITE CHECKS
-- ========================================

SELECT 'PHASE 1: Checking prerequisites...' as phase;

-- Έλεγχος αν υπάρχουν οι απαραίτητοι πίνακες
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Έλεγχος user_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        missing_tables := array_append(missing_tables, 'user_profiles');
    END IF;
    
    -- Έλεγχος membership_packages
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_packages') THEN
        missing_tables := array_append(missing_tables, 'membership_packages');
    END IF;
    
    -- Έλεγχος membership_package_durations
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_package_durations') THEN
        missing_tables := array_append(missing_tables, 'membership_package_durations');
    END IF;
    
    -- Έλεγχος membership_requests
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_requests') THEN
        missing_tables := array_append(missing_tables, 'membership_requests');
    END IF;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required tables: %. Please run CREATE_MEMBERSHIP_SYSTEM_FIXED.sql first.', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'All prerequisite tables exist.';
    END IF;
END $$;

-- ========================================
-- PHASE 2: CREATE MEMBERSHIPS TABLE
-- ========================================

SELECT 'PHASE 2: Creating memberships table...' as phase;

-- Δημιουργία πίνακα memberships για ενεργές συνδρομές
CREATE TABLE IF NOT EXISTS memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES membership_packages(id) ON DELETE CASCADE,
    duration_type TEXT NOT NULL CHECK (duration_type IN ('year', 'semester', 'month', 'lesson')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
    approved_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Δημιουργία indexes για βελτιστοποίηση
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_package_id ON memberships(package_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);
CREATE INDEX IF NOT EXISTS idx_memberships_expiration ON memberships(status, end_date) WHERE status = 'active';

-- ========================================
-- PHASE 3: SETUP RLS POLICIES
-- ========================================

SELECT 'PHASE 3: Setting up RLS policies...' as phase;

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

-- ========================================
-- PHASE 4: CREATE FUNCTIONS
-- ========================================

SELECT 'PHASE 4: Creating functions...' as phase;

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

-- ========================================
-- PHASE 5: CREATE VIEWS
-- ========================================

SELECT 'PHASE 5: Creating views...' as phase;

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

-- ========================================
-- PHASE 6: CREATE TRIGGERS
-- ========================================

SELECT 'PHASE 6: Creating triggers...' as phase;

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

-- Trigger για ενημέρωση QR Codes access
CREATE OR REPLACE FUNCTION update_qr_access_on_membership_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Αν η συνδρομή λήγει, αφαιρούμε την πρόσβαση στα QR Codes
    IF NEW.status = 'expired' AND OLD.status = 'active' THEN
        -- Εδώ μπορούμε να προσθέσουμε λογική για αφαίρεση πρόσβασης
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_qr_access ON memberships;
CREATE TRIGGER trigger_update_qr_access
    AFTER UPDATE ON memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_qr_access_on_membership_change();

-- ========================================
-- PHASE 7: VERIFICATION
-- ========================================

SELECT 'PHASE 7: Verifying setup...' as phase;

-- Έλεγχος ότι όλα τα απαραίτητα στοιχεία υπάρχουν
DO $$
DECLARE
    verification_passed BOOLEAN := TRUE;
BEGIN
    -- Έλεγχος πίνακα
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
        RAISE NOTICE 'FAILED: memberships table missing';
        verification_passed := FALSE;
    ELSE
        RAISE NOTICE 'PASSED: memberships table exists';
    END IF;
    
    -- Έλεγχος functions
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'expire_memberships') THEN
        RAISE NOTICE 'FAILED: expire_memberships function missing';
        verification_passed := FALSE;
    ELSE
        RAISE NOTICE 'PASSED: expire_memberships function exists';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_and_expire_memberships') THEN
        RAISE NOTICE 'FAILED: check_and_expire_memberships function missing';
        verification_passed := FALSE;
    ELSE
        RAISE NOTICE 'PASSED: check_and_expire_memberships function exists';
    END IF;
    
    -- Έλεγχος view
    IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'membership_overview') THEN
        RAISE NOTICE 'FAILED: membership_overview view missing';
        verification_passed := FALSE;
    ELSE
        RAISE NOTICE 'PASSED: membership_overview view exists';
    END IF;
    
    -- Τελικό αποτέλεσμα
    IF verification_passed THEN
        RAISE NOTICE 'SUCCESS: All membership system components created successfully!';
    ELSE
        RAISE EXCEPTION 'FAILED: Some components are missing. Please check the errors above.';
    END IF;
END $$;

-- ========================================
-- PHASE 8: TEST DATA (OPTIONAL)
-- ========================================

SELECT 'PHASE 8: Creating test data (optional)...' as phase;

-- Δημιουργία test membership (αν υπάρχουν δεδομένα)
DO $$
DECLARE
    test_user_id UUID;
    test_package_id UUID;
    test_membership_id UUID;
BEGIN
    -- Βρίσκουμε έναν χρήστη
    SELECT user_id INTO test_user_id FROM user_profiles LIMIT 1;
    
    -- Βρίσκουμε ένα πακέτο
    SELECT id INTO test_package_id FROM membership_packages LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_package_id IS NOT NULL THEN
        -- Δημιουργούμε test membership που λήγει σε 30 ημέρες
        INSERT INTO memberships (user_id, package_id, duration_type, start_date, end_date, status)
        VALUES (
            test_user_id, 
            test_package_id, 
            'month', 
            CURRENT_DATE, 
            CURRENT_DATE + INTERVAL '30 days', 
            'active'
        )
        RETURNING id INTO test_membership_id;
        
        RAISE NOTICE 'Test membership created with ID: %', test_membership_id;
        
        -- Δοκιμάζουμε την function λήξης
        PERFORM check_and_expire_memberships();
        
        -- Ελέγχουμε αν το test membership είναι ακόμα ενεργό
        IF EXISTS (SELECT 1 FROM memberships WHERE id = test_membership_id AND status = 'active') THEN
            RAISE NOTICE 'Test membership is still active (as expected)';
        ELSE
            RAISE NOTICE 'Test membership was expired unexpectedly';
        END IF;
        
        -- Καθαρισμός test data
        DELETE FROM memberships WHERE id = test_membership_id;
        RAISE NOTICE 'Test membership cleaned up';
    ELSE
        RAISE NOTICE 'No test data available - skipping test insertion';
    END IF;
END $$;

-- ========================================
-- COMPLETION
-- ========================================

SELECT 'COMPLETION: Membership system setup completed successfully!' as final_status;

-- Εμφάνιση τελικών στατιστικών
SELECT 
    'Final Statistics:' as info,
    (SELECT COUNT(*) FROM memberships) as total_memberships,
    (SELECT COUNT(*) FROM membership_packages) as total_packages,
    (SELECT COUNT(*) FROM membership_requests) as total_requests;
