-- Fix the create_user_profile_safe function to use the correct email and name from auth.users
-- when the provided email is 'unknown@example.com'

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

-- Test the function
SELECT public.create_user_profile_safe(
    '00000000-0000-0000-0000-000000000001'::uuid,
    'unknown@example.com',
    'Test',
    'User',
    '1234567890',
    'el'
);
