-- MIGRATE ULTIMATE MEDIUM REQUESTS
-- This script migrates Ultimate Medium requests from membership_requests to ultimate_membership_requests

-- ========================================
-- STEP 1: CHECK EXISTING ULTIMATE MEDIUM REQUESTS
-- ========================================

SELECT 'STEP 1: Checking existing Ultimate Medium requests...' as phase;

-- Check for Ultimate Medium requests in membership_requests
SELECT 
    'Ultimate Medium requests in membership_requests:' as info,
    COUNT(*) as count
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate Medium';

-- Check for Ultimate Medium requests already in ultimate_membership_requests
SELECT 
    'Ultimate Medium requests in ultimate_membership_requests:' as info,
    COUNT(*) as count
FROM ultimate_membership_requests umr
JOIN membership_packages mp ON umr.package_id = mp.id
WHERE mp.name = 'Ultimate Medium';

-- ========================================
-- STEP 2: MIGRATE ULTIMATE MEDIUM REQUESTS
-- ========================================

SELECT 'STEP 2: Migrating Ultimate Medium requests...' as phase;

-- Migrate Ultimate Medium requests from membership_requests to ultimate_membership_requests
INSERT INTO ultimate_membership_requests (
    id,
    user_id,
    package_id,
    duration_type,
    requested_price,
    status,
    approved_by,
    approved_at,
    rejected_reason,
    has_installments,
    installment_1_amount,
    installment_2_amount,
    installment_3_amount,
    installment_1_payment_method,
    installment_2_payment_method,
    installment_3_payment_method,
    installment_1_due_date,
    installment_2_due_date,
    installment_3_due_date,
    installment_1_paid,
    installment_2_paid,
    installment_3_paid,
    installment_1_paid_at,
    installment_2_paid_at,
    installment_3_paid_at,
    all_installments_paid,
    installments_completed_at,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted,
    third_installment_deleted_at,
    third_installment_deleted_by,
    created_at,
    updated_at
)
SELECT 
    mr.id,
    mr.user_id,
    mr.package_id,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.approved_by,
    mr.approved_at,
    mr.rejected_reason,
    mr.has_installments,
    mr.installment_1_amount,
    mr.installment_2_amount,
    mr.installment_3_amount,
    mr.installment_1_payment_method,
    mr.installment_2_payment_method,
    mr.installment_3_payment_method,
    mr.installment_1_due_date,
    mr.installment_2_due_date,
    mr.installment_3_due_date,
    mr.installment_1_paid,
    mr.installment_2_paid,
    mr.installment_3_paid,
    mr.installment_1_paid_at,
    mr.installment_2_paid_at,
    mr.installment_3_paid_at,
    mr.all_installments_paid,
    mr.installments_completed_at,
    mr.installment_1_locked,
    mr.installment_2_locked,
    mr.installment_3_locked,
    mr.third_installment_deleted,
    mr.third_installment_deleted_at,
    mr.third_installment_deleted_by,
    mr.created_at,
    mr.updated_at
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate Medium' 
AND mr.has_installments = true
AND NOT EXISTS (
    SELECT 1 FROM ultimate_membership_requests umr 
    WHERE umr.id = mr.id
);

-- ========================================
-- STEP 3: UPDATE VIEW TO INCLUDE ULTIMATE MEDIUM
-- ========================================

SELECT 'STEP 3: Updating view to include Ultimate Medium...' as phase;

-- Update the all_membership_requests view to exclude Ultimate Medium from regular requests
CREATE OR REPLACE VIEW all_membership_requests AS
SELECT 
    'regular' as request_type,
    id,
    user_id,
    package_id,
    duration_type,
    requested_price,
    status,
    approved_by,
    approved_at,
    rejected_reason,
    has_installments,
    installment_1_amount,
    installment_2_amount,
    installment_3_amount,
    installment_1_payment_method,
    installment_2_payment_method,
    installment_3_payment_method,
    installment_1_due_date,
    installment_2_due_date,
    installment_3_due_date,
    installment_1_paid,
    installment_2_paid,
    installment_3_paid,
    installment_1_paid_at,
    installment_2_paid_at,
    installment_3_paid_at,
    all_installments_paid,
    installments_completed_at,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted,
    third_installment_deleted_at,
    third_installment_deleted_by,
    created_at,
    updated_at
FROM membership_requests
WHERE has_installments = false OR package_id NOT IN (
    SELECT id FROM membership_packages WHERE name IN ('Ultimate', 'Ultimate Medium')
)

UNION ALL

SELECT 
    'ultimate' as request_type,
    id,
    user_id,
    package_id,
    duration_type,
    requested_price,
    status,
    approved_by,
    approved_at,
    rejected_reason,
    has_installments,
    installment_1_amount,
    installment_2_amount,
    installment_3_amount,
    installment_1_payment_method,
    installment_2_payment_method,
    installment_3_payment_method,
    installment_1_due_date,
    installment_2_due_date,
    installment_3_due_date,
    installment_1_paid,
    installment_2_paid,
    installment_3_paid,
    installment_1_paid_at,
    installment_2_paid_at,
    installment_3_paid_at,
    all_installments_paid,
    installments_completed_at,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted,
    third_installment_deleted_at,
    third_installment_deleted_by,
    created_at,
    updated_at
FROM ultimate_membership_requests;

-- ========================================
-- STEP 4: VERIFY MIGRATION
-- ========================================

SELECT 'STEP 4: Verifying migration...' as phase;

-- Check migrated Ultimate Medium requests
SELECT 
    'Migrated Ultimate Medium requests:' as info,
    COUNT(*) as count
FROM ultimate_membership_requests umr
JOIN membership_packages mp ON umr.package_id = mp.id
WHERE mp.name = 'Ultimate Medium';

-- Show sample of migrated requests
SELECT 
    'Sample Ultimate Medium requests:' as info,
    umr.id,
    umr.user_id,
    mp.name as package_name,
    umr.duration_type,
    umr.requested_price,
    umr.status,
    umr.has_installments,
    umr.created_at
FROM ultimate_membership_requests umr
JOIN membership_packages mp ON umr.package_id = mp.id
WHERE mp.name = 'Ultimate Medium'
ORDER BY umr.created_at DESC
LIMIT 5;

SELECT 'Ultimate Medium requests migration completed!' as result;
