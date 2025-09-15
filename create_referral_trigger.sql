-- Create trigger to automatically assign referral codes to new users
-- This ensures ALL new users get a referral code when their profile is created

-- First, create the trigger function
CREATE OR REPLACE FUNCTION assign_referral_code_to_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only assign code if user doesn't already have one
    IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
        NEW.referral_code := public.generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_profile_created_assign_referral_code ON user_profiles;

-- Create the trigger
CREATE TRIGGER on_user_profile_created_assign_referral_code
    BEFORE INSERT ON user_profiles
    FOR EACH ROW 
    EXECUTE FUNCTION assign_referral_code_to_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION assign_referral_code_to_new_user() TO postgres, anon, authenticated, service_role;

-- Test the trigger by checking if it exists
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_user_profile_created_assign_referral_code';
