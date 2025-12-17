-- CREATE BANNERS TABLE - ΔΗΜΙΟΥΡΓΙΑ ΠΙΝΑΚΑ BANNERS
-- Εκτέλεση στο Supabase SQL Editor

-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    image_url TEXT NOT NULL,
    target_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for display order
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);

-- Enable RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage banners" ON banners;
DROP POLICY IF EXISTS "Public can view active banners" ON banners;

-- Create RLS policies
-- Admins can do everything
CREATE POLICY "Admins can manage banners" ON banners
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Public can view active banners
CREATE POLICY "Public can view active banners" ON banners
    FOR SELECT
    USING (is_active = true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_banners_updated_at_trigger ON banners;
CREATE TRIGGER update_banners_updated_at_trigger
    BEFORE UPDATE ON banners
    FOR EACH ROW
    EXECUTE FUNCTION update_banners_updated_at();

