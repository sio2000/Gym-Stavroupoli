-- QR System Rollback Script - ULTRA SIMPLE VERSION
-- Feature Flag: FEATURE_QR_SYSTEM
-- Version: 1.0.5
-- This script safely removes the QR system

-- =============================================
-- STEP 1: DISABLE FEATURE FLAG (IF EXISTS)
-- =============================================
UPDATE feature_flags 
SET is_enabled = false, updated_at = NOW()
WHERE name = 'FEATURE_QR_SYSTEM';

-- =============================================
-- STEP 2: DROP TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON qr_codes;
DROP TRIGGER IF EXISTS update_secretaries_updated_at ON secretaries;

-- =============================================
-- STEP 3: DROP FUNCTIONS
-- =============================================
DROP FUNCTION IF EXISTS update_qr_scan_info(UUID);
DROP FUNCTION IF EXISTS validate_qr_token(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS generate_qr_token(UUID, UUID);

-- =============================================
-- STEP 4: DROP RLS POLICIES
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
-- STEP 5: DROP TABLES (IN REVERSE ORDER)
-- =============================================
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS scan_audit_logs CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS secretaries CASCADE;

-- Note: feature_flags table is kept as it might be used by other features

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

-- Check feature flag status
SELECT 'Feature flag status:' as status;
SELECT name, is_enabled FROM feature_flags WHERE name = 'FEATURE_QR_SYSTEM';

-- Success message
SELECT 'QR System rollback completed successfully!' as result;
