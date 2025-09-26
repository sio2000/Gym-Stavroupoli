# Delete Specific Subscription Requests - Summary

## Overview
This document provides SQL scripts to delete exactly the subscription requests listed in the requirements. Three different approaches are provided based on the level of precision needed.

## Target Requests to Delete

Based on the database analysis, here are the subscription requests that match the criteria:

| Name | Email | Package | Lessons | Price | Date | Status | ID |
|------|-------|---------|---------|-------|------|--------|-----|
| gkan gkan | doremo6025@poesd.com | Pilates | 4 Μαθήματα (1 μήνας) | 44,00 € | 23/9/2025 | Εγκεκριμένο | 78a5b05d-959c-47fb-88f1-06f53f77b6da |
| gkan gkan | doremo6025@poesd.com | Pilates | 1 Μάθημα (Trial) | 6,00 € | 23/9/2025 | Εγκεκριμένο | 82075c95-a053-4051-815e-592b39021969 |
| fewfwe ewffeww | vaxideg303@reifide.com | Pilates | 8 Μαθήματα (2 μήνες) | 80,00 € | 22/9/2025 | Εγκεκριμένο | e93a332c-15f8-4844-a48f-514f1ff2f014 |
| fewfwe ewffeww | vaxideg303@reifide.com | Pilates | 8 Μαθήματα (2 μήνες) | 80,00 € | 22/9/2025 | Απορριφθέν | 2f097182-b3f3-40a7-aaed-406475db8477 |
| nik nuj | xowoh24265@merumart.com | Pilates | 8 Μαθήματα (2 μήνες) | 0,00 € | 22/9/2025 | Εγκεκριμένο | ea8fe9b3-b7dd-406d-a8b7-bbff2ba315eb |
| nik nuj | xowoh24265@merumart.com | Pilates | 4 Μαθήματα (1 μήνας) | 44,00 € | 22/9/2025 | Εγκεκριμένο | 34969116-429b-48de-8b2a-1eea3c364c64 |

**Note**: The requests from `gkan gkan` are from 2025-09-23, not 2025-09-22, but they match the other criteria exactly.

## Available SQL Scripts

### 1. DELETE_COMPLETE_SET.sql (Recommended)
- **Purpose**: Deletes all 6 requests that match the criteria
- **Approach**: Uses exact UUIDs for maximum precision
- **Safety**: Transaction-safe with backup and rollback capability
- **Use Case**: When you want to delete all matching requests

### 2. DELETE_SPECIFIC_SUBSCRIPTION_REQUESTS.sql
- **Purpose**: Uses complex WHERE conditions to match criteria
- **Approach**: Filters by email, package, duration_type, price, status, and date
- **Safety**: Transaction-safe with backup and rollback capability
- **Use Case**: When you want to delete based on business logic criteria

### 3. DELETE_BY_EXACT_IDS.sql
- **Purpose**: Deletes only the 4 requests from 2025-09-22 (excludes gkan gkan)
- **Approach**: Uses exact UUIDs for specific subset
- **Safety**: Transaction-safe with backup and rollback capability
- **Use Case**: When you want to delete only the requests from the exact date

## Database Structure

The requests are stored in the `membership_requests` table with the following key fields:
- `id` (UUID) - Primary key
- `user_id` (UUID) - References user_profiles.user_id
- `package_id` (UUID) - References membership_packages.id
- `duration_type` (TEXT) - e.g., 'pilates_trial', 'pilates_1month', 'pilates_2months'
- `requested_price` (DECIMAL) - The price requested
- `status` (TEXT) - 'pending', 'approved', 'rejected'
- `created_at` (TIMESTAMPTZ) - When the request was created

## Safety Features

All scripts include:
1. **Verification Query**: Shows exactly what will be deleted before deletion
2. **Backup Creation**: Creates a temporary table with the records to be deleted
3. **Transaction Safety**: Wrapped in BEGIN/COMMIT for rollback capability
4. **Rollback Script**: Complete instructions to restore deleted records
5. **Verification**: Confirms successful deletion

## Execution Instructions

### Step 1: Choose Your Script
- Use `DELETE_COMPLETE_SET.sql` for all 6 requests
- Use `DELETE_BY_EXACT_IDS.sql` for only the 4 requests from 2025-09-22
- Use `DELETE_SPECIFIC_SUBSCRIPTION_REQUESTS.sql` for criteria-based deletion

### Step 2: Execute in Supabase
1. Open Supabase SQL Editor
2. Copy and paste the chosen script
3. Run the verification query first to confirm the records
4. Uncomment `COMMIT;` if satisfied with the results
5. Or uncomment `ROLLBACK;` if you want to cancel

### Step 3: Verify Results
- Check the deletion verification query
- Confirm remaining requests for the users
- Verify no other data was affected

## Rollback Instructions

If you need to restore the deleted records:

```sql
-- Replace 'backup_table_name' with the actual backup table name from your script
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
FROM [backup_table_name];
```

## Recommendations

1. **Use DELETE_COMPLETE_SET.sql** for the most comprehensive deletion
2. **Always run the verification query first** to confirm the records
3. **Keep the backup data** until you're certain the deletion is correct
4. **Test in a staging environment** before running in production
5. **Document the execution** with timestamps and results

## Files Created

1. `DELETE_COMPLETE_SET.sql` - Deletes all 6 matching requests
2. `DELETE_SPECIFIC_SUBSCRIPTION_REQUESTS.sql` - Criteria-based deletion
3. `DELETE_BY_EXACT_IDS.sql` - Deletes subset of 4 requests
4. `DELETE_REQUESTS_SUMMARY.md` - This summary document
