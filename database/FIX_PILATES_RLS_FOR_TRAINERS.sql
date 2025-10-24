-- CRITICAL FIX: Allow Trainers to View Pilates Bookings
-- Το RLS μπλόκαρε τους trainers από το να δουν ποιοι χρήστες έχουν κάνει κράτηση

-- 1. DROP το existing "Admins can view all" policy
DROP POLICY IF EXISTS "Admins can view all pilates bookings" ON public.pilates_bookings;

-- 2. CREATE νέο policy που επιτρέπει σε admins, secretaries ΚΑΙ trainers
CREATE POLICY "Admins, secretaries and trainers can view all pilates bookings" ON public.pilates_bookings
    FOR SELECT USING (
        -- Regular users see only their own
        auth.uid() = user_id
        OR
        -- Admins, secretaries και trainers see all
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary', 'trainer')
        )
    );

-- 3. Επίσης update το policy για "manage all" να include trainers
DROP POLICY IF EXISTS "Admins can manage all pilates bookings" ON public.pilates_bookings;

CREATE POLICY "Admins and secretaries can manage all pilates bookings" ON public.pilates_bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

-- 4. Ensure το policy για "Users can view own" είναι ακόμα active
-- (Αυτό ήδη υπάρχει, δεν χρειάζεται αλλαγή)

-- Comment
COMMENT ON POLICY "Admins, secretaries and trainers can view all pilates bookings" ON public.pilates_bookings IS 
'Allows trainers to view all bookings so they can see which users booked their classes. Admins and secretaries can also view all.';

-- 5. Επιβεβαίωση ότι το RLS είναι enabled
ALTER TABLE public.pilates_bookings ENABLE ROW LEVEL SECURITY;

-- 6. Test query για verification (comment out αν δεν θέλεις να τρέξει)
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'pilates_bookings';

