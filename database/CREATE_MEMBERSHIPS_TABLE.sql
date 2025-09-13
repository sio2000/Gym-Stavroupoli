-- CREATE MEMBERSHIPS TABLE - Δημιουργία πίνακα για ενεργές συνδρομές
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Δημιουργία πίνακα memberships για ενεργές συνδρομές
CREATE TABLE IF NOT EXISTS memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES membership_packages(id) ON DELETE CASCADE,
    duration_type TEXT NOT NULL CHECK (duration_type IN ('year', 'semester', 'month', 'lesson')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
    approved_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Δημιουργία indexes για βελτιστοποίηση
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_package_id ON memberships(package_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);

-- 3. Δημιουργία RLS policies
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own memberships
CREATE POLICY "Users can view own memberships" ON memberships
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins and secretaries can view all memberships
CREATE POLICY "Admins can view all memberships" ON memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- Policy: Only admins and secretaries can insert memberships
CREATE POLICY "Admins can insert memberships" ON memberships
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- Policy: Only admins and secretaries can update memberships
CREATE POLICY "Admins can update memberships" ON memberships
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- 4. Δημιουργία function για αυτόματη λήξη συνδρομών
CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS void AS $$
BEGIN
    UPDATE memberships 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 5. Δημιουργία trigger για updated_at
CREATE OR REPLACE FUNCTION update_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_memberships_updated_at
    BEFORE UPDATE ON memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_memberships_updated_at();

-- 6. Δημιουργία function για έλεγχο ενεργών συνδρομών
CREATE OR REPLACE FUNCTION get_user_active_memberships(user_uuid UUID)
RETURNS TABLE (
    membership_id UUID,
    package_name TEXT,
    duration_type TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        mp.name,
        m.duration_type,
        m.start_date,
        m.end_date,
        m.status
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.user_id = user_uuid
    AND m.status = 'active'
    ORDER BY m.end_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Test data insertion (optional)
-- INSERT INTO memberships (user_id, package_id, duration_type, start_date, end_date, status)
-- SELECT 
--     '67957830-ace0-4285-89f2-3a008b65b147', -- Replace with actual user ID
--     mp.id,
--     'month',
--     CURRENT_DATE,
--     CURRENT_DATE + INTERVAL '30 days',
--     'active'
-- FROM membership_packages mp
-- WHERE mp.name = 'Free Gym'
-- LIMIT 1;
