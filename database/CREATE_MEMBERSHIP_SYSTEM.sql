-- CREATE MEMBERSHIP SYSTEM - ΔΗΜΙΟΥΡΓΙΑ ΣΥΣΤΗΜΑΤΟΣ ΣΥΝΔΡΟΜΩΝ (FIXED VERSION)
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Δημιουργία πίνακα membership_package_durations για δυναμικές τιμές
CREATE TABLE IF NOT EXISTS membership_package_durations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID NOT NULL REFERENCES membership_packages(id) ON DELETE CASCADE,
    duration_type TEXT NOT NULL CHECK (duration_type IN ('year', 'semester', 'month', 'lesson')),
    duration_days INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(package_id, duration_type)
);

-- 2. Δημιουργία πίνακα membership_requests για αιτήματα συνδρομών
CREATE TABLE IF NOT EXISTS membership_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES membership_packages(id) ON DELETE CASCADE,
    duration_type TEXT NOT NULL CHECK (duration_type IN ('year', 'semester', 'month', 'lesson')),
    requested_price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejected_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Προσθήκη unique constraint στο name αν δεν υπάρχει
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_membership_package_name' 
        AND table_name = 'membership_packages'
    ) THEN
        ALTER TABLE membership_packages ADD CONSTRAINT unique_membership_package_name UNIQUE (name);
    END IF;
END $$;

-- 4. Προσθήκη package_type column αν δεν υπάρχει
ALTER TABLE membership_packages ADD COLUMN IF NOT EXISTS package_type TEXT DEFAULT 'standard' CHECK (package_type IN ('standard', 'free_gym', 'personal_training'));

-- 5. Εισαγωγή Free Gym πακέτου (χωρίς ON CONFLICT για ασφάλεια)
INSERT INTO membership_packages (name, description, duration_days, price, features, is_active, package_type) 
SELECT 
    'Free Gym',
    'Απεριόριστη πρόσβαση στο γυμναστήριο',
    365,
    0,
    ARRAY['Απεριόριστη πρόσβαση', 'Όλες οι αίθουσες', 'Εξοπλισμός γυμναστηρίου'],
    TRUE,
    'free_gym'
WHERE NOT EXISTS (SELECT 1 FROM membership_packages WHERE name = 'Free Gym');

-- 6. Εισαγωγή duration options για Free Gym πακέτο
INSERT INTO membership_package_durations (package_id, duration_type, duration_days, price, is_active)
SELECT 
    mp.id,
    d.duration_type,
    d.duration_days,
    d.price,
    TRUE
FROM membership_packages mp
CROSS JOIN (VALUES 
    ('year', 365, 240.00),
    ('semester', 180, 150.00),
    ('month', 30, 50.00),
    ('lesson', 1, 10.00)
) AS d(duration_type, duration_days, price)
WHERE mp.name = 'Free Gym'
ON CONFLICT (package_id, duration_type) DO UPDATE SET
    duration_days = EXCLUDED.duration_days,
    price = EXCLUDED.price,
    updated_at = NOW();

-- 7. Δημιουργία indexes για βελτιστοποίηση
CREATE INDEX IF NOT EXISTS idx_membership_package_durations_package_id ON membership_package_durations(package_id);
CREATE INDEX IF NOT EXISTS idx_membership_package_durations_duration_type ON membership_package_durations(duration_type);
CREATE INDEX IF NOT EXISTS idx_membership_package_durations_is_active ON membership_package_durations(is_active);

CREATE INDEX IF NOT EXISTS idx_membership_requests_user_id ON membership_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_requests_package_id ON membership_requests(package_id);
CREATE INDEX IF NOT EXISTS idx_membership_requests_status ON membership_requests(status);
CREATE INDEX IF NOT EXISTS idx_membership_requests_created_at ON membership_requests(created_at);

-- 8. Ενεργοποίηση RLS
ALTER TABLE membership_package_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies για membership_package_durations
CREATE POLICY "Everyone can view active package durations" ON membership_package_durations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage package durations" ON membership_package_durations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 10. RLS Policies για membership_requests
CREATE POLICY "Users can view their own requests" ON membership_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create requests" ON membership_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins and Secretaries can view all requests" ON membership_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
        )
    );

CREATE POLICY "Admins and Secretaries can update requests" ON membership_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
        )
    );

-- 11. Δημιουργία function για ενημέρωση updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Δημιουργία triggers για updated_at
CREATE TRIGGER update_membership_package_durations_updated_at 
    BEFORE UPDATE ON membership_package_durations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_requests_updated_at 
    BEFORE UPDATE ON membership_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Membership system created successfully!' as message;
