-- Create table for permanently locked installments
-- This table stores which installments are locked for each membership request

CREATE TABLE IF NOT EXISTS locked_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_request_id UUID NOT NULL REFERENCES membership_requests(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL CHECK (installment_number IN (1, 2, 3)),
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique constraint per request and installment
    UNIQUE(membership_request_id, installment_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locked_installments_request_id ON locked_installments(membership_request_id);
CREATE INDEX IF NOT EXISTS idx_locked_installments_locked_at ON locked_installments(locked_at);

-- Add RLS (Row Level Security) if needed
ALTER TABLE locked_installments ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admins can manage locked installments" ON locked_installments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'secretary')
        )
    );

-- Create policy for users to view their own locked installments
CREATE POLICY "Users can view their own locked installments" ON locked_installments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM membership_requests 
            WHERE membership_requests.id = locked_installments.membership_request_id
            AND membership_requests.user_id = auth.uid()
        )
    );

-- Create function to get locked installments for a request
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

-- Create function to lock an installment
CREATE OR REPLACE FUNCTION lock_installment(
    request_id UUID,
    installment_num INTEGER,
    locked_by_user_id UUID
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
    
    -- Insert the lock record
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

-- Create function to unlock an installment (for admin use)
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

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_locked_installments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_locked_installments_updated_at
    BEFORE UPDATE ON locked_installments
    FOR EACH ROW
    EXECUTE FUNCTION update_locked_installments_updated_at();

-- Add comments for documentation
COMMENT ON TABLE locked_installments IS 'Stores permanently locked installments for membership requests';
COMMENT ON COLUMN locked_installments.membership_request_id IS 'Reference to the membership request';
COMMENT ON COLUMN locked_installments.installment_number IS 'Installment number (1, 2, or 3)';
COMMENT ON COLUMN locked_installments.locked_at IS 'When the installment was locked';
COMMENT ON COLUMN locked_installments.locked_by IS 'User who locked the installment';
