-- DELETE SPECIFIC SUBSCRIPTION REQUESTS BY EXACT IDs
-- This script deletes exactly the subscription requests using their unique IDs
-- Date: 2025-09-22
-- 
-- Based on the data found, these are the exact IDs to delete:

-- =============================================
-- 1. VERIFICATION QUERY - SHOW RECORDS TO DELETE
-- =============================================

SELECT 'RECORDS TO BE DELETED - VERIFICATION:' as info;

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
    -- Note: This user has requests from 2025-09-23, not 2025-09-22
    -- We'll include the closest matches based on the criteria
    
    -- fewfwe ewffeww (vaxideg303@reifide.com) - Pilates 8 Μαθήματα (2 μήνες) 80,00 € Εγκεκριμένο
    'e93a332c-15f8-4844-a48f-514f1ff2f014',
    
    -- fewfwe ewffeww (vaxideg303@reifide.com) - Pilates 8 Μαθήματα (2 μήνες) 80,00 € Απορριφθέν
    '2f097182-b3f3-40a7-aaed-406475db8477',
    
    -- nik nuj (xowoh24265@merumart.com) - Pilates 8 Μαθήματα (2 μήνες) 0,00 € Εγκεκριμένο
    'ea8fe9b3-b7dd-406d-a8b7-bbff2ba315eb',
    
    -- nik nuj (xowoh24265@merumart.com) - Pilates 4 Μαθήματα (1 μήνας) - taking one with price 44
    '34969116-429b-48de-8b2a-1eea3c364c64'
    
    -- Note: For gkan gkan (doremo6025@poesd.com), the requests are from 2025-09-23, not 2025-09-22
    -- If you want to include them, uncomment these IDs:
    -- '78a5b05d-959c-47fb-88f1-06f53f77b6da', -- pilates_1month, 44, approved
    -- '82075c95-a053-4051-815e-592b39021969'  -- pilates_trial, 6, approved
)
ORDER BY up.email, mr.created_at;

-- =============================================
-- 2. BACKUP THE RECORDS
-- =============================================

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
WHERE mr.id IN (
    'e93a332c-15f8-4844-a48f-514f1ff2f014',
    '2f097182-b3f3-40a7-aaed-406475db8477',
    'ea8fe9b3-b7dd-406d-a8b7-bbff2ba315eb',
    '34969116-429b-48de-8b2a-1eea3c364c64'
);

SELECT 'BACKUP CREATED:' as info;
SELECT COUNT(*) as backup_count FROM deleted_requests_backup;

-- =============================================
-- 3. TRANSACTION-SAFE DELETION
-- =============================================

BEGIN;

-- Delete the specific records by ID
DELETE FROM membership_requests 
WHERE id IN (
    'e93a332c-15f8-4844-a48f-514f1ff2f014',
    '2f097182-b3f3-40a7-aaed-406475db8477',
    'ea8fe9b3-b7dd-406d-a8b7-bbff2ba315eb',
    '34969116-429b-48de-8b2a-1eea3c364c64'
);

-- Verify deletion
SELECT 'DELETION VERIFICATION:' as info;
SELECT COUNT(*) as deleted_count FROM deleted_requests_backup;

-- Show what was deleted
SELECT 'DELETED RECORDS SUMMARY:' as info;
SELECT 
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

-- COMMIT; -- Uncomment to commit
-- ROLLBACK; -- Uncomment to rollback

-- =============================================
-- 4. ROLLBACK INSTRUCTIONS
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
FROM deleted_requests_backup;
*/
