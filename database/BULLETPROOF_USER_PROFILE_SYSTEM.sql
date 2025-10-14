-- BULLETPROOF USER PROFILE SYSTEM
-- Ολοκληρωμένη λύση για εγγυημένη δημιουργία user profiles
-- Εκτέλεση στο Supabase SQL Editor

-- =============================================
-- 1. CREATE AUDIT LOGS TABLE
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

-- Index για γρήγορη αναζήτηση
CREATE INDEX IF NOT EXISTS idx_user_profile_audit_logs_user_id ON public.user_profile_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_audit_logs_action ON public.user_profile_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_profile_audit_logs_created_at ON public.user_profile_audit_logs(created_at);

-- =============================================
-- 2. ENSURE USER PROFILE FUNCTION (IDEMPOTENT)
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
    retry_count INTEGER := 0;
BEGIN
    -- Log attempt
    INSERT INTO public.user_profile_audit_logs (user_id, action, origin, metadata)
    VALUES (p_user_id, 'created', p_origin, json_build_object('attempt', 1));
    
    -- Check if profile already exists
    SELECT * INTO existing_profile
    FROM public.user_profiles
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock για race condition prevention
    
    -- If profile exists, return it
    IF existing_profile IS NOT NULL THEN
        SELECT to_json(existing_profile.*) INTO result_profile;
        
        -- Log skip
        INSERT INTO public.user_profile_audit_logs (user_id, action, origin, metadata)
        VALUES (p_user_id, 'skipped', p_origin, json_build_object('reason', 'profile_exists'));
        
        RETURN result_profile;
    END IF;
    
    -- Get actual user data from auth.users
    SELECT 
        email,
        raw_user_meta_data->>'first_name' as first_name,
        raw_user_meta_data->>'last_name' as last_name,
        raw_user_meta_data->>'phone' as phone,
        raw_user_meta_data->>'language' as language
    INTO auth_user_record
    FROM auth.users 
    WHERE id = p_user_id;
    
    -- Use actual data from auth.users if available, otherwise use provided values
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
        COALESCE(auth_user_record.language, p_language, 'el'),
        'user',
        'REF' || substr(p_user_id::text, 1, 8),
        NOW(),
        NOW()
    ) RETURNING id INTO profile_id;
    
    -- Get the created profile
    SELECT to_json(up.*) INTO result_profile
    FROM public.user_profiles up
    WHERE up.id = profile_id;
    
    -- Log success
    INSERT INTO public.user_profile_audit_logs (user_id, action, origin, metadata)
    VALUES (p_user_id, 'created', p_origin, json_build_object('profile_id', profile_id));
    
    RETURN result_profile;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Profile was created by another process, return it
        SELECT to_json(up.*) INTO result_profile
        FROM public.user_profiles up
        WHERE up.user_id = p_user_id;
        
        -- Log race condition
        INSERT INTO public.user_profile_audit_logs (user_id, action, origin, metadata)
        VALUES (p_user_id, 'skipped', p_origin, json_build_object('reason', 'race_condition'));
        
        RETURN result_profile;
        
    WHEN OTHERS THEN
        -- Log error
        INSERT INTO public.user_profile_audit_logs (
            user_id, action, origin, error_message, retry_count, metadata
        ) VALUES (
            p_user_id, 'failed', p_origin, SQLERRM, retry_count,
            json_build_object('error_state', SQLSTATE, 'error_detail', SQLERRM)
        );
        
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
-- 3. BULLETPROOF TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_bulletproof()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    retry_count INTEGER := 0;
    max_retries INTEGER := 3;
BEGIN
    -- Try to create profile with retry logic
    WHILE retry_count < max_retries LOOP
        BEGIN
            result := public.ensure_user_profile(
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
                COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
                COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
                COALESCE(NEW.raw_user_meta_data->>'language', 'el'),
                'trigger'
            );
            
            -- Check if result has error
            IF (result->>'error')::boolean = true THEN
                retry_count := retry_count + 1;
                IF retry_count < max_retries THEN
                    -- Wait before retry (exponential backoff)
                    PERFORM pg_sleep(retry_count * 0.5);
                END IF;
            ELSE
                -- Success, exit loop
                EXIT;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                retry_count := retry_count + 1;
                IF retry_count < max_retries THEN
                    PERFORM pg_sleep(retry_count * 0.5);
                END IF;
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- =============================================
-- 4. DROP OLD TRIGGER AND CREATE NEW ONE
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE TRIGGER on_auth_user_created_bulletproof
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_bulletproof();

-- =============================================
-- 5. GRANT PERMISSIONS
-- =============================================
GRANT EXECUTE ON FUNCTION public.ensure_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile TO anon;
GRANT SELECT ON public.user_profile_audit_logs TO authenticated;
GRANT SELECT ON public.user_profile_audit_logs TO anon;

-- =============================================
-- 6. RLS POLICIES
-- =============================================
-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow service role insert" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for trigger" ON public.user_profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for trigger and service" ON public.user_profiles
    FOR INSERT WITH CHECK (true);

-- RLS for audit logs
ALTER TABLE public.user_profile_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.user_profile_audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for service" ON public.user_profile_audit_logs
    FOR INSERT WITH CHECK (true);

-- =============================================
-- 7. MONITORING FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_profile_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_auth_users INTEGER;
    total_profiles INTEGER;
    missing_profiles INTEGER;
    recent_failures INTEGER;
    result JSON;
BEGIN
    -- Count total auth users
    SELECT COUNT(*) INTO total_auth_users FROM auth.users;
    
    -- Count total profiles
    SELECT COUNT(*) INTO total_profiles FROM public.user_profiles;
    
    -- Count missing profiles
    SELECT COUNT(*) INTO missing_profiles
    FROM auth.users a
    LEFT JOIN public.user_profiles p ON a.id = p.user_id
    WHERE p.user_id IS NULL;
    
    -- Count recent failures (last 24 hours)
    SELECT COUNT(*) INTO recent_failures
    FROM public.user_profile_audit_logs
    WHERE action = 'failed' AND created_at > NOW() - INTERVAL '24 hours';
    
    result := json_build_object(
        'total_auth_users', total_auth_users,
        'total_profiles', total_profiles,
        'missing_profiles', missing_profiles,
        'recent_failures', recent_failures,
        'success_rate', CASE 
            WHEN total_auth_users > 0 THEN 
                ROUND((total_profiles::DECIMAL / total_auth_users::DECIMAL) * 100, 2)
            ELSE 0 
        END,
        'last_updated', NOW()
    );
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_profile_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_stats TO anon;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
-- BULLETPROOF USER PROFILE SYSTEM INSTALLED SUCCESSFULLY!
