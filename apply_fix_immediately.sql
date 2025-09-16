-- IMMEDIATE FIX: Apply the corrected safe function and fix existing profiles
-- This script will fix both the function and existing data

-- 1. First, fix the create_user_profile_safe function
CREATE OR REPLACE FUNCTION public.create_user_profile_safe(
    p_user_id uuid,
    p_email text DEFAULT NULL,
    p_first_name text DEFAULT 'User',
    p_last_name text DEFAULT '',
    p_phone text DEFAULT NULL,
    p_language text DEFAULT 'el'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_profile json;
    actual_email text;
    actual_first_name text;
    actual_last_name text;
    actual_phone text;
    auth_user_record record;
BEGIN
    -- Get the actual user data from auth.users
    SELECT 
        email,
        raw_user_meta_data->>'first_name' as first_name,
        raw_user_meta_data->>'last_name' as last_name,
        raw_user_meta_data->>'phone' as phone
    INTO auth_user_record
    FROM auth.users 
    WHERE id = p_user_id;

    -- Use actual data from auth.users if available, otherwise use provided values
    actual_email := COALESCE(auth_user_record.email, p_email, 'unknown@example.com');
    actual_first_name := COALESCE(auth_user_record.first_name, p_first_name, 'User');
    actual_last_name := COALESCE(auth_user_record.last_name, p_last_name, '');
    actual_phone := COALESCE(auth_user_record.phone, p_phone, NULL);

    -- Try to insert the new profile
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
    );

    -- Return the created profile
    SELECT to_json(up.*) INTO result_profile
    FROM public.user_profiles up
    WHERE up.user_id = p_user_id;

    RETURN result_profile;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, return it
        SELECT to_json(up.*) INTO result_profile
        FROM public.user_profiles up
        WHERE up.user_id = p_user_id;
        
        RETURN result_profile;
    WHEN OTHERS THEN
        -- Return error information
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM,
            'detail', SQLSTATE
        );
END;
$$;

-- 2. Fix existing profiles with correct data from auth.users
UPDATE public.user_profiles 
SET 
    email = COALESCE(auth_users.email, user_profiles.email),
    first_name = COALESCE(auth_users.raw_user_meta_data->>'first_name', user_profiles.first_name),
    last_name = COALESCE(auth_users.raw_user_meta_data->>'last_name', user_profiles.last_name),
    phone = COALESCE(auth_users.raw_user_meta_data->>'phone', user_profiles.phone),
    updated_at = NOW()
FROM auth.users as auth_users
WHERE 
    public.user_profiles.user_id = auth_users.id
    AND (
        public.user_profiles.email = 'unknown@example.com' 
        OR public.user_profiles.first_name = 'User'
        OR public.user_profiles.last_name = ''
    )
    AND auth_users.email IS NOT NULL;

-- 3. Show the results
SELECT 
    'Fixed profiles:' as status,
    COUNT(*) as count
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE up.email != 'unknown@example.com' AND up.first_name != 'User';

-- 4. Show any remaining issues
SELECT 
    'Remaining issues:' as status,
    COUNT(*) as count
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE up.email = 'unknown@example.com' OR up.first_name = 'User';
