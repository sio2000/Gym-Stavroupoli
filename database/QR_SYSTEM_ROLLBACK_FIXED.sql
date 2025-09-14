-- QR System Rollback Script - FIXED VERSION
-- Feature Flag: FEATURE_QR_SYSTEM
-- Version: 1.0.1
-- WARNING: This will completely remove the QR system and all related data

-- =============================================
-- BACKUP INSTRUCTIONS (RUN BEFORE ROLLBACK)
-- =============================================
-- 1. Create backup: pg_dump -h your-host -U your-user -d your-db > backup_before_qr_rollback.sql
-- 2. Export QR data if needed: 
--    SELECT * FROM qr_codes;
--    SELECT * FROM scan_audit_logs;
-- 3. Test rollback on staging environment first

-- =============================================
-- ROLLBACK 1: DISABLE FEATURE FLAG (IF EXISTS)
-- =============================================
-- Check if feature_flags table exists before trying to update
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
        UPDATE feature_flags 
        SET is_enabled = false, updated_at = NOW()
        WHERE name = 'FEATURE_QR_SYSTEM';
    END IF;
END $$;

-- =============================================
-- ROLLBACK 2: DROP TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON qr_codes;
DROP TRIGGER IF EXISTS update_secretaries_updated_at ON secretaries;

-- =============================================
-- ROLLBACK 3: DROP FUNCTIONS
-- =============================================
DROP FUNCTION IF EXISTS update_qr_scan_info(UUID);
DROP FUNCTION IF EXISTS validate_qr_token(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS generate_qr_token(UUID, UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- =============================================
-- ROLLBACK 4: DROP RLS POLICIES
-- =============================================

-- Drop QR codes policies
DROP POLICY IF EXISTS "Users can view own QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Admins can manage all QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Trainers can manage all QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Secretaries can read QR codes" ON qr_codes;

-- Drop scan audit logs policies
DROP POLICY IF EXISTS "Secretaries can insert audit logs" ON scan_audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON scan_audit_logs;
DROP POLICY IF EXISTS "Secretaries can view own audit logs" ON scan_audit_logs;

-- =============================================
-- ROLLBACK 5: DROP TABLES (IN ORDER)
-- =============================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS scan_audit_logs CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS secretaries CASCADE;

-- Note: feature_flags table is kept as it might be used by other features

-- =============================================
-- ROLLBACK 6: VERIFICATION
-- =============================================

-- Verify tables are dropped
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('qr_codes', 'secretaries', 'scan_audit_logs');

-- Should return empty result

-- Verify feature flag is disabled (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
        PERFORM name, is_enabled FROM feature_flags WHERE name = 'FEATURE_QR_SYSTEM';
    END IF;
END $$;

-- =============================================
-- ROLLBACK 7: CLEANUP (OPTIONAL)
-- =============================================

-- If you want to completely remove the feature flag
-- DELETE FROM feature_flags WHERE name = 'FEATURE_QR_SYSTEM';

-- =============================================
-- POST-ROLLBACK VERIFICATION
-- =============================================

-- 1. Verify no QR-related tables exist
-- 2. Verify no QR-related functions exist
-- 3. Verify feature flag is disabled (if table exists)
-- 4. Test existing functionality (user auth, bookings, etc.)
-- 5. Check application logs for any errors
-- 6. Verify no broken references in application code
