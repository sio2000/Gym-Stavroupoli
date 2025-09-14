-- Clear old QR codes that don't have category in token
-- This script removes old QR codes and allows creation of new ones with proper categories

-- =============================================
-- STEP 1: DELETE OLD QR CODES
-- =============================================
-- Delete all existing QR codes to start fresh
DELETE FROM qr_codes;

-- =============================================
-- STEP 2: DELETE OLD SCAN AUDIT LOGS
-- =============================================
-- Delete scan audit logs related to old QR codes
DELETE FROM scan_audit_logs;

-- =============================================
-- STEP 3: VERIFY CLEANUP
-- =============================================
-- Check if tables are empty
SELECT 'QR codes count:' as status, COUNT(*) as count FROM qr_codes;
SELECT 'Scan audit logs count:' as status, COUNT(*) as count FROM scan_audit_logs;

-- Success message
SELECT 'Old QR codes cleared successfully! You can now create new QR codes with proper categories.' as result;
