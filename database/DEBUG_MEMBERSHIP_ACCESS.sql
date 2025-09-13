-- DEBUG MEMBERSHIP ACCESS - Έλεγχος πρόσβασης στα membership packages
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος αν υπάρχουν πακέτα στη βάση
SELECT 'Step 1: Checking if packages exist in database' as step;
SELECT COUNT(*) as package_count FROM membership_packages;
SELECT * FROM membership_packages;

-- 2. Έλεγχος αν τα πακέτα είναι active
SELECT 'Step 2: Checking active packages' as step;
SELECT COUNT(*) as active_package_count FROM membership_packages WHERE is_active = true;
SELECT * FROM membership_packages WHERE is_active = true;

-- 3. Έλεγχος RLS policies για membership_packages
SELECT 'Step 3: Checking RLS policies for membership_packages' as step;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'membership_packages'
ORDER BY policyname;

-- 4. Έλεγχος αν ο πίνακας έχει RLS enabled
SELECT 'Step 4: Checking if RLS is enabled on membership_packages' as step;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'membership_packages';

-- 5. Έλεγχος αν υπάρχουν duration options
SELECT 'Step 5: Checking duration options' as step;
SELECT COUNT(*) as duration_count FROM membership_package_durations;
SELECT 
    mpd.id,
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
ORDER BY mp.name, mpd.duration_days;

-- 6. Test query που θα κάνει η εφαρμογή
SELECT 'Step 6: Testing the exact query the app will make' as step;
SELECT * 
FROM membership_packages 
WHERE is_active = true 
ORDER BY name;

-- 7. Έλεγχος αν υπάρχει πρόβλημα με το package_type column
SELECT 'Step 7: Checking package_type column' as step;
SELECT 
    id,
    name,
    package_type,
    is_active
FROM membership_packages
ORDER BY name;
