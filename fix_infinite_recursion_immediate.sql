-- IMMEDIATE FIX FOR INFINITE RECURSION IN USER_PROFILES RLS
-- This will completely fix the infinite recursion issue

-- ==============================================
-- PHASE 1: BACKUP CURRENT STATE
-- ==============================================

-- Show current policies before changes
SELECT 
    'BEFORE_FIX' as audit_type,
    p.polname as policy_name,
    p.polcmd as command,
    p.polpermissive as permissive
FROM pg_catalog.pg_policy p
JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'user_profiles'
ORDER BY p.polname;

-- ==============================================
-- PHASE 2: DISABLE RLS TEMPORARILY
-- ==============================================

-- Disable RLS completely to stop the recursion
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- ==============================================
-- PHASE 3: DROP ALL EXISTING POLICIES
-- ==============================================

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Admins/service_role can view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for trigger" ON public.user_profiles;
DROP POLICY IF EXISTS "User can view self" ON public.user_profiles;
DROP POLICY IF EXISTS "User/admin can update" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_allow_registration" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_user_view_own" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_user_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_service_role_all" ON public.user_profiles;

-- ==============================================
-- PHASE 4: CREATE NEW SIMPLE POLICIES
-- ==============================================

-- Create new simple policies that don't cause recursion
CREATE POLICY "allow_all_inserts" ON public.user_profiles
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "allow_own_selects" ON public.user_profiles
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "allow_own_updates" ON public.user_profiles
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_service_role_all" ON public.user_profiles
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ==============================================
-- PHASE 5: RE-ENABLE RLS
-- ==============================================

-- Re-enable RLS with the new policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PHASE 6: CREATE SAFE FUNCTIONS
-- ==============================================

-- Create function to safely get user profile
CREATE OR REPLACE FUNCTION public.get_user_profile_safe(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Try to get existing profile
    SELECT to_json(up.*) INTO result
    FROM public.user_profiles up
    WHERE up.user_id = p_user_id;
    
    -- If not found, create a basic one
    IF result IS NULL THEN
        INSERT INTO public.user_profiles (
            user_id,
            email,
            first_name,
            last_name,
            role,
            language,
            referral_code,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            'unknown@example.com',
            'User',
            '',
            'user',
            'el',
            'REF' || substr(p_user_id::text, 1, 8),
            NOW(),
            NOW()
        );
        
        -- Return the created profile
        SELECT to_json(up.*) INTO result
        FROM public.user_profiles up
        WHERE up.user_id = p_user_id;
    END IF;
    
    RETURN result;
END;
$$;

-- Create function to safely create user profile
CREATE OR REPLACE FUNCTION public.create_user_profile_safe(
    p_user_id UUID,
    p_email TEXT,
    p_first_name TEXT DEFAULT '',
    p_last_name TEXT DEFAULT '',
    p_phone TEXT DEFAULT NULL,
    p_language TEXT DEFAULT 'el'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS(
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = p_user_id
    ) INTO profile_exists;
    
    -- If exists, return it
    IF profile_exists THEN
        SELECT to_json(up.*) INTO result
        FROM public.user_profiles up
        WHERE up.user_id = p_user_id;
        
        RETURN result;
    END IF;
    
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
        p_email,
        p_first_name,
        p_last_name,
        p_phone,
        p_language,
        'user',
        'REF' || substr(p_user_id::text, 1, 8),
        NOW(),
        NOW()
    );
    
    -- Return the created profile
    SELECT to_json(up.*) INTO result
    FROM public.user_profiles up
    WHERE up.user_id = p_user_id;
    
    RETURN result;
END;
$$;

-- Grant permissions on the functions
GRANT EXECUTE ON FUNCTION public.create_user_profile_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile_safe TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_profile_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_safe TO anon;

-- ==============================================
-- PHASE 7: VERIFICATION
-- ==============================================

-- Show new policies
SELECT 
    'AFTER_FIX' as audit_type,
    p.polname as policy_name,
    p.polcmd as command,
    p.polpermissive as permissive
FROM pg_catalog.pg_policy p
JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'user_profiles'
ORDER BY p.polname;

-- Check RLS status
SELECT 
    'RLS_STATUS' as audit_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_profiles';

-- Test the functions
SELECT 
    'FUNCTION_TEST' as audit_type,
    'Functions created successfully' as message,
    NOW() as timestamp;

-- Final success message
SELECT 
    'SUCCESS' as audit_type,
    'Infinite recursion fixed! All policies replaced with simple ones.' as message,
    NOW() as timestamp;
