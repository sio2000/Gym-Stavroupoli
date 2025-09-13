-- TEST APPROVED MEMBERSHIP - Έλεγχος εγκεκριμένων αιτημάτων
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος εγκεκριμένων αιτημάτων
SELECT 'Step 1: Checking approved membership requests' as step;
SELECT 
    mr.id,
    mr.user_id,
    mr.status,
    mr.approved_at,
    up.first_name,
    up.last_name,
    up.email
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
WHERE mr.status = 'approved'
ORDER BY mr.approved_at DESC;

-- 2. Έλεγχος αν υπάρχουν pending αιτήματα
SELECT 'Step 2: Checking pending membership requests' as step;
SELECT 
    mr.id,
    mr.user_id,
    mr.status,
    mr.created_at,
    up.first_name,
    up.last_name,
    up.email
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
WHERE mr.status = 'pending'
ORDER BY mr.created_at DESC;

-- 3. Έλεγχος συνολικών αιτημάτων
SELECT 'Step 3: Total membership requests count' as step;
SELECT 
    status,
    COUNT(*) as count
FROM membership_requests
GROUP BY status
ORDER BY status;

-- 4. Test query για να δούμε αν ο χρήστης έχει εγκεκριμένο αίτημα
SELECT 'Step 4: Test query for specific user' as step;
-- Αντικαταστήστε το user_id με το πραγματικό ID του χρήστη
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'User has approved membership'
        ELSE 'User has no approved membership'
    END as membership_status
FROM membership_requests
WHERE user_id = '67957830-ace0-4285-89f2-3a008b65b147' -- Αντικαταστήστε με το πραγματικό user_id
AND status = 'approved';
