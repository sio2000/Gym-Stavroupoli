-- Enable QR System Feature Flag - FINAL
-- This script ensures the QR system feature flag exists and is enabled

-- ========================================
-- PHASE 1: ENSURE FEATURE FLAG EXISTS
-- ========================================

SELECT 'PHASE 1: Ensuring FEATURE_QR_SYSTEM flag exists...' as phase;

-- Create feature flags table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    is_enabled boolean NOT NULL DEFAULT false,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL
);

-- Insert or update the QR system feature flag
INSERT INTO public.feature_flags (name, is_enabled, description) VALUES 
('FEATURE_QR_SYSTEM', true, 'QR Code entrance/exit system')
ON CONFLICT (name) DO UPDATE SET 
    is_enabled = true, 
    updated_at = now(),
    description = EXCLUDED.description;

-- ========================================
-- PHASE 2: VERIFY FEATURE FLAG
-- ========================================

SELECT 'PHASE 2: Verifying feature flag...' as phase;

SELECT 
    name,
    is_enabled,
    description,
    updated_at
FROM public.feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';

-- ========================================
-- PHASE 3: CHECK QR SYSTEM TABLES
-- ========================================

SELECT 'PHASE 3: Checking QR system tables...' as phase;

-- Check if qr_codes table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'qr_codes'
) as qr_codes_table_exists;

-- Check if scan_audit_logs table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'scan_audit_logs'
) as scan_audit_logs_table_exists;

-- ========================================
-- PHASE 4: SUCCESS MESSAGE
-- ========================================

SELECT 'PHASE 4: QR System enabled successfully!' as result;
