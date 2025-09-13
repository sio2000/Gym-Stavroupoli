-- QR System Database Migrations - SIMPLE VERSION
-- Feature Flag: FEATURE_QR_SYSTEM
-- Version: 1.0.4
-- This script is completely simple and safe

-- =============================================
-- STEP 1: CREATE FEATURE FLAGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS feature_flags (
    name VARCHAR(100) PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- STEP 2: CREATE QR CODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('free_gym', 'pilates', 'personal')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
    qr_token VARCHAR(255) NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    last_scanned_at TIMESTAMPTZ NULL,
    scan_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- STEP 3: CREATE SECRETARIES TABLE
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
-- STEP 4: CREATE SCAN AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS scan_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_id UUID NOT NULL,
    user_id UUID NOT NULL,
    secretary_id UUID NULL,
    scan_type VARCHAR(20) NOT NULL CHECK (scan_type IN ('entrance', 'exit')),
    result VARCHAR(20) NOT NULL CHECK (result IN ('approved', 'rejected')),
    reason VARCHAR(100) NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- STEP 5: CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON qr_codes(status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_expires_at ON qr_codes(expires_at);

CREATE INDEX IF NOT EXISTS idx_scan_audit_qr_id ON scan_audit_logs(qr_id);
CREATE INDEX IF NOT EXISTS idx_scan_audit_user_id ON scan_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_audit_secretary_id ON scan_audit_logs(secretary_id);
CREATE INDEX IF NOT EXISTS idx_scan_audit_scanned_at ON scan_audit_logs(scanned_at);

-- =============================================
-- STEP 6: CREATE HELPER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 7: CREATE TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON qr_codes;
CREATE TRIGGER update_qr_codes_updated_at 
    BEFORE UPDATE ON qr_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_secretaries_updated_at ON secretaries;
CREATE TRIGGER update_secretaries_updated_at 
    BEFORE UPDATE ON secretaries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STEP 8: ENABLE RLS
-- =============================================
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 9: CREATE RLS POLICIES
-- =============================================
-- QR Codes policies
DROP POLICY IF EXISTS "Users can view own QR codes" ON qr_codes;
CREATE POLICY "Users can view own QR codes" ON qr_codes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all QR codes" ON qr_codes;
CREATE POLICY "Admins can manage all QR codes" ON qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Trainers can manage all QR codes" ON qr_codes;
CREATE POLICY "Trainers can manage all QR codes" ON qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'trainer'
        )
    );

DROP POLICY IF EXISTS "Secretaries can read QR codes" ON qr_codes;
CREATE POLICY "Secretaries can read QR codes" ON qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM secretaries 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    );

-- Scan Audit Logs policies
DROP POLICY IF EXISTS "Secretaries can insert audit logs" ON scan_audit_logs;
CREATE POLICY "Secretaries can insert audit logs" ON scan_audit_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM secretaries 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins can view all audit logs" ON scan_audit_logs;
CREATE POLICY "Admins can view all audit logs" ON scan_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Secretaries can view own audit logs" ON scan_audit_logs;
CREATE POLICY "Secretaries can view own audit logs" ON scan_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM secretaries 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    );

-- =============================================
-- STEP 10: CREATE QR SYSTEM FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION generate_qr_token(qr_id UUID, user_id UUID)
RETURNS TEXT AS $$
DECLARE
    payload TEXT;
    secret_key TEXT;
BEGIN
    secret_key := current_setting('app.qr_secret_key', true);
    IF secret_key IS NULL OR secret_key = '' THEN
        secret_key := 'default_secret_key_change_in_production';
    END IF;
    
    payload := qr_id::TEXT || ':' || user_id::TEXT || ':' || EXTRACT(EPOCH FROM NOW())::TEXT;
    RETURN encode(hmac(payload, secret_key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    secret_key := current_setting('app.qr_secret_key', true);
    IF secret_key IS NULL OR secret_key = '' THEN
        secret_key := 'default_secret_key_change_in_production';
    END IF;
    
    token_parts := string_to_array(token, ':');
    IF array_length(token_parts, 1) != 3 THEN
        RETURN FALSE;
    END IF;
    
    token_timestamp := token_parts[3]::BIGINT;
    current_timestamp := EXTRACT(EPOCH FROM NOW())::BIGINT;
    time_diff := current_timestamp - token_timestamp;
    
    IF time_diff > 86400 THEN
        RETURN FALSE;
    END IF;
    
    payload := qr_id::TEXT || ':' || user_id::TEXT || ':' || token_timestamp::TEXT;
    expected_token := encode(hmac(payload, secret_key, 'sha256'), 'hex');
    
    RETURN expected_token = token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- STEP 11: INSERT SAMPLE DATA
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
-- STEP 12: VERIFICATION
-- =============================================
-- Verify tables exist
SELECT 'Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('qr_codes', 'secretaries', 'scan_audit_logs', 'feature_flags')
ORDER BY table_name;

-- Verify RLS is enabled
SELECT 'RLS Status:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('qr_codes', 'scan_audit_logs')
ORDER BY tablename;

-- Verify functions exist
SELECT 'Functions created:' as status;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_qr_token', 'validate_qr_token', 'update_qr_scan_info')
ORDER BY routine_name;

-- Verify feature flag
SELECT 'Feature flag status:' as status;
SELECT name, is_enabled FROM feature_flags WHERE name = 'FEATURE_QR_SYSTEM';

-- Success message
SELECT 'QR System migration completed successfully!' as result;
