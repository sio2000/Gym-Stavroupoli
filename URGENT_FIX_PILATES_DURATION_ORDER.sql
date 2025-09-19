-- URGENT FIX: Pilates Duration Order Problem
-- Εκτέλεση στο Supabase SQL Editor

-- Το πρόβλημα: Τα Pilates durations δεν εμφανίζονται στη σωστή σειρά
-- Βάσει της εικόνας, η σειρά είναι: 1, 8, 16, 25, 4, 50 μαθήματα

-- 1. Έλεγχος του προβλήματος
SELECT 'BEFORE FIX - Current Pilates durations:' as step;

SELECT 
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.classes_count,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Pilates'
ORDER BY mpd.classes_count;

-- 2. Η σωστή σειρά βάσει των μαθημάτων θα πρέπει να είναι:
-- 1 Μάθημα (Trial): 1 μάθημα - €6,00
-- 4 Μαθήματα (1 μήνας): 4 μαθήματα - €44,00  
-- 8 Μαθήματα (2 μήνες): 8 μαθήματα - €80,00
-- 16 Μαθημάτων (3 μήνες): 16 μαθήματα - €144,00
-- 25 Μαθημάτων (6 μήνες): 25 μαθήματα - €190,00
-- 50 Μαθημάτων (1 έτος): 50 μαθήματα - €350,00

-- 3. Αν χρειάζεται, μπορούμε να διορθώσουμε τα duration_days για να αντιστοιχούν στα μαθήματα
-- Για τώρα θα δούμε τι υπάρχει

-- 4. Επαλήθευση της τρέχουσας κατάστασης
SELECT 'Current Pilates durations with expected order:' as step;

SELECT 
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.classes_count,
    mpd.price,
    mpd.is_active,
    CASE 
        WHEN mpd.classes_count = 1 THEN 1
        WHEN mpd.classes_count = 4 THEN 2
        WHEN mpd.classes_count = 8 THEN 3
        WHEN mpd.classes_count = 16 THEN 4
        WHEN mpd.classes_count = 25 THEN 5
        WHEN mpd.classes_count = 50 THEN 6
        ELSE 999
    END as expected_order
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Pilates'
ORDER BY expected_order;

-- 5. Πληροφορίες για τη σωστή σειρά
SELECT 'Expected Pilates order should be:' as info;
SELECT '1. 1 Μάθημα (Trial) - €6.00' as order_1;
SELECT '2. 4 Μαθήματα (1 μήνας) - €44.00' as order_2;
SELECT '3. 8 Μαθήματα (2 μήνες) - €80.00' as order_3;
SELECT '4. 16 Μαθημάτων (3 μήνες) - €144.00' as order_4;
SELECT '5. 25 Μαθημάτων (6 μήνες) - €190.00' as order_5;
SELECT '6. 50 Μαθημάτων (1 έτος) - €350.00' as order_6;
