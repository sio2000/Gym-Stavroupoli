-- ULTRA SIMPLE TRIGGER - Για να λύσουμε το πρόβλημα
-- Αυτό το script είναι πολύ απλό και ασφαλές

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created_bulletproof ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_bulletproof() CASCADE;

-- 2. Create simple trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_bulletproof()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simple insert with ON CONFLICT to avoid errors
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
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Χρήστης'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        COALESCE(NEW.raw_user_meta_data->>'language', 'el'),
        'user',
        'REF' || substr(NEW.id::text, 1, 8),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created_bulletproof
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_bulletproof();

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_bulletproof TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user_bulletproof TO service_role;

-- 5. Success message
SELECT 'ULTRA SIMPLE TRIGGER INSTALLED SUCCESSFULLY!' as status;
