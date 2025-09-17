# Ultimate Package Setup Guide

## Overview
This guide will help you set up the Ultimate Package with installments support in your FreeGym application.

## Prerequisites
- Supabase project with existing database
- Access to Supabase SQL Editor
- Environment variables configured

## Step-by-Step Setup

### Step 1: Fix Database Constraints
First, run the constraint fix script to allow the 'ultimate' package type:

```sql
-- Run this in Supabase SQL Editor
-- File: database/FIX_ULTIMATE_PACKAGE_CONSTRAINT.sql
```

This will:
- Update the `membership_packages` constraint to include 'ultimate'
- Update the `membership_package_durations` constraint to include 'ultimate_1year'

### Step 2: Create Ultimate Package
After fixing constraints, create the Ultimate package:

```sql
-- Run this in Supabase SQL Editor
-- File: database/CREATE_ULTIMATE_PACKAGE_ONLY.sql
```

This will:
- Create the Ultimate package (3x/week Pilates + Free Gym for 1 year)
- Create the package duration option
- Set the price to €1,200

### Step 3: Add Installments Support
Add installments tracking to the database:

```sql
-- Run this in Supabase SQL Editor
-- File: database/ADD_INSTALLMENTS_SUPPORT.sql
```

This will:
- Add installments columns to `membership_requests` table
- Create functions for tracking installments
- Enable admin management of installments

### Step 4: Verify Installation
Check that everything is working:

```bash
# Run the test script
node test-ultimate-package-implementation.cjs
```

## Features Added

### Ultimate Package
- **Name**: Ultimate
- **Description**: 3x/week Pilates + Free Gym for 1 year with Installments Option
- **Price**: €1,200
- **Duration**: 365 days
- **Classes**: 156 (3 per week × 52 weeks)
- **Features**: 3x/week Pilates, Free Gym Access, Installments Available, 1 Year Duration

### Installments System
- **Toggle**: Users can choose installments or single payment
- **3 Installments**: Users can split payment into 3 parts
- **Payment Methods**: Each installment can be Cash or POS
- **Admin Tracking**: Dedicated "Users with Installments" section
- **Status Management**: Track which installments are paid

### UI Updates
- **Package Display**: Ultimate package appears with crown icon (👑)
- **Orange Styling**: Distinct orange color scheme
- **Installments UI**: Clean, user-friendly installment selection
- **Real-time Total**: Shows installment total vs package price

## Database Schema Changes

### New Columns in `membership_requests`:
- `has_installments` (BOOLEAN)
- `installment_1_amount` (DECIMAL)
- `installment_2_amount` (DECIMAL)
- `installment_3_amount` (DECIMAL)
- `installment_1_payment_method` (VARCHAR)
- `installment_2_payment_method` (VARCHAR)
- `installment_3_payment_method` (VARCHAR)
- `installment_1_paid` (BOOLEAN)
- `installment_2_paid` (BOOLEAN)
- `installment_3_paid` (BOOLEAN)
- `installment_1_paid_at` (TIMESTAMPTZ)
- `installment_2_paid_at` (TIMESTAMPTZ)
- `installment_3_paid_at` (TIMESTAMPTZ)
- `all_installments_paid` (BOOLEAN)
- `installments_completed_at` (TIMESTAMPTZ)

### New Functions:
- `get_users_with_installments()` - Get all users with installment requests
- `mark_installment_paid(request_id, installment_number, payment_method)` - Mark installment as paid

## API Functions Added

### Frontend API (`src/utils/membershipApi.ts`):
- `createUltimateMembershipRequest()` - Create Ultimate package request
- `getUsersWithInstallments()` - Get users with installments (admin)
- `markInstallmentPaid()` - Mark installment as paid (admin)
- `getUltimatePackageDurations()` - Get Ultimate package options

## Admin Panel Integration

The Ultimate package will appear in the admin panel with:
- Installments tracking
- Payment status management
- User management for installment requests

## Testing

Run the comprehensive test to verify everything works:

```bash
node test-ultimate-package-implementation.cjs
```

## Troubleshooting

### Common Issues:

1. **Constraint Error**: Make sure to run the constraint fix script first
2. **Package Not Appearing**: Check that the package was created successfully
3. **Installments Not Working**: Verify the installments columns were added
4. **API Errors**: Check that all API functions are properly imported

### Verification Queries:

```sql
-- Check Ultimate package exists
SELECT * FROM membership_packages WHERE name = 'Ultimate';

-- Check installments columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'membership_requests' 
AND column_name LIKE 'installment%';

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('get_users_with_installments', 'mark_installment_paid');
```

## Next Steps

After successful setup:
1. Test the Ultimate package purchase flow
2. Test installments functionality
3. Set up admin panel for installments management
4. Train staff on the new features

## Support

If you encounter any issues:
1. Check the test script output
2. Verify database constraints
3. Check API function imports
4. Review the implementation files
