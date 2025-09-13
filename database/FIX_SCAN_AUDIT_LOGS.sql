-- Fix scan_audit_logs table structure
-- First, let's check the current structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'scan_audit_logs' 
ORDER BY ordinal_position;

-- Drop the table if it exists and recreate it properly
DROP TABLE IF EXISTS scan_audit_logs CASCADE;

-- Create scan_audit_logs table with proper structure
CREATE TABLE scan_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id UUID NOT NULL,
    user_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,
    scan_type VARCHAR(20) NOT NULL CHECK (scan_type IN ('entrance', 'exit')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('approved', 'rejected')),
    scanned_by UUID,
    scan_data TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE scan_audit_logs 
ADD CONSTRAINT fk_scan_audit_logs_qr_code 
FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE;

ALTER TABLE scan_audit_logs 
ADD CONSTRAINT fk_scan_audit_logs_user 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE scan_audit_logs 
ADD CONSTRAINT fk_scan_audit_logs_scanned_by 
FOREIGN KEY (scanned_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX idx_scan_audit_logs_user_id ON scan_audit_logs(user_id);
CREATE INDEX idx_scan_audit_logs_created_at ON scan_audit_logs(created_at);
CREATE INDEX idx_scan_audit_logs_status ON scan_audit_logs(status);

-- Enable RLS
ALTER TABLE scan_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Secretaries can view all scan logs" ON scan_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'secretary'
        )
    );

CREATE POLICY "Secretaries can insert scan logs" ON scan_audit_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'secretary'
        )
    );

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'scan_audit_logs' 
ORDER BY ordinal_position;
