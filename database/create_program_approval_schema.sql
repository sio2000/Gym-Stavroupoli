-- Create database schema for Program Options Approval States

-- Table to store program approval states
CREATE TABLE IF NOT EXISTS program_approval_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    program_id UUID, -- Reference to the program (if exists)
    approval_status VARCHAR(20) NOT NULL CHECK (approval_status IN ('approved', 'rejected', 'pending')),
    old_members_used BOOLEAN DEFAULT FALSE,
    kettlebell_points INTEGER DEFAULT 0,
    cash_amount DECIMAL(10,2) DEFAULT 0,
    pos_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(user_id),
    notes TEXT -- Optional notes for the approval decision
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_program_approval_states_user_id ON program_approval_states(user_id);
CREATE INDEX IF NOT EXISTS idx_program_approval_states_program_id ON program_approval_states(program_id);
CREATE INDEX IF NOT EXISTS idx_program_approval_states_approval_status ON program_approval_states(approval_status);
CREATE INDEX IF NOT EXISTS idx_program_approval_states_created_at ON program_approval_states(created_at);

-- Enable RLS
ALTER TABLE program_approval_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for program_approval_states
DROP POLICY IF EXISTS "Admins can view all program approval states" ON program_approval_states;
CREATE POLICY "Admins can view all program approval states" ON program_approval_states
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert program approval states" ON program_approval_states;
CREATE POLICY "Admins can insert program approval states" ON program_approval_states
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update program approval states" ON program_approval_states;
CREATE POLICY "Admins can update program approval states" ON program_approval_states
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can delete program approval states" ON program_approval_states;
CREATE POLICY "Admins can delete program approval states" ON program_approval_states
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON program_approval_states TO authenticated;

-- Create a view for program approval summary
CREATE OR REPLACE VIEW program_approval_summary AS
SELECT 
    user_id,
    approval_status,
    COUNT(*) as total_approvals,
    SUM(CASE WHEN old_members_used THEN 1 ELSE 0 END) as old_members_count,
    SUM(kettlebell_points) as total_kettlebell_points,
    SUM(cash_amount) as total_cash_amount,
    SUM(pos_amount) as total_pos_amount,
    MAX(created_at) as last_approval_date
FROM program_approval_states
GROUP BY user_id, approval_status;

-- Grant permissions on the view
GRANT SELECT ON program_approval_summary TO authenticated;
