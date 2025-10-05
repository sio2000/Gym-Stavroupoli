-- SIMPLE ULTIMATE LOCKING SYSTEM - Απλό σύστημα Ultimate κλειδωμάτων
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΔΗΜΙΟΥΡΓΙΑ ΠΙΝΑΚΑ ULTIMATE LOCKS
-- ========================================

-- Δημιουργία πίνακα για Ultimate κλειδώματα
CREATE TABLE IF NOT EXISTS ultimate_installment_locks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    membership_request_id UUID NOT NULL REFERENCES membership_requests(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL CHECK (installment_number IN (1, 2, 3)),
    locked_at TIMESTAMPTZ DEFAULT NOW(),
    locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(membership_request_id, installment_number)
);

-- Δημιουργία indexes
CREATE INDEX IF NOT EXISTS idx_ultimate_locks_request_id ON ultimate_installment_locks(membership_request_id);
CREATE INDEX IF NOT EXISTS idx_ultimate_locks_installment ON ultimate_installment_locks(installment_number);
CREATE INDEX IF NOT EXISTS idx_ultimate_locks_locked_by ON ultimate_installment_locks(locked_by);

-- ========================================
-- ΒΗΜΑ 2: ROW LEVEL SECURITY
-- ========================================

-- Ενεργοποίηση RLS
ALTER TABLE ultimate_installment_locks ENABLE ROW LEVEL SECURITY;

-- Policy για admins
CREATE POLICY "Admins can manage ultimate locks" ON ultimate_installment_locks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role IN ('admin', 'super_admin')
        )
    );

-- Policy για secretaries
CREATE POLICY "Secretaries can manage ultimate locks" ON ultimate_installment_locks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'secretary'
        )
    );

-- ========================================
-- ΒΗΜΑ 3: RPC FUNCTIONS
-- ========================================

-- Function για κλείδωμα Ultimate δόσης
CREATE OR REPLACE FUNCTION lock_ultimate_installment(
    p_request_id UUID,
    p_installment_number INTEGER,
    p_locked_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Εισαγωγή ή ενημέρωση κλειδώματος
    INSERT INTO ultimate_installment_locks (
        membership_request_id,
        installment_number,
        locked_by
    )
    VALUES (
        p_request_id,
        p_installment_number,
        p_locked_by
    )
    ON CONFLICT (membership_request_id, installment_number)
    DO UPDATE SET
        locked_at = NOW(),
        locked_by = p_locked_by,
        deleted_at = NULL,
        deleted_by = NULL,
        updated_at = NOW();

    RETURN TRUE;
END;
$$;

-- Function για ξεκλείδωμα Ultimate δόσης
CREATE OR REPLACE FUNCTION unlock_ultimate_installment(
    p_request_id UUID,
    p_installment_number INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Διαγραφή κλειδώματος
    DELETE FROM ultimate_installment_locks
    WHERE membership_request_id = p_request_id
    AND installment_number = p_installment_number;

    RETURN TRUE;
END;
$$;

-- Function για διαγραφή Ultimate 3ης δόσης
CREATE OR REPLACE FUNCTION delete_ultimate_third_installment(
    p_request_id UUID,
    p_deleted_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ενημέρωση ή εισαγωγή διαγραφής 3ης δόσης
    INSERT INTO ultimate_installment_locks (
        membership_request_id,
        installment_number,
        locked_by,
        deleted_at,
        deleted_by
    )
    VALUES (
        p_request_id,
        3,
        p_deleted_by,
        NOW(),
        p_deleted_by
    )
    ON CONFLICT (membership_request_id, installment_number)
    DO UPDATE SET
        deleted_at = NOW(),
        deleted_by = p_deleted_by,
        updated_at = NOW();

    RETURN TRUE;
END;
$$;

-- Function για έλεγχο κλειδώματος Ultimate δόσης
CREATE OR REPLACE FUNCTION is_ultimate_installment_locked(
    p_request_id UUID,
    p_installment_number INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_locked BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM ultimate_installment_locks
        WHERE membership_request_id = p_request_id
        AND installment_number = p_installment_number
        AND deleted_at IS NULL
    ) INTO is_locked;

    RETURN is_locked;
END;
$$;

-- Function για έλεγχο διαγραφής Ultimate 3ης δόσης
CREATE OR REPLACE FUNCTION is_ultimate_third_installment_deleted(
    p_request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_deleted BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM ultimate_installment_locks
        WHERE membership_request_id = p_request_id
        AND installment_number = 3
        AND deleted_at IS NOT NULL
    ) INTO is_deleted;

    RETURN is_deleted;
END;
$$;

-- ========================================
-- ΒΗΜΑ 4: ΜΕΤΕΓΚΑΤΑΣΤΑΣΗ ΥΠΑΡΧΟΝΤΩΝ ΔΕΔΟΜΕΝΩΝ
-- ========================================

-- Μετεγκατάσταση υπαρχόντων Ultimate κλειδωμάτων (μόνο τα flags, όχι locked_by)
INSERT INTO ultimate_installment_locks (
    membership_request_id,
    installment_number,
    locked_by,
    deleted_at,
    deleted_by
)
SELECT 
    mr.id,
    1,
    NULL,
    NULL,
    NULL
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate'
AND mr.installment_1_locked = TRUE
ON CONFLICT (membership_request_id, installment_number) DO NOTHING;

INSERT INTO ultimate_installment_locks (
    membership_request_id,
    installment_number,
    locked_by,
    deleted_at,
    deleted_by
)
SELECT 
    mr.id,
    2,
    NULL,
    NULL,
    NULL
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate'
AND mr.installment_2_locked = TRUE
ON CONFLICT (membership_request_id, installment_number) DO NOTHING;

INSERT INTO ultimate_installment_locks (
    membership_request_id,
    installment_number,
    locked_by,
    deleted_at,
    deleted_by
)
SELECT 
    mr.id,
    3,
    NULL,
    CASE WHEN mr.third_installment_deleted = TRUE THEN mr.third_installment_deleted_at ELSE NULL END,
    CASE WHEN mr.third_installment_deleted = TRUE THEN mr.third_installment_deleted_by ELSE NULL END
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate'
AND (mr.installment_3_locked = TRUE OR mr.third_installment_deleted = TRUE)
ON CONFLICT (membership_request_id, installment_number) DO NOTHING;

-- ========================================
-- ΒΗΜΑ 5: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- ========================================

-- Έλεγχος αριθμού μετεγκατασταθέντων εγγραφών
SELECT 
    'Migration results:' as info,
    COUNT(*) as migrated_locks
FROM ultimate_installment_locks;

-- Εμφάνιση μερικών μετεγκατασταθέντων εγγραφών
SELECT 
    'Sample migrated locks:' as info,
    membership_request_id,
    installment_number,
    locked_at,
    deleted_at
FROM ultimate_installment_locks
ORDER BY created_at DESC
LIMIT 5;

SELECT 'Ultimate locking system created successfully!' as status;




