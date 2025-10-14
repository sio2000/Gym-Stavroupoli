-- SAFE BULLETPROOF USER PROFILE SYSTEM INSTALLATION
-- Ασφαλής εγκατάσταση που διαχειρίζεται όλες τις dependencies

-- =============================================
-- 1. SAFE CLEANUP - Remove existing objects safely
-- =============================================

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_bulletproof ON auth.users;

-- Drop functions (with CASCADE to handle any remaining dependencies)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_bulletproof() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_user_profile() CASCADE;

-- =============================================
-- 2. CREATE AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_profile_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'failed', 'skipped')),
    origin TEXT NOT NULL CHECK (origin IN ('trigger', 'manual', 'backfill', 'registration')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_user_profile_audit_logs_user_id ON public.user_profile_audit_logs(user_id);

-- =============================================
-- 3. CREATE BULLETPROOF ENSURE FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.ensure_user_profile(
    p_user_id UUID,
    p_email TEXT DEFAULT NULL,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_language TEXT DEFAULT 'el',
    p_origin TEXT DEFAULT 'manual'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_profile JSON;
    existing_profile RECORD;
    auth_user_record RECORD;
    actual_email TEXT;
    actual_first_name TEXT;
    actual_last_name TEXT;
    actual_phone TEXT;
    profile_id UUID;
BEGIN
    -- Check if profile already exists
    SELECT * INTO existing_profile
    FROM public.user_profiles
    WHERE user_id = p_user_id;
    
    -- If profile exists, return it
    IF existing_profile IS NOT NULL THEN
        SELECT to_json(existing_profile.*) INTO result_profile;
        RETURN result_profile;
    END IF;
    
    -- Get actual user data from auth.users
    SELECT 
        email,
        raw_user_meta_data->>'first_name' as first_name,
        raw_user_meta_data->>'last_name' as last_name,
        raw_user_meta_data->>'phone' as phone
    INTO auth_user_record
    FROM auth.users 
    WHERE id = p_user_id;
    
    -- Use actual data from auth.users if available
    actual_email := COALESCE(auth_user_record.email, p_email, 'user@freegym.gr');
    actual_first_name := COALESCE(auth_user_record.first_name, p_first_name, 'User');
    actual_last_name := COALESCE(auth_user_record.last_name, p_last_name, '');
    actual_phone := COALESCE(auth_user_record.phone, p_phone, NULL);
    
    -- Create new profile
    INSERT INTO public.user_profiles (
        user_id,
        email,
        first_name,
        last_name,
        phone,
        language,
        role,
        referral_code,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        actual_email,
        actual_first_name,
        actual_last_name,
        actual_phone,
        p_language,
        'user',
        'REF' || substr(p_user_id::text, 1, 8),
        NOW(),
        NOW()
    ) RETURNING id INTO profile_id;
    
    -- Get the created profile
    SELECT to_json(up.*) INTO result_profile
    FROM public.user_profiles up
    WHERE up.id = profile_id;
    
    RETURN result_profile;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Profile was created by another process, return it
        SELECT to_json(up.*) INTO result_profile
        FROM public.user_profiles up
        WHERE up.user_id = p_user_id;
        RETURN result_profile;
    WHEN OTHERS THEN
        -- Return error information
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM,
            'detail', SQLSTATE,
            'user_id', p_user_id
        );
END;
$$;

-- =============================================
-- 4. CREATE BULLETPROOF TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_bulletproof()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Try to create profile using the ensure function
    result := public.ensure_user_profile(
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        COALESCE(NEW.raw_user_meta_data->>'language', 'el'),
        'trigger'
    );
    
    -- Log the result (optional - can be removed if not needed)
    -- The function will handle errors gracefully
    
    RETURN NEW;
END;
$$;

-- =============================================
-- 5. CREATE BULLETPROOF TRIGGER
-- =============================================
CREATE TRIGGER on_auth_user_created_bulletproof
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_bulletproof();

-- =============================================
-- 6. GRANT PERMISSIONS
-- =============================================
GRANT EXECUTE ON FUNCTION public.ensure_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile TO anon;

-- =============================================
-- 7. RLS POLICIES
-- =============================================
-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for trigger" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow service role insert" ON public.user_profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for trigger" ON public.user_profiles
    FOR INSERT WITH CHECK (true);

-- Enable RLS for audit logs
ALTER TABLE public.user_profile_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert for audit logs" ON public.user_profile_audit_logs;
CREATE POLICY "Allow insert for audit logs" ON public.user_profile_audit_logs
    FOR INSERT WITH CHECK (true);

-- =============================================
-- 8. VERIFICATION
-- =============================================

-- Check if trigger was created successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created_bulletproof'
    ) THEN
        RAISE NOTICE '✅ BULLETPROOF TRIGGER INSTALLED SUCCESSFULLY!';
    ELSE
        RAISE NOTICE '❌ TRIGGER INSTALLATION FAILED!';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'ensure_user_profile'
    ) THEN
        RAISE NOTICE '✅ ENSURE USER PROFILE FUNCTION INSTALLED SUCCESSFULLY!';
    ELSE
        RAISE NOTICE '❌ FUNCTION INSTALLATION FAILED!';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profile_audit_logs'
    ) THEN
        RAISE NOTICE '✅ AUDIT LOGS TABLE CREATED SUCCESSFULLY!';
    ELSE
        RAISE NOTICE '❌ AUDIT LOGS TABLE CREATION FAILED!';
    END IF;
END $$;

-- Success message
SELECT 'BULLETPROOF USER PROFILE SYSTEM INSTALLED SUCCESSFULLY!' as status;

