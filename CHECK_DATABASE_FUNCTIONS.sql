-- Check if the required functions exist in the database
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN (
    'delete_third_installment_permanently',
    'update_lock_installment',
    'lock_installment',
    'unlock_installment',
    'is_installment_locked'
)
ORDER BY proname;

-- Check if the required columns exist in membership_requests table
SELECT column_name, data_type, is_nullable, column_default
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
ORDER BY column_name;

-- Check if there are any membership requests with installments
SELECT 
    id,
    has_installments,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted,
    created_at
FROM membership_requests 
WHERE has_installments = true 
LIMIT 5;
