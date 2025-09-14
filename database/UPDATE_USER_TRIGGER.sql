/* UPDATE USER TRIGGER - ΕΝΗΜΕΡΩΣΗ TRIGGER ΓΙΑ ΤΗΛΕΦΩΝΟ
   Εκτέλεση στο Supabase SQL Editor */

/* Drop existing trigger and function */
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

/* Create updated function that includes phone */
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert into user_profiles table with phone
    INSERT INTO public.user_profiles (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        role,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        'user',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING; -- Avoid conflicts if profile already exists
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$;

/* Create the trigger */
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

/* Test the trigger */
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'phone-test@freegym.gr',
    crypt('test123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Phone", "last_name": "Test", "phone": "+306912345678"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

/* Check if it worked */
SELECT 
    'Phone Test Result' as test_name,
    u.email,
    up.first_name,
    up.last_name,
    up.phone,
    up.role,
    up.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'phone-test@freegym.gr';

/* Success message */
SELECT 'User trigger updated with phone support!' as message;
