-- DELETE COMPLETE SET OF SUBSCRIPTION REQUESTS
-- This script deletes all the subscription requests mentioned in the requirements
-- Date: 2025-09-22
-- 
-- Includes requests from both 2025-09-22 and 2025-09-23 (since some users made requests on both dates)

-- =============================================
-- 1. VERIFICATION QUERY - SHOW ALL RECORDS TO DELETE
-- =============================================

SELECT 'COMPLETE SET OF RECORDS TO BE DELETED:' as info;

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
WHERE mr.id IN (
    -- gkan gkan (doremo6025@poesd.com) - Pilates 4 Μαθήματα (1 μήνας) 44,00 € Εγκεκριμένο
    '78a5b05d-959c-47fb-88f1-06f53f77b6da',
    
    -- gkan gkan (doremo6025@poesd.com) - Pilates 1 Μάθημα (Trial) 6,00 € Εγκεκριμένο
    '82075c95-a053-4051-815e-592b39021969',
    
    -- fewfwe ewffeww (vaxideg303@reifide.com) - Pilates 8 Μαθήματα (2 μήνες) 80,00 € Εγκεκριμένο
    'e93a332c-15f8-4844-a48f-514f1ff2f014',
    
    -- fewfwe ewffeww (vaxideg303@reifide.com) - Pilates 8 Μαθήματα (2 μήνες) 80,00 € Απορριφθέν
    '2f097182-b3f3-40a7-aaed-406475db8477',
    
    -- nik nuj (xowoh24265@merumart.com) - Pilates 8 Μαθήματα (2 μήνες) 0,00 € Εγκεκριμένο
    'ea8fe9b3-b7dd-406d-a8b7-bbff2ba315eb',
    
    -- nik nuj (xowoh24265@merumart.com) - Pilates 4 Μαθήματα (1 μήνας) 44,00 € Εγκεκριμένο
    '34969116-429b-48de-8b2a-1eea3c364c64'
)
ORDER BY up.email, mr.created_at;

-- =============================================
-- 2. CREATE BACKUP
-- =============================================

CREATE TEMP TABLE IF NOT EXISTS complete_deleted_requests_backup AS
SELECT 
    mr.*,
    up.email,
    up.first_name,
    up.last_name,
    mp.name as package_name
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mr.id IN (
    '78a5b05d-959c-47fb-88f1-06f53f77b6da',
    '82075c95-a053-4051-815e-592b39021969',
    'e93a332c-15f8-4844-a48f-514f1ff2f014',
    '2f097182-b3f3-40a7-aaed-406475db8477',
    'ea8fe9b3-b7dd-406d-a8b7-bbff2ba315eb',
    '34969116-429b-48de-8b2a-1eea3c364c64'
);

SELECT 'BACKUP CREATED - Total records to delete:' as info;
SELECT COUNT(*) as backup_count FROM complete_deleted_requests_backup;

-- Show backup details
SELECT 'BACKUP DETAILS:' as info;
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
FROM complete_deleted_requests_backup
ORDER BY email, created_at;

-- =============================================
-- 3. TRANSACTION-SAFE DELETION
-- =============================================

BEGIN;

-- Delete the specific records
DELETE FROM membership_requests 
WHERE id IN (
    '78a5b05d-959c-47fb-88f1-06f53f77b6da',
    '82075c95-a053-4051-815e-592b39021969',
    'e93a332c-15f8-4844-a48f-514f1ff2f014',
    '2f097182-b3f3-40a7-aaed-406475db8477',
    'ea8fe9b3-b7dd-406d-a8b7-bbff2ba315eb',
    '34969116-429b-48de-8b2a-1eea3c364c64'
);

-- Verify deletion
SELECT 'DELETION VERIFICATION:' as info;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: All target records deleted'
        ELSE 'WARNING: ' || COUNT(*) || ' records still exist'
    END as deletion_status
FROM membership_requests 
WHERE id IN (
    '78a5b05d-959c-47fb-88f1-06f53f77b6da',
    '82075c95-a053-4051-815e-592b39021969',
    'e93a332c-15f8-4844-a48f-514f1ff2f014',
    '2f097182-b3f3-40a7-aaed-406475db8477',
    'ea8fe9b3-b7dd-406d-a8b7-bbff2ba315eb',
    '34969116-429b-48de-8b2a-1eea3c364c64'
);

-- COMMIT; -- Uncomment to commit the transaction
-- ROLLBACK; -- Uncomment to rollback the transaction

-- =============================================
-- 4. FINAL VERIFICATION
-- =============================================

-- Check remaining requests for these users (should show other requests, not the deleted ones)
SELECT 'REMAINING REQUESTS FOR THESE USERS:' as info;
SELECT 
    mr.id,
    up.email,
    up.first_name,
    up.last_name,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.created_at
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE up.email IN ('doremo6025@poesd.com', 'vaxideg303@reifide.com', 'xowoh24265@merumart.com')
ORDER BY up.email, mr.created_at;

-- =============================================
-- 5. ROLLBACK SCRIPT
-- =============================================

/*
To rollback this deletion, execute:

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
FROM complete_deleted_requests_backup;
*/
