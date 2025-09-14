-- Create database schema for Cash Register (Cash and POS transactions)

-- Table to store Cash transactions
CREATE TABLE IF NOT EXISTS user_cash_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('cash', 'pos')),
    program_id UUID, -- Reference to the program that created this transaction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(user_id),
    notes TEXT -- Optional notes for the transaction
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_cash_transactions_user_id ON user_cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cash_transactions_type ON user_cash_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_user_cash_transactions_created_at ON user_cash_transactions(created_at);

-- Enable RLS
ALTER TABLE user_cash_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_cash_transactions
DROP POLICY IF EXISTS "Admins can view all cash transactions" ON user_cash_transactions;
CREATE POLICY "Admins can view all cash transactions" ON user_cash_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert cash transactions" ON user_cash_transactions;
CREATE POLICY "Admins can insert cash transactions" ON user_cash_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update cash transactions" ON user_cash_transactions;
CREATE POLICY "Admins can update cash transactions" ON user_cash_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can delete cash transactions" ON user_cash_transactions;
CREATE POLICY "Admins can delete cash transactions" ON user_cash_transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON user_cash_transactions TO authenticated;

-- Create a view for cash summary per user
CREATE OR REPLACE VIEW user_cash_summary AS
SELECT 
    user_id,
    transaction_type,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count,
    MAX(created_at) as last_transaction_date
FROM user_cash_transactions
GROUP BY user_id, transaction_type;

-- Grant permissions on the view
GRANT SELECT ON user_cash_summary TO authenticated;
