-- Fix the locked_installments table structure
-- First, let's check if the table exists and create it if it doesn't

-- Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS locked_installments CASCADE;

-- Create the locked_installments table with the correct structure
CREATE TABLE locked_installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES membership_requests(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL CHECK (installment_number IN (1, 2, 3)),
  locked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique constraint for request_id and installment_number
  UNIQUE(request_id, installment_number)
);

-- Add comments for documentation
COMMENT ON TABLE locked_installments IS 'Stores information about locked installments for membership requests';
COMMENT ON COLUMN locked_installments.request_id IS 'Reference to the membership request';
COMMENT ON COLUMN locked_installments.installment_number IS 'The installment number (1, 2, or 3)';
COMMENT ON COLUMN locked_installments.locked_by IS 'User who locked the installment';
COMMENT ON COLUMN locked_installments.locked_at IS 'When the installment was locked';
COMMENT ON COLUMN locked_installments.deleted_at IS 'When the installment was deleted (for 3rd installment)';
COMMENT ON COLUMN locked_installments.deleted_by IS 'User who deleted the installment (for 3rd installment)';

-- Create indexes for better performance
CREATE INDEX idx_locked_installments_request_id ON locked_installments(request_id);
CREATE INDEX idx_locked_installments_installment_number ON locked_installments(installment_number);
CREATE INDEX idx_locked_installments_locked_by ON locked_installments(locked_by);
CREATE INDEX idx_locked_installments_locked_at ON locked_installments(locked_at);

-- Enable Row Level Security (RLS)
ALTER TABLE locked_installments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view locked installments for their own requests" ON locked_installments
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM membership_requests 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all locked installments" ON locked_installments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Secretaries can view all locked installments" ON locked_installments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'secretary'
    )
  );

CREATE POLICY "Admins can manage locked installments" ON locked_installments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
  );

-- Grant necessary permissions
GRANT ALL ON locked_installments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
