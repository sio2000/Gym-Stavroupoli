-- =====================================================
-- EMERGENCY FIX: MINIMAL TRIGGER WITHOUT AUDIT LOGGING
-- =====================================================
-- This version removes the audit logging to isolate the auth error

-- 1. Drop the problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created_bulletproof ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_bulletproof();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create minimal trigger function WITHOUT audit logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
    v_language TEXT;
    v_phone TEXT;
BEGIN
    -- Just use the data passed in
    v_user_id := NEW.id;
    v_email := NEW.email;
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'User');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NULL);
    v_language := COALESCE(NEW.raw_user_meta_data->>'language', 'el');
    
    -- Try to insert profile, but don't fail if it already exists
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
        v_user_id,
        v_email,
        v_first_name,
        v_last_name,
        v_phone,
        v_language,
        'user',
        'REF' || substr(v_user_id::text, 1, 8),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    -- Log to a temp table instead, or just suppress
    -- Don't let this trigger fail the auth process
    RETURN NEW;
END;
$$;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role, postgres;

-- 4. Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Verify the function and trigger exist
SELECT 'Function handle_new_user exists' as status FROM pg_proc WHERE proname = 'handle_new_user';
SELECT 'Trigger on_auth_user_created exists' as status FROM pg_trigger WHERE tgname = 'on_auth_user_created';
