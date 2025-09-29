-- Safe Permanent Installment Locking Setup
-- This script ONLY adds new functionality without modifying or deleting anything existing
-- Run this script in Supabase SQL Editor

-- ==========================================
-- 1. CREATE TABLE (only if it doesn't exist)
-- ==========================================

CREATE TABLE IF NOT EXISTS locked_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_request_id UUID NOT NULL REFERENCES membership_requests(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL CHECK (installment_number IN (1, 2, 3)),
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique constraint per request and installment
    UNIQUE(membership_request_id, installment_number)
);

-- ==========================================
-- 2. CREATE INDEXES (only if they don't exist)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_locked_installments_request_id ON locked_installments(membership_request_id);
CREATE INDEX IF NOT EXISTS idx_locked_installments_locked_at ON locked_installments(locked_at);

-- ==========================================
-- 3. ENABLE RLS (only if not already enabled)
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'locked_installments' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE locked_installments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ==========================================
-- 4. CREATE RLS POLICIES (only if they don't exist)
-- ==========================================

-- Policy for admin/secretary access (only create if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'locked_installments' 
        AND policyname = 'Admins can manage locked installments'
    ) THEN
        CREATE POLICY "Admins can manage locked installments" ON locked_installments
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role IN ('admin', 'secretary')
                )
            );
    END IF;
END $$;

-- Policy for users to view their own locked installments (only create if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'locked_installments' 
        AND policyname = 'Users can view their own locked installments'
    ) THEN
        CREATE POLICY "Users can view their own locked installments" ON locked_installments
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM membership_requests 
                    WHERE membership_requests.id = locked_installments.membership_request_id
                    AND membership_requests.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- ==========================================
-- 5. CREATE FUNCTIONS (using CREATE OR REPLACE)
-- ==========================================

-- Function to get locked installments for a request
CREATE OR REPLACE FUNCTION get_locked_installments_for_request(request_id UUID)
RETURNS TABLE(
    installment_number INTEGER,
    locked_at TIMESTAMPTZ,
    locked_by_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        li.installment_number,
        li.locked_at,
        COALESCE(up.first_name || ' ' || up.last_name, 'Unknown') as locked_by_name
    FROM locked_installments li
    LEFT JOIN user_profiles up ON li.locked_by = up.id
    WHERE li.membership_request_id = request_id
    ORDER BY li.installment_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to lock an installment
CREATE OR REPLACE FUNCTION lock_installment(
    request_id UUID,
    installment_num INTEGER,
    locked_by_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if installment is already locked
    IF EXISTS (
        SELECT 1 FROM locked_installments 
        WHERE membership_request_id = request_id 
        AND installment_number = installment_num
    ) THEN
        RETURN FALSE; -- Already locked
    END IF;
    
    -- Insert the lock record (locked_by_user_id can be NULL)
    INSERT INTO locked_installments (
        membership_request_id,
        installment_number,
        locked_by
    ) VALUES (
        request_id,
        installment_num,
        locked_by_user_id
    );
    
    RETURN TRUE; -- Successfully locked
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock an installment
CREATE OR REPLACE FUNCTION unlock_installment(
    request_id UUID,
    installment_num INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM locked_installments 
    WHERE membership_request_id = request_id 
    AND installment_number = installment_num;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_locked_installments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 6. CREATE TRIGGER (only if it doesn't exist)
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_locked_installments_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_locked_installments_updated_at
            BEFORE UPDATE ON locked_installments
            FOR EACH ROW
            EXECUTE FUNCTION update_locked_installments_updated_at();
    END IF;
END $$;

-- ==========================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- ==========================================

-- Add table comment (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_description 
        WHERE objoid = 'locked_installments'::regclass 
        AND objsubid = 0
    ) THEN
        COMMENT ON TABLE locked_installments IS 'Stores permanently locked installments for membership requests';
    END IF;
END $$;

-- Add column comments (only if they don't exist)
DO $$
BEGIN
    -- membership_request_id comment
    IF NOT EXISTS (
        SELECT 1 FROM pg_description 
        WHERE objoid = 'locked_installments'::regclass 
        AND objsubid = 2
    ) THEN
        COMMENT ON COLUMN locked_installments.membership_request_id IS 'Reference to the membership request';
    END IF;
    
    -- installment_number comment
    IF NOT EXISTS (
        SELECT 1 FROM pg_description 
        WHERE objoid = 'locked_installments'::regclass 
        AND objsubid = 3
    ) THEN
        COMMENT ON COLUMN locked_installments.installment_number IS 'Installment number (1, 2, or 3)';
    END IF;
    
    -- locked_at comment
    IF NOT EXISTS (
        SELECT 1 FROM pg_description 
        WHERE objoid = 'locked_installments'::regclass 
        AND objsubid = 4
    ) THEN
        COMMENT ON COLUMN locked_installments.locked_at IS 'When the installment was locked';
    END IF;
    
    -- locked_by comment
    IF NOT EXISTS (
        SELECT 1 FROM pg_description 
        WHERE objoid = 'locked_installments'::regclass 
        AND objsubid = 5
    ) THEN
        COMMENT ON COLUMN locked_installments.locked_by IS 'User who locked the installment (can be NULL)';
    END IF;
END $$;

-- ==========================================
-- 8. VERIFICATION QUERIES
-- ==========================================

-- Test that the table exists and has the correct structure
SELECT 
    'Table locked_installments exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locked_installments') 
         THEN 'YES' ELSE 'NO' END as verification;

-- Test that the functions exist
SELECT 
    'Function get_locked_installments_for_request exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_locked_installments_for_request') 
         THEN 'YES' ELSE 'NO' END as verification;

SELECT 
    'Function lock_installment exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'lock_installment') 
         THEN 'YES' ELSE 'NO' END as verification;

SELECT 
    'Function unlock_installment exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'unlock_installment') 
         THEN 'YES' ELSE 'NO' END as verification;

-- Test that the trigger exists
SELECT 
    'Trigger trigger_update_locked_installments_updated_at exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_locked_installments_updated_at') 
         THEN 'YES' ELSE 'NO' END as verification;

-- Test that RLS is enabled
SELECT 
    'RLS enabled on locked_installments: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'locked_installments' 
        AND relrowsecurity = true
    ) THEN 'YES' ELSE 'NO' END as verification;

-- Test that policies exist
SELECT 
    'Policy "Admins can manage locked installments" exists: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'locked_installments' 
        AND policyname = 'Admins can manage locked installments'
    ) THEN 'YES' ELSE 'NO' END as verification;

SELECT 
    'Policy "Users can view their own locked installments" exists: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'locked_installments' 
        AND policyname = 'Users can view their own locked installments'
    ) THEN 'YES' ELSE 'NO' END as verification;

-- Show current count of locked installments (should be 0 initially)
SELECT 'Current locked installments count: ' || COUNT(*)::text as verification 
FROM locked_installments;

-- ==========================================
-- SETUP COMPLETE
-- ==========================================

SELECT '🎉 Safe Permanent Installment Locking Setup Complete!' as status;
SELECT '✅ All components added safely without modifying existing functionality' as message;
SELECT '🚀 You can now test the locking functionality in your application' as next_step;
