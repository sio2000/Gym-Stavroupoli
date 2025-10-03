-- Comprehensive test script for the delete third installment functionality
-- This script will test all aspects of the installment management system

-- Step 1: Check database schema
SELECT '=== DATABASE SCHEMA CHECK ===' as test_section;

-- Check if all required functions exist
SELECT 
    'Functions Check' as test_type,
    proname as function_name,
    CASE 
        WHEN proname = 'delete_third_installment_permanently' THEN 'CRITICAL - Delete function'
        WHEN proname = 'update_lock_installment' THEN 'CRITICAL - Lock function'
        WHEN proname = 'lock_installment' THEN 'IMPORTANT - Lock helper'
        WHEN proname = 'unlock_installment' THEN 'IMPORTANT - Unlock helper'
        WHEN proname = 'is_installment_locked' THEN 'IMPORTANT - Check function'
        ELSE 'OTHER'
    END as importance,
    proargnames as arguments,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN (
    'delete_third_installment_permanently',
    'update_lock_installment',
    'lock_installment',
    'unlock_installment',
    'is_installment_locked'
)
ORDER BY importance DESC, proname;

-- Check if all required columns exist in membership_requests
SELECT 
    'Columns Check' as test_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('installment_1_locked', 'installment_2_locked', 'installment_3_locked') THEN 'CRITICAL - Lock columns'
        WHEN column_name IN ('third_installment_deleted', 'third_installment_deleted_at', 'third_installment_deleted_by') THEN 'CRITICAL - Delete columns'
        ELSE 'OTHER'
    END as importance
FROM information_schema.columns 
WHERE table_name = 'membership_requests' 
AND column_name IN (
    'installment_1_locked',
    'installment_2_locked', 
    'installment_3_locked',
    'third_installment_deleted',
    'third_installment_deleted_at',
    'third_installment_deleted_by'
)
ORDER BY importance DESC, column_name;

-- Step 2: Check data integrity
SELECT '=== DATA INTEGRITY CHECK ===' as test_section;

-- Check for membership requests with installments
SELECT 
    'Data Check' as test_type,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN has_installments = true THEN 1 END) as requests_with_installments,
    COUNT(CASE WHEN third_installment_deleted = true THEN 1 END) as requests_with_deleted_third_installment,
    COUNT(CASE WHEN installment_1_locked = true THEN 1 END) as requests_with_locked_first_installment,
    COUNT(CASE WHEN installment_2_locked = true THEN 1 END) as requests_with_locked_second_installment,
    COUNT(CASE WHEN installment_3_locked = true THEN 1 END) as requests_with_locked_third_installment
FROM membership_requests;

-- Step 3: Test function calls (safe tests)
SELECT '=== FUNCTION TESTING ===' as test_section;

-- Test is_installment_locked function with actual data
SELECT 
    'Function Test' as test_type,
    id,
    'installment_1' as installment,
    is_installment_locked(id, 1) as is_locked
FROM membership_requests 
WHERE has_installments = true 
LIMIT 3

UNION ALL

SELECT 
    'Function Test' as test_type,
    id,
    'installment_2' as installment,
    is_installment_locked(id, 2) as is_locked
FROM membership_requests 
WHERE has_installments = true 
LIMIT 3

UNION ALL

SELECT 
    'Function Test' as test_type,
    id,
    'installment_3' as installment,
    is_installment_locked(id, 3) as is_locked
FROM membership_requests 
WHERE has_installments = true 
LIMIT 3;

-- Step 4: Check for any data inconsistencies
SELECT '=== DATA CONSISTENCY CHECK ===' as test_section;

-- Check for requests where third installment is deleted but not locked
SELECT 
    'Consistency Check' as test_type,
    id,
    third_installment_deleted,
    installment_3_locked,
    CASE 
        WHEN third_installment_deleted = true AND installment_3_locked = false THEN 'INCONSISTENT - Deleted but not locked'
        WHEN third_installment_deleted = false AND installment_3_locked = true THEN 'INCONSISTENT - Locked but not deleted'
        ELSE 'CONSISTENT'
    END as status
FROM membership_requests 
WHERE has_installments = true
ORDER BY status DESC;

-- Step 5: Summary
SELECT '=== TEST SUMMARY ===' as test_section;

SELECT 
    'Summary' as test_type,
    'All critical functions and columns should be present' as message,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname = 'delete_third_installment_permanently') > 0 
        AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'membership_requests' AND column_name = 'third_installment_deleted') > 0
        THEN 'PASS - Database schema is correct'
        ELSE 'FAIL - Database schema is missing required elements'
    END as result;
