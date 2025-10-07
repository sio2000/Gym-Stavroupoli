-- Προσθήκη αιτήματος συνδρομής Pilates για Μαρία Σαββαϊδου με δόσεις
-- Εκτέλεση στο Supabase SQL Editor

-- Βήμα 1: Βρίσκουμε το user_id της Μαρίας Σαββαϊδου
SELECT 'Βρίσκουμε το user_id της Μαρίας Σαββαϊδου...' as step;

-- Ελέγχουμε αν υπάρχει ήδη η χρήστρια
SELECT 
    user_id,
    first_name,
    last_name,
    email,
    phone
FROM user_profiles 
WHERE email = 'mariasavvaidou22@gmail.com'
   OR phone = '6989227232'
   OR (first_name ILIKE '%μαρία%' AND last_name ILIKE '%σαββαϊδου%');

-- Βήμα 2: Βρίσκουμε το package_id του πακέτου Pilates 6 μήνες
SELECT 'Βρίσκουμε το πακέτο Pilates 6 μήνες...' as step;

SELECT 
    mp.id as package_id,
    mp.name as package_name,
    mpd.id as duration_id,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.classes_count
FROM membership_packages mp
JOIN membership_package_durations mpd ON mp.id = mpd.package_id
WHERE mp.name = 'Pilates' 
  AND mpd.duration_type = 'pilates_6months';

-- Βήμα 3: Δημιουργούμε το αίτημα συνδρομής με δόσεις
-- Υποθέτουμε ότι η Μαρία υπάρχει στη βάση (αν δεν υπάρχει, θα χρειαστεί να δημιουργηθεί πρώτα)

WITH user_data AS (
    SELECT user_id 
    FROM user_profiles 
    WHERE email = 'mariasavvaidou22@gmail.com'
    LIMIT 1
),
package_data AS (
    SELECT 
        mp.id as package_id,
        mpd.price
    FROM membership_packages mp
    JOIN membership_package_durations mpd ON mp.id = mpd.package_id
    WHERE mp.name = 'Pilates' 
      AND mpd.duration_type = 'pilates_6months'
    LIMIT 1
)
INSERT INTO membership_requests (
    user_id,
    package_id,
    duration_type,
    requested_price,
    status,
    has_installments,
    installment_1_amount,
    installment_2_amount,
    installment_3_amount,
    installment_1_payment_method,
    installment_2_payment_method,
    installment_3_payment_method,
    installment_1_paid,
    installment_2_paid,
    installment_3_paid,
    all_installments_paid,
    created_at,
    updated_at
)
SELECT 
    ud.user_id,
    pd.package_id,
    'pilates_6months',
    pd.price,
    'pending',
    true, -- έχει δόσεις
    ROUND(pd.price / 3, 2), -- 1η δόση
    ROUND(pd.price / 3, 2), -- 2η δόση
    ROUND(pd.price / 3, 2), -- 3η δόση
    'cash', -- μέθοδος πληρωμής 1ης δόσης
    'cash', -- μέθοδος πληρωμής 2ης δόσης
    'cash', -- μέθοδος πληρωμής 3ης δόσης
    false, -- 1η δόση δεν έχει πληρωθεί
    false, -- 2η δόση δεν έχει πληρωθεί
    false, -- 3η δόση δεν έχει πληρωθεί
    false, -- δεν έχουν πληρωθεί όλες οι δόσεις
    NOW(),
    NOW()
FROM user_data ud, package_data pd
WHERE ud.user_id IS NOT NULL 
  AND pd.package_id IS NOT NULL;

-- Βήμα 4: Επαληθεύουμε την εισαγωγή
SELECT 'Επαληθεύουμε το αίτημα συνδρομής...' as step;

SELECT 
    mr.id as request_id,
    mr.user_id,
    CONCAT(up.first_name, ' ', up.last_name) as user_name,
    up.email,
    up.phone,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.has_installments,
    mr.installment_1_amount,
    mr.installment_2_amount,
    mr.installment_3_amount,
    mr.installment_1_paid,
    mr.installment_2_paid,
    mr.installment_3_paid,
    mr.all_installments_paid,
    mr.created_at
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE up.email = 'mariasavvaidou22@gmail.com'
  AND mp.name = 'Pilates'
  AND mr.duration_type = 'pilates_6months'
ORDER BY mr.created_at DESC
LIMIT 1;

-- Βήμα 5: Εμφανίζουμε τα στοιχεία των δόσεων
SELECT 'Στοιχεία δόσεων:' as info;

WITH request_data AS (
    SELECT 
        mr.id as request_id,
        CONCAT(up.first_name, ' ', up.last_name) as user_name,
        mr.installment_1_amount,
        mr.installment_2_amount,
        mr.installment_3_amount,
        mr.installment_1_payment_method,
        mr.installment_2_payment_method,
        mr.installment_3_payment_method,
        mr.installment_1_paid,
        mr.installment_2_paid,
        mr.installment_3_paid,
        mr.installment_1_paid_at,
        mr.installment_2_paid_at,
        mr.installment_3_paid_at
    FROM membership_requests mr
    JOIN user_profiles up ON mr.user_id = up.user_id
    WHERE up.email = 'mariasavvaidou22@gmail.com'
      AND mr.duration_type = 'pilates_6months'
    ORDER BY mr.created_at DESC
    LIMIT 1
)
SELECT 
    request_id,
    user_name,
    '1η Δόση' as installment_name,
    installment_1_amount as amount,
    installment_1_payment_method as payment_method,
    installment_1_paid as paid,
    installment_1_paid_at as paid_at
FROM request_data

UNION ALL

SELECT 
    request_id,
    user_name,
    '2η Δόση' as installment_name,
    installment_2_amount as amount,
    installment_2_payment_method as payment_method,
    installment_2_paid as paid,
    installment_2_paid_at as paid_at
FROM request_data

UNION ALL

SELECT 
    request_id,
    user_name,
    '3η Δόση' as installment_name,
    installment_3_amount as amount,
    installment_3_payment_method as payment_method,
    installment_3_paid as paid,
    installment_3_paid_at as paid_at
FROM request_data;

-- Success message
SELECT 'Το αίτημα συνδρομής Pilates για τη Μαρία Σαββαϊδου δημιουργήθηκε επιτυχώς!' as result;
