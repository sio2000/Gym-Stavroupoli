-- SQL Script για μηδενισμό Kettlebell Points και Cash Register Data
-- Προσοχή: Αυτό το script θα διαγράψει ΟΛΑ τα δεδομένα!

-- 1. Μηδενισμός Kettlebell Points Ranking
-- Διαγραφή όλων των Kettlebell Points από όλους τους χρήστες
DELETE FROM user_kettlebell_points;

-- Επαναφορά του sequence αν υπάρχει
-- (Αυτό είναι προαιρετικό, αλλά βοηθάει να ξεκινήσουμε από το 1)
-- ALTER SEQUENCE IF EXISTS user_kettlebell_points_id_seq RESTART WITH 1;

-- 2. Μηδενισμός Cash Register Data
-- Διαγραφή όλων των cash transactions (μετρητά και POS)
DELETE FROM user_cash_transactions;

-- Επαναφορά του sequence αν υπάρχει
-- ALTER SEQUENCE IF EXISTS user_cash_transactions_id_seq RESTART WITH 1;

-- 3. Μηδενισμός Referral Points (προαιρετικό - αν θέλεις να μηδενίσεις και αυτά)
-- DELETE FROM user_referral_points;
-- DELETE FROM referral_transactions;

-- 4. Επαλήθευση ότι τα δεδομένα μηδενίστηκαν
-- Έλεγχος Kettlebell Points
SELECT 
    'Kettlebell Points' as table_name,
    COUNT(*) as remaining_records,
    COALESCE(SUM(points), 0) as total_points
FROM user_kettlebell_points;

-- Έλεγχος Cash Transactions
SELECT 
    'Cash Transactions' as table_name,
    COUNT(*) as remaining_records,
    COALESCE(SUM(amount), 0) as total_amount,
    COALESCE(SUM(CASE WHEN transaction_type = 'cash' THEN amount ELSE 0 END), 0) as total_cash,
    COALESCE(SUM(CASE WHEN transaction_type = 'pos' THEN amount ELSE 0 END), 0) as total_pos
FROM user_cash_transactions;

-- Έλεγχος συνολικών συναλλαγών
SELECT 
    'Total Transactions' as summary,
    COUNT(*) as transaction_count,
    COALESCE(SUM(amount), 0) as total_euros
FROM user_cash_transactions;

-- Επιπλέον έλεγχος για να βεβαιωθούμε ότι όλα είναι 0
SELECT 
    'VERIFICATION' as status,
    CASE 
        WHEN (SELECT COUNT(*) FROM user_kettlebell_points) = 0 
        AND (SELECT COUNT(*) FROM user_cash_transactions) = 0 
        THEN 'SUCCESS: All data reset to zero'
        ELSE 'WARNING: Some data still exists'
    END as result;
