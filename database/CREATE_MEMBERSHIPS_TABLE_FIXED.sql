-- CREATE MEMBERSHIPS TABLE - Δημιουργία πίνακα για ενεργές συνδρομές (FIXED VERSION)
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος αν υπάρχουν οι απαραίτητοι πίνακες
DO $$
BEGIN
    -- Έλεγχος αν υπάρχει ο πίνακας membership_packages
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_packages') THEN
        RAISE EXCEPTION 'membership_packages table does not exist. Please run CREATE_MEMBERSHIP_SYSTEM_FIXED.sql first.';
    END IF;
    
    -- Έλεγχος αν υπάρχει ο πίνακας user_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE EXCEPTION 'user_profiles table does not exist. Please ensure user_profiles table is created first.';
    END IF;
END $$;

-- 2. Δημιουργία πίνακα memberships για ενεργές συνδρομές
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

-- 3. Δημιουργία indexes για βελτιστοποίηση
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_package_id ON memberships(package_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);

-- 4. Δημιουργία RLS policies
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

-- 5. Δημιουργία function για αυτόματη λήξη συνδρομών
CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS void AS $$
BEGIN
    UPDATE memberships 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 6. Δημιουργία trigger για updated_at
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

-- 7. Δημιουργία function για έλεγχο ενεργών συνδρομών
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

-- 8. Έλεγχος ότι ο πίνακας δημιουργήθηκε επιτυχώς
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
        RAISE NOTICE 'SUCCESS: memberships table created successfully';
    ELSE
        RAISE EXCEPTION 'FAILED: memberships table was not created';
    END IF;
END $$;
