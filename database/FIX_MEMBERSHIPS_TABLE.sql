-- FIX MEMBERSHIPS TABLE - Διόρθωση memberships table
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Δημιουργία memberships table αν δεν υπάρχει
CREATE TABLE IF NOT EXISTS memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES membership_packages(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Δημιουργία indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_package_id ON memberships(package_id);
CREATE INDEX IF NOT EXISTS idx_memberships_is_active ON memberships(is_active);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);

-- 3. Ενεργοποίηση RLS
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON memberships;
CREATE POLICY "Users can view their own memberships" ON memberships
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all memberships" ON memberships;
CREATE POLICY "Admins can manage all memberships" ON memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
        )
    );

-- 5. Έλεγχος αποτελεσμάτων
SELECT 'Memberships table created/updated successfully!' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;
