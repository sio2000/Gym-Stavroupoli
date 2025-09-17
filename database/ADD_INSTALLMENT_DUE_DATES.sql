-- Add Installment Due Dates to membership_requests table
-- This script adds due date columns for each of the 3 installments

-- Add due date columns for installments
ALTER TABLE "public"."membership_requests" 
ADD COLUMN IF NOT EXISTS "installment_1_due_date" DATE,
ADD COLUMN IF NOT EXISTS "installment_2_due_date" DATE,
ADD COLUMN IF NOT EXISTS "installment_3_due_date" DATE;

-- Add comments to explain the columns
COMMENT ON COLUMN "public"."membership_requests"."installment_1_due_date" IS 'Due date for the first installment payment';
COMMENT ON COLUMN "public"."membership_requests"."installment_2_due_date" IS 'Due date for the second installment payment';
COMMENT ON COLUMN "public"."membership_requests"."installment_3_due_date" IS 'Due date for the third installment payment';

-- Create an index for faster queries on due dates
CREATE INDEX IF NOT EXISTS "idx_membership_requests_installment_due_dates" 
ON "public"."membership_requests" (
    "installment_1_due_date",
    "installment_2_due_date", 
    "installment_3_due_date"
);

-- Drop existing function first, then recreate with new return type
DROP FUNCTION IF EXISTS get_users_with_installments();

-- Create the get_users_with_installments function to include due dates
CREATE OR REPLACE FUNCTION get_users_with_installments()
RETURNS TABLE(
    id UUID,
    user_id UUID,
    package_id UUID,
    duration_type TEXT,
    requested_price DECIMAL,
    status TEXT,
    has_installments BOOLEAN,
    installment_1_amount DECIMAL,
    installment_2_amount DECIMAL,
    installment_3_amount DECIMAL,
    installment_1_payment_method TEXT,
    installment_2_payment_method TEXT,
    installment_3_payment_method TEXT,
    installment_1_paid BOOLEAN,
    installment_2_paid BOOLEAN,
    installment_3_paid BOOLEAN,
    installment_1_paid_at TIMESTAMPTZ,
    installment_2_paid_at TIMESTAMPTZ,
    installment_3_paid_at TIMESTAMPTZ,
    installment_1_due_date DATE,
    installment_2_due_date DATE,
    installment_3_due_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    package_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mr.id,
        mr.user_id,
        mr.package_id,
        mr.duration_type,
        mr.requested_price,
        mr.status,
        mr.has_installments,
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
        mr.installment_3_paid_at,
        mr.installment_1_due_date,
        mr.installment_2_due_date,
        mr.installment_3_due_date,
        mr.created_at,
        mr.updated_at,
        up.first_name,
        up.last_name,
        up.email,
        mp.name as package_name
    FROM membership_requests mr
    JOIN user_profiles up ON mr.user_id = up.user_id
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mr.has_installments = true
    AND mr.status != 'rejected'
    ORDER BY mr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get overdue installments
CREATE OR REPLACE FUNCTION get_overdue_installments()
RETURNS TABLE(
    id UUID,
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    package_name TEXT,
    installment_number INTEGER,
    amount DECIMAL,
    due_date DATE,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    -- First installment overdue
    SELECT 
        mr.id,
        mr.user_id,
        up.first_name,
        up.last_name,
        up.email,
        mp.name as package_name,
        1 as installment_number,
        mr.installment_1_amount as amount,
        mr.installment_1_due_date as due_date,
        (CURRENT_DATE - mr.installment_1_due_date)::INTEGER as days_overdue
    FROM membership_requests mr
    JOIN user_profiles up ON mr.user_id = up.user_id
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mr.has_installments = true
    AND mr.installment_1_paid = false
    AND mr.installment_1_due_date IS NOT NULL
    AND mr.installment_1_due_date < CURRENT_DATE
    AND mr.status != 'rejected'
    
    UNION ALL
    
    -- Second installment overdue
    SELECT 
        mr.id,
        mr.user_id,
        up.first_name,
        up.last_name,
        up.email,
        mp.name as package_name,
        2 as installment_number,
        mr.installment_2_amount as amount,
        mr.installment_2_due_date as due_date,
        (CURRENT_DATE - mr.installment_2_due_date)::INTEGER as days_overdue
    FROM membership_requests mr
    JOIN user_profiles up ON mr.user_id = up.user_id
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mr.has_installments = true
    AND mr.installment_2_paid = false
    AND mr.installment_2_due_date IS NOT NULL
    AND mr.installment_2_due_date < CURRENT_DATE
    AND mr.status != 'rejected'
    
    UNION ALL
    
    -- Third installment overdue
    SELECT 
        mr.id,
        mr.user_id,
        up.first_name,
        up.last_name,
        up.email,
        mp.name as package_name,
        3 as installment_number,
        mr.installment_3_amount as amount,
        mr.installment_3_due_date as due_date,
        (CURRENT_DATE - mr.installment_3_due_date)::INTEGER as days_overdue
    FROM membership_requests mr
    JOIN user_profiles up ON mr.user_id = up.user_id
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mr.has_installments = true
    AND mr.installment_3_paid = false
    AND mr.installment_3_due_date IS NOT NULL
    AND mr.installment_3_due_date < CURRENT_DATE
    AND mr.status != 'rejected'
    
    ORDER BY days_overdue DESC, due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get upcoming installments (due in next 7 days)
CREATE OR REPLACE FUNCTION get_upcoming_installments()
RETURNS TABLE(
    id UUID,
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    package_name TEXT,
    installment_number INTEGER,
    amount DECIMAL,
    due_date DATE,
    days_until_due INTEGER
) AS $$
BEGIN
    RETURN QUERY
    -- First installment upcoming
    SELECT 
        mr.id,
        mr.user_id,
        up.first_name,
        up.last_name,
        up.email,
        mp.name as package_name,
        1 as installment_number,
        mr.installment_1_amount as amount,
        mr.installment_1_due_date as due_date,
        (mr.installment_1_due_date - CURRENT_DATE)::INTEGER as days_until_due
    FROM membership_requests mr
    JOIN user_profiles up ON mr.user_id = up.user_id
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mr.has_installments = true
    AND mr.installment_1_paid = false
    AND mr.installment_1_due_date IS NOT NULL
    AND mr.installment_1_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND mr.status != 'rejected'
    
    UNION ALL
    
    -- Second installment upcoming
    SELECT 
        mr.id,
        mr.user_id,
        up.first_name,
        up.last_name,
        up.email,
        mp.name as package_name,
        2 as installment_number,
        mr.installment_2_amount as amount,
        mr.installment_2_due_date as due_date,
        (mr.installment_2_due_date - CURRENT_DATE)::INTEGER as days_until_due
    FROM membership_requests mr
    JOIN user_profiles up ON mr.user_id = up.user_id
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mr.has_installments = true
    AND mr.installment_2_paid = false
    AND mr.installment_2_due_date IS NOT NULL
    AND mr.installment_2_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND mr.status != 'rejected'
    
    UNION ALL
    
    -- Third installment upcoming
    SELECT 
        mr.id,
        mr.user_id,
        up.first_name,
        up.last_name,
        up.email,
        mp.name as package_name,
        3 as installment_number,
        mr.installment_3_amount as amount,
        mr.installment_3_due_date as due_date,
        (mr.installment_3_due_date - CURRENT_DATE)::INTEGER as days_until_due
    FROM membership_requests mr
    JOIN user_profiles up ON mr.user_id = up.user_id
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mr.has_installments = true
    AND mr.installment_3_paid = false
    AND mr.installment_3_due_date IS NOT NULL
    AND mr.installment_3_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND mr.status != 'rejected'
    
    ORDER BY due_date ASC, days_until_due ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_users_with_installments() TO authenticated;
GRANT EXECUTE ON FUNCTION get_overdue_installments() TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_installments() TO authenticated;

-- Create a view for easy access to installment status
CREATE OR REPLACE VIEW installment_status_view AS
SELECT 
    mr.id,
    mr.user_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    mr.requested_price,
    mr.status,
    
    -- Installment 1
    mr.installment_1_amount,
    mr.installment_1_payment_method,
    mr.installment_1_due_date,
    mr.installment_1_paid,
    mr.installment_1_paid_at,
    CASE 
        WHEN mr.installment_1_paid = true THEN 'paid'
        WHEN mr.installment_1_due_date IS NULL THEN 'not_scheduled'
        WHEN mr.installment_1_due_date > CURRENT_DATE THEN 'pending'
        WHEN mr.installment_1_due_date = CURRENT_DATE THEN 'due_today'
        ELSE 'overdue'
    END as installment_1_status,
    
    -- Installment 2
    mr.installment_2_amount,
    mr.installment_2_payment_method,
    mr.installment_2_due_date,
    mr.installment_2_paid,
    mr.installment_2_paid_at,
    CASE 
        WHEN mr.installment_2_paid = true THEN 'paid'
        WHEN mr.installment_2_due_date IS NULL THEN 'not_scheduled'
        WHEN mr.installment_2_due_date > CURRENT_DATE THEN 'pending'
        WHEN mr.installment_2_due_date = CURRENT_DATE THEN 'due_today'
        ELSE 'overdue'
    END as installment_2_status,
    
    -- Installment 3
    mr.installment_3_amount,
    mr.installment_3_payment_method,
    mr.installment_3_due_date,
    mr.installment_3_paid,
    mr.installment_3_paid_at,
    CASE 
        WHEN mr.installment_3_paid = true THEN 'paid'
        WHEN mr.installment_3_due_date IS NULL THEN 'not_scheduled'
        WHEN mr.installment_3_due_date > CURRENT_DATE THEN 'pending'
        WHEN mr.installment_3_due_date = CURRENT_DATE THEN 'due_today'
        ELSE 'overdue'
    END as installment_3_status,
    
    mr.created_at,
    mr.updated_at
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mr.has_installments = true
AND mr.status != 'rejected';

-- Grant access to the view
GRANT SELECT ON installment_status_view TO authenticated;

SELECT 'Installment due dates added successfully!' as result;
