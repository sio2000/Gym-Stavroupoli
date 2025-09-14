-- SETUP AUTO EXPIRATION - Ρύθμιση αυτόματης λήξης συνδρομών
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Δημιουργία function για έλεγχο και λήξη συνδρομών
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
    
    -- Log των αλλαγών
    INSERT INTO audit_logs (action, table_name, details, created_at)
    SELECT 
        'AUTO_EXPIRE',
        'memberships',
        json_build_object(
            'expired_count', COUNT(*),
            'expired_date', CURRENT_DATE
        ),
        NOW()
    FROM memberships 
    WHERE status = 'expired' 
    AND updated_at >= NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- 2. Δημιουργία function για έλεγχο ενεργών συνδρομών χρήστη
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

-- 3. Δημιουργία view για εύκολη παρακολούθηση συνδρομών
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

-- 4. Δημιουργία index για βελτιστοποίηση ερωτημάτων λήξης
CREATE INDEX IF NOT EXISTS idx_memberships_expiration 
ON memberships(status, end_date) 
WHERE status = 'active';

-- 5. Δημιουργία function για στατιστικά συνδρομών
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

-- 6. Δημιουργία trigger για ενημέρωση QR Codes access
CREATE OR REPLACE FUNCTION update_qr_access_on_membership_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Αν η συνδρομή λήγει, αφαιρούμε την πρόσβαση στα QR Codes
    IF NEW.status = 'expired' AND OLD.status = 'active' THEN
        -- Εδώ μπορούμε να προσθέσουμε λογική για αφαίρεση πρόσβασης
        -- π.χ. ενημέρωση user_profiles ή άλλου πίνακα
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_qr_access
    AFTER UPDATE ON memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_qr_access_on_membership_change();

-- 7. Test function για έλεγχο λειτουργίας
CREATE OR REPLACE FUNCTION test_membership_expiration()
RETURNS void AS $$
DECLARE
    test_user_id UUID;
    test_package_id UUID;
    test_membership_id UUID;
BEGIN
    -- Δημιουργία test membership που λήγει σήμερα
    SELECT user_id INTO test_user_id FROM user_profiles LIMIT 1;
    SELECT id INTO test_package_id FROM membership_packages LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_package_id IS NOT NULL THEN
        INSERT INTO memberships (user_id, package_id, duration_type, start_date, end_date, status)
        VALUES (test_user_id, test_package_id, 'lesson', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '1 day', 'active')
        RETURNING id INTO test_membership_id;
        
        -- Εκτέλεση function λήξης
        PERFORM check_and_expire_memberships();
        
        -- Έλεγχος αποτελέσματος
        IF EXISTS (SELECT 1 FROM memberships WHERE id = test_membership_id AND status = 'expired') THEN
            RAISE NOTICE 'Test passed: Membership expired successfully';
        ELSE
            RAISE NOTICE 'Test failed: Membership did not expire';
        END IF;
        
        -- Καθαρισμός test data
        DELETE FROM memberships WHERE id = test_membership_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
