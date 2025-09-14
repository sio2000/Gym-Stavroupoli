-- FIX PERSONAL TRAINING CODES - ΔΙΟΡΘΩΣΗ ΠΙΝΑΚΑ PERSONAL_TRAINING_CODES
-- Εκτέλεση στο Supabase SQL Editor

-- Check current structure of personal_training_codes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'personal_training_codes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns to personal_training_codes
ALTER TABLE personal_training_codes 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS package_type TEXT DEFAULT 'personal_training',
ADD COLUMN IF NOT EXISTS used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Update the table to have proper structure
ALTER TABLE personal_training_codes 
ALTER COLUMN code SET NOT NULL,
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN sessions_remaining SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_personal_training_codes_user_id ON personal_training_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_training_codes_code ON personal_training_codes(code);
CREATE INDEX IF NOT EXISTS idx_personal_training_codes_created_by ON personal_training_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_personal_training_codes_used_by ON personal_training_codes(used_by);

-- Update RLS policies for personal_training_codes
DROP POLICY IF EXISTS "Enable read access for all users" ON personal_training_codes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON personal_training_codes;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON personal_training_codes;

-- Create proper RLS policies
CREATE POLICY "Users can view own codes" ON personal_training_codes
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = used_by);

CREATE POLICY "Admins can view all codes" ON personal_training_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert codes" ON personal_training_codes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update codes" ON personal_training_codes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create some sample codes for testing
INSERT INTO personal_training_codes (
    code,
    user_id,
    sessions_remaining,
    package_type,
    created_by,
    is_active,
    expires_at
) VALUES 
(
    '12345678',
    '00000000-0000-0000-0000-000000000004',
    10,
    'personal_training',
    '00000000-0000-0000-0000-000000000001',
    true,
    NOW() + INTERVAL '30 days'
),
(
    '87654321',
    '00000000-0000-0000-0000-000000000005',
    5,
    'personal_training',
    '00000000-0000-0000-0000-000000000001',
    true,
    NOW() + INTERVAL '30 days'
) ON CONFLICT (code) DO NOTHING;

-- Test the table structure
SELECT 
    'Personal Training Codes Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'personal_training_codes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test query that was failing
SELECT 
    used_by,
    code,
    package_type
FROM personal_training_codes 
WHERE is_active = true;

-- Success message
SELECT 'Personal training codes table fixed!' as message;
