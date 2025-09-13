-- QR System Rollback Script - FINAL SAFE VERSION
-- Feature Flag: FEATURE_QR_SYSTEM
-- Version: 1.0.3
-- This script safely removes the QR system WITHOUT touching existing functions

-- =============================================
-- STEP 1: DISABLE FEATURE FLAG
-- =============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
        UPDATE feature_flags 
        SET is_enabled = false, updated_at = NOW()
        WHERE name = 'FEATURE_QR_SYSTEM';
        RAISE NOTICE 'Feature flag disabled';
    ELSE
        RAISE NOTICE 'Feature flags table does not exist';
    END IF;
END $$;

-- =============================================
-- STEP 2: DROP ONLY QR-RELATED TRIGGERS
-- =============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qr_codes') THEN
        DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON qr_codes;
        RAISE NOTICE 'QR codes trigger dropped';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'secretaries') THEN
        DROP TRIGGER IF EXISTS update_secretaries_updated_at ON secretaries;
        RAISE NOTICE 'Secretaries trigger dropped';
    END IF;
END $$;

-- =============================================
-- STEP 3: DROP ONLY QR-RELATED FUNCTIONS
-- =============================================
DO $$
BEGIN
    -- Only drop QR-specific functions, NOT the shared update_updated_at_column function
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_qr_scan_info') THEN
        DROP FUNCTION IF EXISTS update_qr_scan_info(UUID);
        RAISE NOTICE 'update_qr_scan_info function dropped';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'validate_qr_token') THEN
        DROP FUNCTION IF EXISTS validate_qr_token(TEXT, UUID, UUID);
        RAISE NOTICE 'validate_qr_token function dropped';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_qr_token') THEN
        DROP FUNCTION IF EXISTS generate_qr_token(UUID, UUID);
        RAISE NOTICE 'generate_qr_token function dropped';
    END IF;
    
    -- NOTE: We do NOT drop update_updated_at_column() because it's used by other tables
    RAISE NOTICE 'update_updated_at_column function kept (used by other tables)';
END $$;

-- =============================================
-- STEP 4: DROP RLS POLICIES
-- =============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qr_codes') THEN
        DROP POLICY IF EXISTS "Users can view own QR codes" ON qr_codes;
        DROP POLICY IF EXISTS "Admins can manage all QR codes" ON qr_codes;
        DROP POLICY IF EXISTS "Trainers can manage all QR codes" ON qr_codes;
        DROP POLICY IF EXISTS "Secretaries can read QR codes" ON qr_codes;
        RAISE NOTICE 'QR codes policies dropped';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scan_audit_logs') THEN
        DROP POLICY IF EXISTS "Secretaries can insert audit logs" ON scan_audit_logs;
        DROP POLICY IF EXISTS "Admins can view all audit logs" ON scan_audit_logs;
        DROP POLICY IF EXISTS "Secretaries can view own audit logs" ON scan_audit_logs;
        RAISE NOTICE 'Scan audit logs policies dropped';
    END IF;
END $$;

-- =============================================
-- STEP 5: DROP TABLES (IN REVERSE ORDER)
-- =============================================
DO $$
BEGIN
    -- Drop scan_audit_logs first (has foreign keys)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scan_audit_logs') THEN
        DROP TABLE scan_audit_logs CASCADE;
        RAISE NOTICE 'scan_audit_logs table dropped';
    END IF;
    
    -- Drop qr_codes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qr_codes') THEN
        DROP TABLE qr_codes CASCADE;
        RAISE NOTICE 'qr_codes table dropped';
    END IF;
    
    -- Drop secretaries
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'secretaries') THEN
        DROP TABLE secretaries CASCADE;
        RAISE NOTICE 'secretaries table dropped';
    END IF;
    
    -- Note: feature_flags table is kept as it might be used by other features
    RAISE NOTICE 'feature_flags table kept (may be used by other features)';
END $$;

-- =============================================
-- STEP 6: VERIFICATION
-- =============================================
-- Check if QR-related tables still exist
SELECT 'Remaining QR tables:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('qr_codes', 'secretaries', 'scan_audit_logs')
ORDER BY table_name;

-- Check if QR-related functions still exist
SELECT 'Remaining QR functions:' as status;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_qr_token', 'validate_qr_token', 'update_qr_scan_info')
ORDER BY routine_name;

-- Check if shared function still exists (should be kept)
SELECT 'Shared function status:' as status;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_updated_at_column';

-- Check feature flag status
SELECT 'Feature flag status:' as status;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
        PERFORM name, is_enabled FROM feature_flags WHERE name = 'FEATURE_QR_SYSTEM';
    ELSE
        RAISE NOTICE 'Feature flags table does not exist';
    END IF;
END $$;

-- Success message
SELECT 'QR System rollback completed successfully!' as result;
