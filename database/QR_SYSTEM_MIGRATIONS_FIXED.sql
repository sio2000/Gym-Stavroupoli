-- QR System Database Migrations - FIXED VERSION
-- Feature Flag: FEATURE_QR_SYSTEM
-- Version: 1.0.1
-- Created: 2024-01-XX

-- =============================================
-- BACKUP INSTRUCTIONS (RUN BEFORE MIGRATIONS)
-- =============================================
-- 1. Create backup: pg_dump -h your-host -U your-user -d your-db > backup_before_qr_system.sql
-- 2. Test migrations on staging environment first
-- 3. Verify rollback scripts work in staging

-- =============================================
-- MIGRATION 1: FEATURE FLAGS TABLE (CREATE FIRST)
-- =============================================
CREATE TABLE IF NOT EXISTS feature_flags (
    name VARCHAR(100) PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- MIGRATION 2: QR CODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('free_gym', 'pilates', 'personal')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
    qr_token VARCHAR(255) NOT NULL UNIQUE, -- HMAC-signed token
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL, -- NULL means never expires
    last_scanned_at TIMESTAMPTZ NULL,
    scan_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON qr_codes(status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_expires_at ON qr_codes(expires_at);

-- =============================================
-- MIGRATION 3: SECRETARIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS secretaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- MIGRATION 4: SCAN AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS scan_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    secretary_id UUID NULL REFERENCES secretaries(id) ON DELETE SET NULL,
    scan_type VARCHAR(20) NOT NULL CHECK (scan_type IN ('entrance', 'exit')),
    result VARCHAR(20) NOT NULL CHECK (result IN ('approved', 'rejected')),
    reason VARCHAR(100) NULL, -- 'active', 'expired', 'category_mismatch', etc.
    ip_address INET NULL,
    user_agent TEXT NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_scan_audit_qr_id ON scan_audit_logs(qr_id);
CREATE INDEX IF NOT EXISTS idx_scan_audit_user_id ON scan_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_audit_secretary_id ON scan_audit_logs(secretary_id);
CREATE INDEX IF NOT EXISTS idx_scan_audit_scanned_at ON scan_audit_logs(scanned_at);

-- =============================================
-- MIGRATION 5: HELPER FUNCTIONS
-- =============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- MIGRATION 6: TRIGGERS
-- =============================================

CREATE TRIGGER update_qr_codes_updated_at 
    BEFORE UPDATE ON qr_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secretaries_updated_at 
    BEFORE UPDATE ON secretaries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- MIGRATION 7: RLS POLICIES
-- =============================================

-- QR Codes RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own QR codes
CREATE POLICY "Users can view own QR codes" ON qr_codes
    FOR SELECT USING (auth.uid() = user_id);

-- Admins and trainers can manage all QR codes
CREATE POLICY "Admins can manage all QR codes" ON qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Trainers can manage all QR codes" ON qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'trainer'
        )
    );

-- Secretaries can only read QR codes for validation
CREATE POLICY "Secretaries can read QR codes" ON qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM secretaries 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    );

-- Scan Audit Logs RLS
ALTER TABLE scan_audit_logs ENABLE ROW LEVEL SECURITY;

-- Secretaries can insert audit logs
CREATE POLICY "Secretaries can insert audit logs" ON scan_audit_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM secretaries 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    );

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON scan_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Secretaries can view their own audit logs
CREATE POLICY "Secretaries can view own audit logs" ON scan_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM secretaries 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    );

-- =============================================
-- MIGRATION 8: QR SYSTEM FUNCTIONS (AFTER TABLES EXIST)
-- =============================================

-- Function to generate QR token with HMAC
CREATE OR REPLACE FUNCTION generate_qr_token(qr_id UUID, user_id UUID)
RETURNS TEXT AS $$
DECLARE
    payload TEXT;
    secret_key TEXT;
BEGIN
    -- Get secret key from environment (in production, use Supabase secrets)
    secret_key := current_setting('app.qr_secret_key', true);
    IF secret_key IS NULL OR secret_key = '' THEN
        secret_key := 'default_secret_key_change_in_production';
    END IF;
    
    -- Create payload: qr_id:user_id:timestamp
    payload := qr_id::TEXT || ':' || user_id::TEXT || ':' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    -- Return HMAC-SHA256 signature
    RETURN encode(hmac(payload, secret_key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate QR token
CREATE OR REPLACE FUNCTION validate_qr_token(token TEXT, qr_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    payload TEXT;
    secret_key TEXT;
    expected_token TEXT;
    token_parts TEXT[];
    token_timestamp BIGINT;
    current_timestamp BIGINT;
    time_diff INTEGER;
BEGIN
    -- Get secret key
    secret_key := current_setting('app.qr_secret_key', true);
    IF secret_key IS NULL OR secret_key = '' THEN
        secret_key := 'default_secret_key_change_in_production';
    END IF;
    
    -- Parse token to get timestamp
    token_parts := string_to_array(token, ':');
    IF array_length(token_parts, 1) != 3 THEN
        RETURN FALSE;
    END IF;
    
    token_timestamp := token_parts[3]::BIGINT;
    current_timestamp := EXTRACT(EPOCH FROM NOW())::BIGINT;
    time_diff := current_timestamp - token_timestamp;
    
    -- Token expires after 24 hours
    IF time_diff > 86400 THEN
        RETURN FALSE;
    END IF;
    
    -- Recreate expected token
    payload := qr_id::TEXT || ':' || user_id::TEXT || ':' || token_timestamp::TEXT;
    expected_token := encode(hmac(payload, secret_key, 'sha256'), 'hex');
    
    -- Compare tokens
    RETURN expected_token = token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update QR scan info
CREATE OR REPLACE FUNCTION update_qr_scan_info(qr_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE qr_codes 
    SET 
        last_scanned_at = NOW(),
        scan_count = scan_count + 1,
        updated_at = NOW()
    WHERE id = qr_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- MIGRATION 9: SAMPLE DATA (STAGING ONLY)
-- =============================================

-- Insert sample secretary (REMOVE IN PRODUCTION)
INSERT INTO secretaries (username, password_hash, full_name) VALUES 
('secretary1', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', 'Secretary One'),
('secretary2', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', 'Secretary Two')
ON CONFLICT (username) DO NOTHING;

-- Insert QR system feature flag
INSERT INTO feature_flags (name, is_enabled, description) VALUES 
('FEATURE_QR_SYSTEM', false, 'QR Code entrance/exit system')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('qr_codes', 'secretaries', 'scan_audit_logs', 'feature_flags');

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('qr_codes', 'scan_audit_logs');

-- Verify functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_qr_token', 'validate_qr_token', 'update_qr_scan_info');

-- Verify feature flag
SELECT name, is_enabled FROM feature_flags WHERE name = 'FEATURE_QR_SYSTEM';
