-- SIMPLE BULLETPROOF USER PROFILE SYSTEM
-- Απλοποιημένη έκδοση για εύκολη εκτέλεση

-- 1. Create audit logs table
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

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_user_profile_audit_logs_user_id ON public.user_profile_audit_logs(user_id);

-- 3. Drop old trigger and function (with CASCADE to handle dependencies)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_bulletproof ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_bulletproof() CASCADE;

-- 4. Create bulletproof function
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

-- 5. Create simple trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_bulletproof()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Try to create profile
    result := public.ensure_user_profile(
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        COALESCE(NEW.raw_user_meta_data->>'language', 'el'),
        'trigger'
    );
    
    RETURN NEW;
END;
$$;

-- 6. Create trigger
CREATE TRIGGER on_auth_user_created_bulletproof
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_bulletproof();

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION public.ensure_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile TO anon;

-- 8. RLS Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for trigger" ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for trigger" ON public.user_profiles
    FOR INSERT WITH CHECK (true);

-- 9. Enable RLS for audit logs
ALTER TABLE public.user_profile_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for audit logs" ON public.user_profile_audit_logs
    FOR INSERT WITH CHECK (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'BULLETPROOF USER PROFILE SYSTEM INSTALLED SUCCESSFULLY!';
END $$;
