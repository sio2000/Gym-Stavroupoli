-- FIX FREE GYM PACKAGE - Διόρθωση Free Gym package με σωστό price
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Διαγραφή υπαρχόντων Free Gym packages (για καθαρισμό)
DELETE FROM membership_package_durations 
WHERE package_id IN (SELECT id FROM membership_packages WHERE name = 'Free Gym');

DELETE FROM membership_packages WHERE name = 'Free Gym';

-- 2. Δημιουργία Free Gym package με default values
INSERT INTO membership_packages (name, description, price, duration_days, package_type, is_active)
VALUES ('Free Gym', 'Απεριόριστη πρόσβαση στο γυμναστήριο', 0.00, 1, 'standard', true);

-- 3. Δημιουργία duration options για Free Gym
INSERT INTO membership_package_durations (package_id, duration_type, duration_days, price, is_active)
SELECT 
    mp.id,
    d.duration_type,
    d.duration_days,
    d.price,
    true
FROM membership_packages mp
CROSS JOIN (VALUES
    ('year', 365, 240.00),
    ('semester', 180, 150.00),
    ('month', 30, 50.00),
    ('lesson', 1, 10.00)
) AS d(duration_type, duration_days, price)
WHERE mp.name = 'Free Gym';

-- 4. Έλεγχος αποτελεσμάτων
SELECT 'Free Gym package created successfully!' as status;

SELECT 
    mp.id,
    mp.name,
    mp.description,
    mp.price,
    mp.is_active,
    COUNT(mpd.id) as duration_options
FROM membership_packages mp
LEFT JOIN membership_package_durations mpd ON mp.id = mpd.package_id
WHERE mp.name = 'Free Gym'
GROUP BY mp.id, mp.name, mp.description, mp.price, mp.is_active;

SELECT 'Free Gym duration options:' as info;

SELECT 
    mpd.id,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym'
ORDER BY mpd.duration_days;
