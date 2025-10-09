-- Complete QR System Fix
-- This script fixes all issues with the QR system

-- ========================================
-- PHASE 1: ENSURE FEATURE FLAG EXISTS AND IS ENABLED
-- ========================================

SELECT 'PHASE 1: Ensuring FEATURE_QR_SYSTEM flag exists and is enabled...' as phase;

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
-- PHASE 2: FIX RLS POLICIES FOR FEATURE_FLAGS
-- ========================================

SELECT 'PHASE 2: Fixing RLS policies for feature_flags...' as phase;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS feature_flags_select_admin_only ON public.feature_flags;
DROP POLICY IF EXISTS feature_flags_modify_admin_only ON public.feature_flags;

-- Create new policies that allow authenticated users to read feature flags
CREATE POLICY feature_flags_select_authenticated_users ON public.feature_flags
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

-- Keep modify operations admin-only for security
CREATE POLICY feature_flags_modify_admin_only ON public.feature_flags
    FOR ALL USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    ) WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- ========================================
-- PHASE 3: ENSURE QR SYSTEM TABLES EXIST
-- ========================================

SELECT 'PHASE 3: Ensuring QR system tables exist...' as phase;

-- Create qr_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    category text NOT NULL CHECK (category IN ('free_gym', 'pilates', 'personal')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
    qr_token text NOT NULL UNIQUE,
    issued_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    last_scanned_at timestamptz,
    scan_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create scan_audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.scan_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id uuid REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    scan_type text NOT NULL CHECK (scan_type IN ('entrance', 'exit')),
    secretary_id uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    ip_address inet,
    user_agent text,
    scan_result text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on tables
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_audit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PHASE 4: CREATE RLS POLICIES FOR QR TABLES
-- ========================================

SELECT 'PHASE 4: Creating RLS policies for QR tables...' as phase;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS qr_codes_select_own_or_admin ON public.qr_codes;
DROP POLICY IF EXISTS qr_codes_insert_own ON public.qr_codes;
DROP POLICY IF EXISTS qr_codes_update_own ON public.qr_codes;
DROP POLICY IF EXISTS qr_codes_delete_own ON public.qr_codes;

DROP POLICY IF EXISTS scan_audit_logs_select_own_or_admin ON public.scan_audit_logs;
DROP POLICY IF EXISTS scan_audit_logs_insert_admin ON public.scan_audit_logs;

-- Create policies for qr_codes
CREATE POLICY qr_codes_select_own_or_admin ON public.qr_codes
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

CREATE POLICY qr_codes_insert_own ON public.qr_codes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY qr_codes_update_own ON public.qr_codes
    FOR UPDATE USING (
        auth.uid() = user_id
    );

CREATE POLICY qr_codes_delete_own ON public.qr_codes
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Create policies for scan_audit_logs
CREATE POLICY scan_audit_logs_select_own_or_admin ON public.scan_audit_logs
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

CREATE POLICY scan_audit_logs_insert_admin ON public.scan_audit_logs
    FOR INSERT WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- ========================================
-- PHASE 5: CREATE INDEXES FOR PERFORMANCE
-- ========================================

SELECT 'PHASE 5: Creating indexes for performance...' as phase;

-- Create indexes for qr_codes
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON public.qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON public.qr_codes(status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_qr_token ON public.qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_category ON public.qr_codes(category);

-- Create indexes for scan_audit_logs
CREATE INDEX IF NOT EXISTS idx_scan_audit_logs_qr_code_id ON public.scan_audit_logs(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scan_audit_logs_user_id ON public.scan_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_audit_logs_created_at ON public.scan_audit_logs(created_at);

-- ========================================
-- PHASE 6: VERIFICATION
-- ========================================

SELECT 'PHASE 6: Verifying QR system setup...' as phase;

-- Verify feature flag
SELECT 
    'Feature flag status:' as info,
    name,
    is_enabled,
    description
FROM public.feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';

-- Verify tables exist
SELECT 
    'Tables created:' as info,
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('qr_codes', 'scan_audit_logs', 'feature_flags')
ORDER BY table_name;

-- Verify RLS is enabled
SELECT 
    'RLS Status:' as info,
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('qr_codes', 'scan_audit_logs', 'feature_flags')
ORDER BY tablename;

-- ========================================
-- PHASE 7: SUCCESS MESSAGE
-- ========================================

SELECT 'PHASE 7: QR System completely fixed and enabled!' as result;
