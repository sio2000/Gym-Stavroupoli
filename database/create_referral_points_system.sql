-- Referral Points System - Separate from Kettlebell Points
-- This system handles referral codes and points for successful referrals

-- Create user_referral_points table for storing referral points (separate from kettlebell points)
CREATE TABLE IF NOT EXISTS user_referral_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user
    UNIQUE(user_id)
);

-- Create referral_transactions table to track all referral point transactions
CREATE TABLE IF NOT EXISTS referral_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 10,
    transaction_type VARCHAR(20) NOT NULL DEFAULT 'referral' CHECK (transaction_type IN ('referral', 'bonus', 'adjustment')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_referral_points_user_id ON user_referral_points(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer_id ON referral_transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referred_id ON referral_transactions(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_created_at ON referral_transactions(created_at);

-- Enable RLS
ALTER TABLE user_referral_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_referral_points
DROP POLICY IF EXISTS "Users can view own referral points" ON user_referral_points;
CREATE POLICY "Users can view own referral points" ON user_referral_points
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own referral points" ON user_referral_points;
CREATE POLICY "Users can update own referral points" ON user_referral_points
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert referral points" ON user_referral_points;
CREATE POLICY "System can insert referral points" ON user_referral_points
    FOR INSERT WITH CHECK (true);

-- RLS Policies for referral_transactions
DROP POLICY IF EXISTS "Users can view own referral transactions" ON referral_transactions;
CREATE POLICY "Users can view own referral transactions" ON referral_transactions
    FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

DROP POLICY IF EXISTS "System can insert referral transactions" ON referral_transactions;
CREATE POLICY "System can insert referral transactions" ON referral_transactions
    FOR INSERT WITH CHECK (true);

-- Function to ensure user has referral code
CREATE OR REPLACE FUNCTION ensure_user_referral_code(p_user_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_referral_code VARCHAR(20);
    v_exists BOOLEAN;
BEGIN
    -- Check if user already has a referral code
    SELECT referral_code INTO v_referral_code
    FROM user_profiles 
    WHERE user_id = p_user_id;
    
    IF v_referral_code IS NOT NULL THEN
        RETURN v_referral_code;
    END IF;
    
    -- Generate unique referral code
    LOOP
        v_referral_code := upper(substring(md5(random()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM user_profiles WHERE referral_code = v_referral_code) INTO v_exists;
        IF NOT v_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Update user profile with referral code
    UPDATE user_profiles 
    SET referral_code = v_referral_code
    WHERE user_id = p_user_id;
    
    RETURN v_referral_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral and award points
CREATE OR REPLACE FUNCTION process_referral_signup(
    p_referred_user_id UUID,
    p_referral_code VARCHAR(20)
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    points_awarded INTEGER
) AS $$
DECLARE
    v_referrer_id UUID;
    v_referrer_profile RECORD;
    v_points_to_award INTEGER := 10;
    v_existing_points INTEGER;
BEGIN
    -- Find the referrer by referral code
    SELECT user_id INTO v_referrer_id
    FROM user_profiles 
    WHERE referral_code = p_referral_code;
    
    IF v_referrer_id IS NULL THEN
        RETURN QUERY SELECT false, 'Invalid referral code'::TEXT, 0;
        RETURN;
    END IF;
    
    -- Check if user is trying to refer themselves
    IF v_referrer_id = p_referred_user_id THEN
        RETURN QUERY SELECT false, 'Cannot use your own referral code'::TEXT, 0;
        RETURN;
    END IF;
    
    -- Get referrer profile info
    SELECT first_name, last_name, email INTO v_referrer_profile
    FROM user_profiles 
    WHERE user_id = v_referrer_id;
    
    -- Insert or update referral points for referrer
    INSERT INTO user_referral_points (user_id, points)
    VALUES (v_referrer_id, v_points_to_award)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        points = user_referral_points.points + v_points_to_award,
        updated_at = NOW();
    
    -- Record the transaction
    INSERT INTO referral_transactions (
        referrer_id, 
        referred_id, 
        referral_code, 
        points_awarded
    ) VALUES (
        v_referrer_id, 
        p_referred_user_id, 
        p_referral_code, 
        v_points_to_award
    );
    
    -- Get updated points total
    SELECT points INTO v_existing_points
    FROM user_referral_points 
    WHERE user_id = v_referrer_id;
    
    RETURN QUERY SELECT true, 
        format('Successfully awarded %s points to %s %s', 
               v_points_to_award, 
               v_referrer_profile.first_name, 
               v_referrer_profile.last_name)::TEXT, 
        v_existing_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's total referral points
CREATE OR REPLACE FUNCTION get_user_referral_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_points INTEGER;
BEGIN
    SELECT COALESCE(points, 0) INTO v_points
    FROM user_referral_points 
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_points, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's referral code
CREATE OR REPLACE FUNCTION get_user_referral_code(p_user_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    user_code VARCHAR(20);
BEGIN
    SELECT referral_code INTO user_code
    FROM user_profiles
    WHERE user_id = p_user_id;

    -- If no code exists, generate one
    IF user_code IS NULL OR user_code = '' THEN
        user_code := public.generate_referral_code();
        
        -- Update the user profile with the new code
        UPDATE user_profiles 
        SET referral_code = user_code 
        WHERE user_id = p_user_id;
    END IF;

    RETURN user_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON user_referral_points TO postgres, anon, authenticated, service_role;
GRANT ALL ON referral_transactions TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION ensure_user_referral_code(UUID) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION process_referral_signup(UUID, VARCHAR) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_referral_points(UUID) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_referral_code(UUID) TO postgres, anon, authenticated, service_role;
