-- Safe script to create trainer Kat (handles existing user)
-- Email: kat@freegym.gr
-- Password: trainer123

DO $$
DECLARE
    user_exists boolean;
    profile_exists boolean;
    user_id_val uuid;
BEGIN
    -- Check if user exists in auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'kat@freegym.gr') INTO user_exists;
    
    IF user_exists THEN
        -- Get the existing user ID
        SELECT id INTO user_id_val FROM auth.users WHERE email = 'kat@freegym.gr';
        
        -- Check if profile exists
        SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id = user_id_val) INTO profile_exists;
        
        IF profile_exists THEN
            -- Update existing profile to trainer role
            UPDATE public.user_profiles 
            SET 
                first_name = 'Kat',
                last_name = 'Trainer',
                role = 'trainer',
                updated_at = NOW()
            WHERE user_id = user_id_val;
            
            -- Update password
            UPDATE auth.users 
            SET 
                encrypted_password = crypt('trainer123', gen_salt('bf')),
                updated_at = NOW()
            WHERE id = user_id_val;
            
            RAISE NOTICE 'User kat@freegym.gr already exists with profile. Updated to trainer role and password.';
        ELSE
            -- Create new profile for existing user
            INSERT INTO public.user_profiles (
                user_id,
                first_name,
                last_name,
                email,
                role,
                created_at,
                updated_at
            ) VALUES (
                user_id_val,
                'Kat',
                'Trainer',
                'kat@freegym.gr',
                'trainer',
                NOW(),
                NOW()
            );
            
            -- Update password
            UPDATE auth.users 
            SET 
                encrypted_password = crypt('trainer123', gen_salt('bf')),
                updated_at = NOW()
            WHERE id = user_id_val;
            
            RAISE NOTICE 'User kat@freegym.gr exists but no profile. Created profile with trainer role and updated password.';
        END IF;
        
    ELSE
        -- Create new user
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
            'kat@freegym.gr',
            crypt('trainer123', gen_salt('bf')),
            NOW(),
            NULL,
            NULL,
            '{"provider": "email", "providers": ["email"]}',
            '{"first_name": "Kat", "last_name": "Trainer"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
        
        -- Get the new user ID
        SELECT id INTO user_id_val FROM auth.users WHERE email = 'kat@freegym.gr';
        
        -- Create user profile
        INSERT INTO public.user_profiles (
            user_id,
            first_name,
            last_name,
            email,
            role,
            created_at,
            updated_at
        ) VALUES (
            user_id_val,
            'Kat',
            'Trainer',
            'kat@freegym.gr',
            'trainer',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'New user kat@freegym.gr created with trainer role.';
    END IF;
END $$;

-- Test password verification
SELECT 
    'Password verification test for Kat' as test_type,
    CASE 
        WHEN crypt('trainer123', (SELECT encrypted_password FROM auth.users WHERE email = 'kat@freegym.gr')) = 
             (SELECT encrypted_password FROM auth.users WHERE email = 'kat@freegym.gr')
        THEN 'Password verification SUCCESS'
        ELSE 'Password verification FAILED'
    END as verification_result;

-- Verify the result
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    up.first_name,
    up.last_name,
    up.role,
    up.created_at,
    up.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'kat@freegym.gr';


