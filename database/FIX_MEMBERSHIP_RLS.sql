-- FIX MEMBERSHIP RLS - Διόρθωση RLS policies για membership packages
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Διαγραφή υπαρχόντων RLS policies για membership_packages
DROP POLICY IF EXISTS "Enable read access for all users" ON membership_packages;
DROP POLICY IF EXISTS "Enable read access for all users" ON membership_package_durations;

-- 2. Δημιουργία νέων RLS policies που επιτρέπουν σε όλους να βλέπουν τα πακέτα
CREATE POLICY "Enable read access for all users" ON membership_packages
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON membership_package_durations
    FOR SELECT USING (true);

-- 3. Έλεγχος αν τα policies δημιουργήθηκαν σωστά
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('membership_packages', 'membership_package_durations')
ORDER BY tablename, policyname;

-- 4. Test query για να δούμε αν λειτουργεί
SELECT 'Testing membership packages query...' as test;
SELECT COUNT(*) as package_count FROM membership_packages WHERE is_active = true;
SELECT * FROM membership_packages WHERE is_active = true;

-- 5. Test query για durations
SELECT 'Testing membership package durations query...' as test;
SELECT COUNT(*) as duration_count FROM membership_package_durations WHERE is_active = true;
SELECT 
    mpd.id,
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mpd.is_active = true AND mp.is_active = true
ORDER BY mp.name, mpd.duration_days;
