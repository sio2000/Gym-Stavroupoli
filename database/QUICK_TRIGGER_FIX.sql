-- QUICK TRIGGER FIX
-- Γρήγορη διόρθωση για το υπάρχον trigger system

-- 1. Drop existing trigger and function safely
DROP TRIGGER IF EXISTS on_auth_user_created_bulletproof ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_bulletproof() CASCADE;

-- 2. Create simple bulletproof trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_bulletproof()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert into user_profiles table with all available data
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
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        COALESCE(NEW.raw_user_meta_data->>'language', 'el'),
        'user',
        'REF' || substr(NEW.id::text, 1, 8),
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

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created_bulletproof
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_bulletproof();

-- 4. Success message
SELECT 'QUICK TRIGGER FIX APPLIED SUCCESSFULLY!' as status;

