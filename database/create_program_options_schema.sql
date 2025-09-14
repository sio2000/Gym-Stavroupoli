-- Create database schema for program options (Old Members and Kettlebell Points)

-- Table to track Old Members usage per user
CREATE TABLE IF NOT EXISTS user_old_members_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(user_id),
    UNIQUE(user_id) -- Ensure each user can only be marked as "old member" once
);

-- Table to store Kettlebell Points per program creation
CREATE TABLE IF NOT EXISTS user_kettlebell_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points >= 0),
    program_id UUID, -- Reference to the program that created these points
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_old_members_usage_user_id ON user_old_members_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kettlebell_points_user_id ON user_kettlebell_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kettlebell_points_created_at ON user_kettlebell_points(created_at);

-- Enable RLS
ALTER TABLE user_old_members_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kettlebell_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_old_members_usage
DROP POLICY IF EXISTS "Admins can view all old members usage" ON user_old_members_usage;
CREATE POLICY "Admins can view all old members usage" ON user_old_members_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert old members usage" ON user_old_members_usage;
CREATE POLICY "Admins can insert old members usage" ON user_old_members_usage
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- RLS Policies for user_kettlebell_points
DROP POLICY IF EXISTS "Admins can view all kettlebell points" ON user_kettlebell_points;
CREATE POLICY "Admins can view all kettlebell points" ON user_kettlebell_points
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert kettlebell points" ON user_kettlebell_points;
CREATE POLICY "Admins can insert kettlebell points" ON user_kettlebell_points
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON user_old_members_usage TO authenticated;
GRANT ALL ON user_kettlebell_points TO authenticated;
