-- DELETE SPECIFIC SUBSCRIPTION REQUESTS
-- This script deletes exactly the subscription requests listed in the requirements
-- Date: 2025-09-22
-- 
-- Target requests to delete:
-- 1. gkan gkan (doremo6025@poesd.com) - Pilates 4 Μαθήματα (1 μήνας) 44,00 € 22/9/2025 Εγκεκριμένο
-- 2. gkan gkan (doremo6025@poesd.com) - Pilates 1 Μάθημα (Trial) 6,00 € 22/9/2025 Εγκεκριμένο
-- 3. fewfwe ewffeww (vaxideg303@reifide.com) - Pilates 8 Μαθήματα (2 μήνες) 80,00 € 22/9/2025 Εγκεκριμένο
-- 4. fewfwe ewffeww (vaxideg303@reifide.com) - Pilates 8 Μαθήματα (2 μήνες) 80,00 € 22/9/2025 Απορριφθέν
-- 5. nik nuj (xowoh24265@merumart.com) - Pilates 8 Μαθήματα (2 μήνες) 0,00 € 22/9/2025 Εγκεκριμένο
-- 6. nik nuj (xowoh24265@merumart.com) - Pilates 4 Μαθήματα (1 μήνας) (price?) 22/9/2025 (status?)

-- =============================================
-- 1. FIRST, SELECT THE RECORDS TO VERIFY
-- =============================================

-- Verify the records that will be deleted
SELECT 'RECORDS TO BE DELETED - VERIFICATION QUERY:' as info;

SELECT 
    mr.id,
    up.email,
    up.first_name,
    up.last_name,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.created_at,
    mr.classes_count
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE (
    -- gkan gkan (doremo6025@poesd.com) - Pilates 4 Μαθήματα (1 μήνας) 44,00 € Εγκεκριμένο
    (up.email = 'doremo6025@poesd.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_1month' 
     AND mr.requested_price = 44.00 
     AND mr.status = 'approved'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    -- gkan gkan (doremo6025@poesd.com) - Pilates 1 Μάθημα (Trial) 6,00 € Εγκεκριμένο
    (up.email = 'doremo6025@poesd.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_trial' 
     AND mr.requested_price = 6.00 
     AND mr.status = 'approved'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    -- fewfwe ewffeww (vaxideg303@reifide.com) - Pilates 8 Μαθήματα (2 μήνες) 80,00 € Εγκεκριμένο
    (up.email = 'vaxideg303@reifide.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_2months' 
     AND mr.requested_price = 80.00 
     AND mr.status = 'approved'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    -- fewfwe ewffeww (vaxideg303@reifide.com) - Pilates 8 Μαθήματα (2 μήνες) 80,00 € Απορριφθέν
    (up.email = 'vaxideg303@reifide.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_2months' 
     AND mr.requested_price = 80.00 
     AND mr.status = 'rejected'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    -- nik nuj (xowoh24265@merumart.com) - Pilates 8 Μαθήματα (2 μήνες) 0,00 € Εγκεκριμένο
    (up.email = 'xowoh24265@merumart.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_2months' 
     AND mr.requested_price = 0.00 
     AND mr.status = 'approved'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    -- nik nuj (xowoh24265@merumart.com) - Pilates 4 Μαθήματα (1 μήνας) - any price, any status
    (up.email = 'xowoh24265@merumart.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_1month'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
)
ORDER BY up.email, mr.created_at;

-- =============================================
-- 2. BACKUP THE RECORDS BEFORE DELETION
-- =============================================

-- Create backup table with the records to be deleted
CREATE TEMP TABLE IF NOT EXISTS deleted_requests_backup AS
SELECT 
    mr.*,
    up.email,
    up.first_name,
    up.last_name,
    mp.name as package_name
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE (
    -- Same conditions as above
    (up.email = 'doremo6025@poesd.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_1month' 
     AND mr.requested_price = 44.00 
     AND mr.status = 'approved'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    (up.email = 'doremo6025@poesd.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_trial' 
     AND mr.requested_price = 6.00 
     AND mr.status = 'approved'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    (up.email = 'vaxideg303@reifide.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_2months' 
     AND mr.requested_price = 80.00 
     AND mr.status = 'approved'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    (up.email = 'vaxideg303@reifide.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_2months' 
     AND mr.requested_price = 80.00 
     AND mr.status = 'rejected'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    (up.email = 'xowoh24265@merumart.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_2months' 
     AND mr.requested_price = 0.00 
     AND mr.status = 'approved'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    (up.email = 'xowoh24265@merumart.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_1month'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
);

SELECT 'BACKUP CREATED - Records to be deleted:' as info;
SELECT COUNT(*) as backup_count FROM deleted_requests_backup;

-- =============================================
-- 3. TRANSACTION-SAFE DELETION
-- =============================================

-- Start transaction
BEGIN;

-- Delete the specific records
DELETE FROM membership_requests 
WHERE id IN (
    SELECT id FROM deleted_requests_backup
);

-- Verify deletion
SELECT 'DELETION VERIFICATION - Remaining records count:' as info;
SELECT COUNT(*) as remaining_count FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE (
    (up.email = 'doremo6025@poesd.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_1month' 
     AND mr.requested_price = 44.00 
     AND mr.status = 'approved'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    (up.email = 'doremo6025@poesd.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_trial' 
     AND mr.requested_price = 6.00 
     AND mr.status = 'approved'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    (up.email = 'vaxideg303@reifide.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_2months' 
     AND mr.requested_price = 80.00 
     AND mr.status = 'approved'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    (up.email = 'vaxideg303@reifide.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_2months' 
     AND mr.requested_price = 80.00 
     AND mr.status = 'rejected'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    (up.email = 'xowoh24265@merumart.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_2months' 
     AND mr.requested_price = 0.00 
     AND mr.status = 'approved'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
    
    OR
    
    (up.email = 'xowoh24265@merumart.com' 
     AND mp.name = 'Pilates' 
     AND mr.duration_type = 'pilates_1month'
     AND mr.created_at >= '2025-09-22T00:00:00+00:00'
     AND mr.created_at < '2025-09-23T00:00:00+00:00')
);

-- If verification shows 0 remaining records, commit the transaction
-- If not, rollback
-- Note: In production, you would check the count and decide whether to commit or rollback

-- Show backup data for rollback reference
SELECT 'BACKUP DATA FOR ROLLBACK REFERENCE:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    package_name,
    duration_type,
    requested_price,
    status,
    created_at
FROM deleted_requests_backup
ORDER BY email, created_at;

-- COMMIT; -- Uncomment this line to commit the transaction
-- ROLLBACK; -- Uncomment this line to rollback the transaction

-- =============================================
-- 4. ROLLBACK SCRIPT (COMMENTED OUT)
-- =============================================

/*
-- To rollback the deletion, execute this script:
-- (Replace the IDs with the actual IDs from the backup)

INSERT INTO membership_requests (
    id, user_id, package_id, duration_type, requested_price, status,
    approved_by, approved_at, rejected_reason, created_at, updated_at,
    classes_count, has_installments, installment_1_amount, installment_2_amount,
    installment_3_amount, installment_1_payment_method, installment_2_payment_method,
    installment_3_payment_method, installment_1_paid, installment_2_paid,
    installment_3_paid, installment_1_paid_at, installment_2_paid_at,
    installment_3_paid_at, all_installments_paid, installments_completed_at,
    installment_1_due_date, installment_2_due_date, installment_3_due_date
)
SELECT 
    id, user_id, package_id, duration_type, requested_price, status,
    approved_by, approved_at, rejected_reason, created_at, updated_at,
    classes_count, has_installments, installment_1_amount, installment_2_amount,
    installment_3_amount, installment_1_payment_method, installment_2_payment_method,
    installment_3_payment_method, installment_1_paid, installment_2_paid,
    installment_3_paid, installment_1_paid_at, installment_2_paid_at,
    installment_3_paid_at, all_installments_paid, installments_completed_at,
    installment_1_due_date, installment_2_due_date, installment_3_due_date
FROM deleted_requests_backup;
*/
