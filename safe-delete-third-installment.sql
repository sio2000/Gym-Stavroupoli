-- Safe Delete Third Installment Setup
-- This script ONLY adds new functionality without modifying or deleting anything existing
-- Run this script in Supabase SQL Editor

-- ==========================================
-- 1. CREATE TABLE (only if it doesn't exist)
-- ==========================================

CREATE TABLE IF NOT EXISTS deleted_third_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_request_id UUID NOT NULL REFERENCES membership_requests(id) ON DELETE CASCADE,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique constraint per request (only one deletion per request)
    UNIQUE(membership_request_id)
);

-- ==========================================
-- 2. CREATE INDEXES (only if they don't exist)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_deleted_third_installments_request_id ON deleted_third_installments(membership_request_id);
CREATE INDEX IF NOT EXISTS idx_deleted_third_installments_deleted_at ON deleted_third_installments(deleted_at);

-- ==========================================
-- 3. ENABLE RLS (only if not already enabled)
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'deleted_third_installments' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE deleted_third_installments ENABLE ROW LEVEL SECURITY;
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
        WHERE tablename = 'deleted_third_installments' 
        AND policyname = 'Admins can manage deleted third installments'
    ) THEN
        CREATE POLICY "Admins can manage deleted third installments" ON deleted_third_installments
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role IN ('admin', 'secretary')
                )
            );
    END IF;
END $$;

-- Policy for users to view their own deleted third installments (only create if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'deleted_third_installments' 
        AND policyname = 'Users can view their own deleted third installments'
    ) THEN
        CREATE POLICY "Users can view their own deleted third installments" ON deleted_third_installments
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM membership_requests 
                    WHERE membership_requests.id = deleted_third_installments.membership_request_id
                    AND membership_requests.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- ==========================================
-- 5. CREATE FUNCTIONS (using CREATE OR REPLACE)
-- ==========================================

-- Function to check if third installment is deleted for a request
CREATE OR REPLACE FUNCTION is_third_installment_deleted(request_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM deleted_third_installments 
        WHERE membership_request_id = request_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get deleted third installment info for a request
CREATE OR REPLACE FUNCTION get_deleted_third_installment_info(request_id UUID)
RETURNS TABLE(
    deleted_at TIMESTAMPTZ,
    deleted_by_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dti.deleted_at,
        COALESCE(up.first_name || ' ' || up.last_name, 'Unknown') as deleted_by_name
    FROM deleted_third_installments dti
    LEFT JOIN user_profiles up ON dti.deleted_by = up.id
    WHERE dti.membership_request_id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete third installment permanently
CREATE OR REPLACE FUNCTION delete_third_installment_permanently(
    request_id UUID,
    deleted_by_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if third installment is already deleted
    IF EXISTS (
        SELECT 1 FROM deleted_third_installments 
        WHERE membership_request_id = request_id
    ) THEN
        RETURN FALSE; -- Already deleted
    END IF;
    
    -- Insert the deletion record
    INSERT INTO deleted_third_installments (
        membership_request_id,
        deleted_by
    ) VALUES (
        request_id,
        deleted_by_user_id
    );
    
    RETURN TRUE; -- Successfully deleted
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore third installment (admin use only)
CREATE OR REPLACE FUNCTION restore_third_installment(request_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM deleted_third_installments 
    WHERE membership_request_id = request_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_deleted_third_installments_updated_at()
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
        WHERE tgname = 'trigger_update_deleted_third_installments_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_deleted_third_installments_updated_at
            BEFORE UPDATE ON deleted_third_installments
            FOR EACH ROW
            EXECUTE FUNCTION update_deleted_third_installments_updated_at();
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
        WHERE objoid = 'deleted_third_installments'::regclass 
        AND objsubid = 0
    ) THEN
        COMMENT ON TABLE deleted_third_installments IS 'Stores permanently deleted third installments for membership requests';
    END IF;
END $$;

-- Add column comments (only if they don't exist)
DO $$
BEGIN
    -- membership_request_id comment
    IF NOT EXISTS (
        SELECT 1 FROM pg_description 
        WHERE objoid = 'deleted_third_installments'::regclass 
        AND objsubid = 2
    ) THEN
        COMMENT ON COLUMN deleted_third_installments.membership_request_id IS 'Reference to the membership request';
    END IF;
    
    -- deleted_at comment
    IF NOT EXISTS (
        SELECT 1 FROM pg_description 
        WHERE objoid = 'deleted_third_installments'::regclass 
        AND objsubid = 3
    ) THEN
        COMMENT ON COLUMN deleted_third_installments.deleted_at IS 'When the third installment was deleted';
    END IF;
    
    -- deleted_by comment
    IF NOT EXISTS (
        SELECT 1 FROM pg_description 
        WHERE objoid = 'deleted_third_installments'::regclass 
        AND objsubid = 4
    ) THEN
        COMMENT ON COLUMN deleted_third_installments.deleted_by IS 'User who deleted the third installment (can be NULL)';
    END IF;
END $$;

-- ==========================================
-- 8. VERIFICATION QUERIES
-- ==========================================

-- Test that the table exists and has the correct structure
SELECT 
    'Table deleted_third_installments exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deleted_third_installments') 
         THEN 'YES' ELSE 'NO' END as verification;

-- Test that the functions exist
SELECT 
    'Function is_third_installment_deleted exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_third_installment_deleted') 
         THEN 'YES' ELSE 'NO' END as verification;

SELECT 
    'Function delete_third_installment_permanently exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_third_installment_permanently') 
         THEN 'YES' ELSE 'NO' END as verification;

SELECT 
    'Function restore_third_installment exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'restore_third_installment') 
         THEN 'YES' ELSE 'NO' END as verification;

-- Test that the trigger exists
SELECT 
    'Trigger trigger_update_deleted_third_installments_updated_at exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_deleted_third_installments_updated_at') 
         THEN 'YES' ELSE 'NO' END as verification;

-- Test that RLS is enabled
SELECT 
    'RLS enabled on deleted_third_installments: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'deleted_third_installments' 
        AND relrowsecurity = true
    ) THEN 'YES' ELSE 'NO' END as verification;

-- Test that policies exist
SELECT 
    'Policy "Admins can manage deleted third installments" exists: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'deleted_third_installments' 
        AND policyname = 'Admins can manage deleted third installments'
    ) THEN 'YES' ELSE 'NO' END as verification;

SELECT 
    'Policy "Users can view their own deleted third installments" exists: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'deleted_third_installments' 
        AND policyname = 'Users can view their own deleted third installments'
    ) THEN 'YES' ELSE 'NO' END as verification;

-- Show current count of deleted third installments (should be 0 initially)
SELECT 'Current deleted third installments count: ' || COUNT(*)::text as verification 
FROM deleted_third_installments;

-- ==========================================
-- SETUP COMPLETE
-- ==========================================

SELECT '🎉 Safe Delete Third Installment Setup Complete!' as status;
SELECT '✅ All components added safely without modifying existing functionality' as message;
SELECT '🚀 You can now test the delete third installment functionality in your application' as next_step;
