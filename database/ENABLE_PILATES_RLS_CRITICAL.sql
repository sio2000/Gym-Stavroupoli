-- CRITICAL FIX: Enable RLS για Pilates Tables
-- Το Supabase linter βρήκε ότι υπάρχουν policies αλλά το RLS δεν είναι enabled!

-- 1. Enable RLS για pilates_bookings
ALTER TABLE public.pilates_bookings ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS για pilates_schedule_slots  
ALTER TABLE public.pilates_schedule_slots ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS για pilates_deposits (αν δεν είναι ήδη)
ALTER TABLE public.pilates_deposits ENABLE ROW LEVEL SECURITY;

-- 4. Επιβεβαίωση ότι τα policies υπάρχουν (θα τα recreate για σιγουριά)

-- Policies για pilates_schedule_slots
DROP POLICY IF EXISTS "Anyone can view active pilates slots" ON pilates_schedule_slots;
CREATE POLICY "Anyone can view active pilates slots" ON pilates_schedule_slots
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage pilates slots" ON pilates_schedule_slots;
CREATE POLICY "Admins can manage pilates slots" ON pilates_schedule_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- Policies για pilates_bookings
DROP POLICY IF EXISTS "Users can view own pilates bookings" ON pilates_bookings;
CREATE POLICY "Users can view own pilates bookings" ON pilates_bookings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own pilates bookings" ON pilates_bookings;
CREATE POLICY "Users can create own pilates bookings" ON pilates_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pilates bookings" ON pilates_bookings;
CREATE POLICY "Users can update own pilates bookings" ON pilates_bookings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all pilates bookings" ON pilates_bookings;
CREATE POLICY "Admins can view all pilates bookings" ON pilates_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

DROP POLICY IF EXISTS "Admins can manage all pilates bookings" ON pilates_bookings;
CREATE POLICY "Admins can manage all pilates bookings" ON pilates_bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- Policies για pilates_deposits
DROP POLICY IF EXISTS "pilates_deposits_select_own_or_admin" ON pilates_deposits;
CREATE POLICY "pilates_deposits_select_own_or_admin" ON pilates_deposits
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

DROP POLICY IF EXISTS "pilates_deposits_modify_admin_only" ON pilates_deposits;
CREATE POLICY "pilates_deposits_modify_admin_only" ON pilates_deposits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- Comment
COMMENT ON TABLE public.pilates_bookings IS 'RLS enabled and policies configured for secure access';
COMMENT ON TABLE public.pilates_schedule_slots IS 'RLS enabled and policies configured for secure access';
COMMENT ON TABLE public.pilates_deposits IS 'RLS enabled and policies configured for secure access';

