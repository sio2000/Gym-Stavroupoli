-- Check QR System Status
-- This script checks the current status of the QR system

-- Check if feature flag exists and is enabled
SELECT 'Feature Flag Status:' as check_type;
SELECT 
    name,
    is_enabled,
    description,
    created_at,
    updated_at
FROM feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';

-- Check if QR system tables exist
SELECT 'QR System Tables:' as check_type;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('qr_codes', 'secretaries', 'scan_audit_logs', 'feature_flags')
ORDER BY table_name;

-- Check if QR system functions exist
SELECT 'QR System Functions:' as check_type;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_qr_token', 'validate_qr_token', 'update_qr_scan_info', 'update_updated_at_column')
ORDER BY routine_name;

-- Check RLS policies
SELECT 'RLS Policies:' as check_type;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('qr_codes', 'scan_audit_logs')
ORDER BY tablename, policyname;

-- Check if there are any QR codes in the system
SELECT 'QR Codes Count:' as check_type;
SELECT COUNT(*) as total_qr_codes FROM qr_codes;

-- Check if there are any secretaries
SELECT 'Secretaries Count:' as check_type;
SELECT COUNT(*) as total_secretaries FROM secretaries;

-- Check if there are any scan audit logs
SELECT 'Scan Audit Logs Count:' as check_type;
SELECT COUNT(*) as total_audit_logs FROM scan_audit_logs;
