-- URGENT FIX: Free Gym Duration Order Problem
-- Εκτέλεση στο Supabase SQL Editor

-- Το πρόβλημα: Το "month" duration έχει 365 ημέρες αντί για 30
-- Αυτό προκαλεί λάθος σειρά στο modal

-- 1. Έλεγχος του προβλήματος
SELECT 'BEFORE FIX - Current Free Gym durations:' as step;

SELECT 
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym'
ORDER BY mpd.duration_days;

-- 2. Διόρθωση: Αλλαγή του month duration από 365 σε 30 ημέρες
UPDATE membership_package_durations 
SET duration_days = 30
WHERE package_id IN (
    SELECT id FROM membership_packages WHERE name = 'Free Gym'
) 
AND duration_type = 'month' 
AND duration_days = 365;

-- 3. Επαλήθευση της διόρθωσης
SELECT 'AFTER FIX - Corrected Free Gym durations:' as step;

SELECT 
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym'
ORDER BY mpd.duration_days;

-- 4. Επιβεβαίωση ότι η σειρά είναι τώρα σωστή
SELECT 'Expected order should be:' as info;
SELECT '1. lesson (1 day) - €10.00' as order_1;
SELECT '2. month (30 days) - €50.00' as order_2;
SELECT '3. semester (180 days) - €150.00' as order_3;
SELECT '4. year (365 days) - €240.00' as order_4;
