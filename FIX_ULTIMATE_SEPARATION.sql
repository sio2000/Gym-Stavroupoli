-- FIX ULTIMATE SEPARATION - Διόρθωση διαχωρισμού Ultimate συνδρομών
-- Αυτό το script δημιουργεί ξεχωριστό πίνακα για Ultimate συνδρομές
-- ώστε να μην επηρεάζονται τα κανονικά αιτήματα

-- ========================================
-- ΒΗΜΑ 1: ΔΗΜΙΟΥΡΓΙΑ ΠΙΝΑΚΑ ULTIMATE MEMBERSHIP REQUESTS
-- ========================================

-- Δημιουργία πίνακα για Ultimate συνδρομές με ξεχωριστά πεδία κλειδώματος
CREATE TABLE IF NOT EXISTS ultimate_membership_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES membership_packages(id),
    duration_type VARCHAR(50) NOT NULL,
    requested_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejected_reason TEXT,
    
    -- Δόσεις
    has_installments BOOLEAN DEFAULT false,
    installment_1_amount DECIMAL(10,2),
    installment_2_amount DECIMAL(10,2),
    installment_3_amount DECIMAL(10,2),
    installment_1_payment_method VARCHAR(50),
    installment_2_payment_method VARCHAR(50),
    installment_3_payment_method VARCHAR(50),
    installment_1_due_date TIMESTAMPTZ,
    installment_2_due_date TIMESTAMPTZ,
    installment_3_due_date TIMESTAMPTZ,
    
    -- Κατάσταση πληρωμών
    installment_1_paid BOOLEAN DEFAULT false,
    installment_2_paid BOOLEAN DEFAULT false,
    installment_3_paid BOOLEAN DEFAULT false,
    installment_1_paid_at TIMESTAMPTZ,
    installment_2_paid_at TIMESTAMPTZ,
    installment_3_paid_at TIMESTAMPTZ,
    all_installments_paid BOOLEAN DEFAULT false,
    installments_completed_at TIMESTAMPTZ,
    
    -- Κλειδώματα (ξεχωριστά για κάθε Ultimate αίτημα)
    installment_1_locked BOOLEAN DEFAULT false,
    installment_2_locked BOOLEAN DEFAULT false,
    installment_3_locked BOOLEAN DEFAULT false,
    
    -- Διαγραφή 3ης δόσης (ξεχωριστά για κάθε Ultimate αίτημα)
    third_installment_deleted BOOLEAN DEFAULT false,
    third_installment_deleted_at TIMESTAMPTZ,
    third_installment_deleted_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Δημιουργία indexes για καλύτερη απόδοση
CREATE INDEX IF NOT EXISTS idx_ultimate_requests_user_id ON ultimate_membership_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ultimate_requests_status ON ultimate_membership_requests(status);
CREATE INDEX IF NOT EXISTS idx_ultimate_requests_created_at ON ultimate_membership_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_ultimate_requests_has_installments ON ultimate_membership_requests(has_installments);

-- ========================================
-- ΒΗΜΑ 2: ΕΝΕΡΓΟΠΟΙΗΣΗ RLS
-- ========================================

ALTER TABLE ultimate_membership_requests ENABLE ROW LEVEL SECURITY;

-- Policy για admins/secretaries
CREATE POLICY "Admins can manage ultimate requests" ON ultimate_membership_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'secretary')
        )
    );

-- Policy για χρήστες να βλέπουν τα δικά τους αιτήματα
CREATE POLICY "Users can view their own ultimate requests" ON ultimate_membership_requests
    FOR SELECT USING (user_id = auth.uid());

-- ========================================
-- ΒΗΜΑ 3: ΔΗΜΙΟΥΡΓΙΑ ΣΥΝΑΡΤΗΣΕΩΝ ΓΙΑ ULTIMATE
-- ========================================

-- Συνάρτηση κλειδώματος δόσης για Ultimate
CREATE OR REPLACE FUNCTION lock_ultimate_installment(
    p_request_id UUID,
    p_installment_number INTEGER,
    p_locked_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_field_name TEXT;
    v_sql TEXT;
BEGIN
    -- Επικύρωση αριθμού δόσης
    IF p_installment_number NOT IN (1, 2, 3) THEN
        RAISE EXCEPTION 'Invalid installment number: %. Must be 1, 2, or 3', p_installment_number;
    END IF;

    -- Ορισμός ονόματος πεδίου
    v_field_name := 'installment_' || p_installment_number || '_locked';

    -- Ενημέρωση πίνακα ultimate_membership_requests
    v_sql := format('UPDATE ultimate_membership_requests SET %I = TRUE WHERE id = $1', v_field_name);
    EXECUTE v_sql USING p_request_id;

    RETURN TRUE;
END;
$$;

-- Συνάρτηση ξεκλειδώματος δόσης για Ultimate
CREATE OR REPLACE FUNCTION unlock_ultimate_installment(
    p_request_id UUID,
    p_installment_number INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_field_name TEXT;
    v_sql TEXT;
BEGIN
    -- Επικύρωση αριθμού δόσης
    IF p_installment_number NOT IN (1, 2, 3) THEN
        RAISE EXCEPTION 'Invalid installment number: %. Must be 1, 2, or 3', p_installment_number;
    END IF;

    -- Ορισμός ονόματος πεδίου
    v_field_name := 'installment_' || p_installment_number || '_locked';

    -- Ενημέρωση πίνακα ultimate_membership_requests
    v_sql := format('UPDATE ultimate_membership_requests SET %I = FALSE WHERE id = $1', v_field_name);
    EXECUTE v_sql USING p_request_id;

    RETURN TRUE;
END;
$$;

-- Συνάρτηση διαγραφής 3ης δόσης για Ultimate
CREATE OR REPLACE FUNCTION delete_ultimate_third_installment(
    p_request_id UUID,
    p_deleted_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ενημέρωση πίνακα ultimate_membership_requests
    UPDATE ultimate_membership_requests 
    SET 
        installment_3_locked = TRUE,
        third_installment_deleted = TRUE,
        third_installment_deleted_at = NOW(),
        third_installment_deleted_by = p_deleted_by
    WHERE id = p_request_id;

    RETURN TRUE;
END;
$$;

-- Συνάρτηση ελέγχου κλειδώματος δόσης για Ultimate
CREATE OR REPLACE FUNCTION is_ultimate_installment_locked(
    p_request_id UUID,
    p_installment_number INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_field_name TEXT;
    v_sql TEXT;
    v_result BOOLEAN;
BEGIN
    -- Επικύρωση αριθμού δόσης
    IF p_installment_number NOT IN (1, 2, 3) THEN
        RAISE EXCEPTION 'Invalid installment number: %. Must be 1, 2, or 3', p_installment_number;
    END IF;

    -- Ορισμός ονόματος πεδίου
    v_field_name := 'installment_' || p_installment_number || '_locked';

    -- Έλεγχος πίνακα ultimate_membership_requests
    v_sql := format('SELECT %I FROM ultimate_membership_requests WHERE id = $1', v_field_name);
    EXECUTE v_sql INTO v_result USING p_request_id;

    RETURN COALESCE(v_result, FALSE);
END;
$$;

-- ========================================
-- ΒΗΜΑ 4: ΜΕΤΑΦΟΡΑ ΥΠΑΡΧΟΝΤΩΝ ULTIMATE ΑΙΤΗΜΑΤΩΝ
-- ========================================

-- Μεταφορά υπαρχόντων Ultimate αιτημάτων στο νέο πίνακα
INSERT INTO ultimate_membership_requests (
    id,
    user_id,
    package_id,
    duration_type,
    requested_price,
    status,
    approved_by,
    approved_at,
    rejected_reason,
    has_installments,
    installment_1_amount,
    installment_2_amount,
    installment_3_amount,
    installment_1_payment_method,
    installment_2_payment_method,
    installment_3_payment_method,
    installment_1_due_date,
    installment_2_due_date,
    installment_3_due_date,
    installment_1_paid,
    installment_2_paid,
    installment_3_paid,
    installment_1_paid_at,
    installment_2_paid_at,
    installment_3_paid_at,
    all_installments_paid,
    installments_completed_at,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted,
    third_installment_deleted_at,
    third_installment_deleted_by,
    created_at,
    updated_at
)
SELECT 
    mr.id,
    mr.user_id,
    mr.package_id,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.approved_by,
    mr.approved_at,
    mr.rejected_reason,
    mr.has_installments,
    mr.installment_1_amount,
    mr.installment_2_amount,
    mr.installment_3_amount,
    mr.installment_1_payment_method,
    mr.installment_2_payment_method,
    mr.installment_3_payment_method,
    mr.installment_1_due_date,
    mr.installment_2_due_date,
    mr.installment_3_due_date,
    mr.installment_1_paid,
    mr.installment_2_paid,
    mr.installment_3_paid,
    mr.installment_1_paid_at,
    mr.installment_2_paid_at,
    mr.installment_3_paid_at,
    mr.all_installments_paid,
    mr.installments_completed_at,
    mr.installment_1_locked,
    mr.installment_2_locked,
    mr.installment_3_locked,
    mr.third_installment_deleted,
    mr.third_installment_deleted_at,
    mr.third_installment_deleted_by,
    mr.created_at,
    mr.updated_at
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate' AND mr.has_installments = true;

-- ========================================
-- ΒΗΜΑ 5: ΔΗΜΙΟΥΡΓΙΑ VIEW ΓΙΑ ΣΥΝΔΙΑΣΜΟ
-- ========================================

-- View που συνδυάζει κανονικά αιτήματα και Ultimate αιτήματα
CREATE OR REPLACE VIEW all_membership_requests AS
SELECT 
    'regular' as request_type,
    id,
    user_id,
    package_id,
    duration_type,
    requested_price,
    status,
    approved_by,
    approved_at,
    rejected_reason,
    has_installments,
    installment_1_amount,
    installment_2_amount,
    installment_3_amount,
    installment_1_payment_method,
    installment_2_payment_method,
    installment_3_payment_method,
    installment_1_due_date,
    installment_2_due_date,
    installment_3_due_date,
    installment_1_paid,
    installment_2_paid,
    installment_3_paid,
    installment_1_paid_at,
    installment_2_paid_at,
    installment_3_paid_at,
    all_installments_paid,
    installments_completed_at,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted,
    third_installment_deleted_at,
    third_installment_deleted_by,
    created_at,
    updated_at
FROM membership_requests
WHERE has_installments = false OR package_id NOT IN (
    SELECT id FROM membership_packages WHERE name = 'Ultimate'
)

UNION ALL

SELECT 
    'ultimate' as request_type,
    id,
    user_id,
    package_id,
    duration_type,
    requested_price,
    status,
    approved_by,
    approved_at,
    rejected_reason,
    has_installments,
    installment_1_amount,
    installment_2_amount,
    installment_3_amount,
    installment_1_payment_method,
    installment_2_payment_method,
    installment_3_payment_method,
    installment_1_due_date,
    installment_2_due_date,
    installment_3_due_date,
    installment_1_paid,
    installment_2_paid,
    installment_3_paid,
    installment_1_paid_at,
    installment_2_paid_at,
    installment_3_paid_at,
    all_installments_paid,
    installments_completed_at,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted,
    third_installment_deleted_at,
    third_installment_deleted_by,
    created_at,
    updated_at
FROM ultimate_membership_requests;

-- ========================================
-- ΒΗΜΑ 6: ΔΗΜΙΟΥΡΓΙΑ TRIGGER ΓΙΑ ΑΥΤΟΜΑΤΗ ΕΝΗΜΕΡΩΣΗ
-- ========================================

-- Trigger για ενημέρωση updated_at
CREATE OR REPLACE FUNCTION update_ultimate_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ultimate_requests_updated_at
    BEFORE UPDATE ON ultimate_membership_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_ultimate_requests_updated_at();

-- ========================================
-- ΒΗΜΑ 7: ΔΙΑΔΟΣΗ ΔΙΚΑΙΩΜΑΤΩΝ
-- ========================================

-- Διάδοση δικαιωμάτων για τις νέες συναρτήσεις
GRANT EXECUTE ON FUNCTION lock_ultimate_installment(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_ultimate_installment(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_ultimate_third_installment(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_ultimate_installment_locked(UUID, INTEGER) TO authenticated;

-- Διάδοση δικαιωμάτων για τον νέο πίνακα
GRANT ALL ON ultimate_membership_requests TO authenticated;
GRANT ALL ON all_membership_requests TO authenticated;

-- ========================================
-- ΒΗΜΑ 8: ΕΠΑΛΗΘΕΥΣΗ
-- ========================================

-- Εμφάνιση αποτελεσμάτων
SELECT 'Ultimate separation fix completed successfully!' as status;

-- Εμφάνιση αριθμού μεταφερθέντων αιτημάτων
SELECT 
    'Transferred Ultimate requests:' as info,
    COUNT(*) as count
FROM ultimate_membership_requests;

-- Εμφάνιση δομής νέου πίνακα
SELECT 
    'Ultimate table structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ultimate_membership_requests'
ORDER BY ordinal_position;




