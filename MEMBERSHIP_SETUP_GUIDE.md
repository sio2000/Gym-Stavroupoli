# Membership System Setup Guide

## Quick Fix for Database Errors

The errors you encountered are due to missing dependencies. Here's the correct order to run the scripts:

## Step 1: Run the Complete Setup Script

**Run this script first in Supabase SQL Editor:**
```sql
-- File: database/COMPLETE_MEMBERSHIP_SETUP.sql
```

This script will:
- ✅ Check all prerequisites
- ✅ Create the `memberships` table
- ✅ Set up RLS policies
- ✅ Create all necessary functions
- ✅ Create views and triggers
- ✅ Verify everything works
- ✅ Create optional test data

## Step 2: Verify the Setup

After running the complete setup, you can verify everything works by running:

```sql
-- File: database/TEST_MEMBERSHIP_SYSTEM_FIXED.sql
```

## What Was Fixed

### 1. **Error: column "status" does not exist**
- **Cause**: The `memberships` table wasn't created yet
- **Fix**: The complete setup script creates the table first

### 2. **Error: column m.duration_type does not exist**
- **Cause**: The view was trying to reference a table that didn't exist
- **Fix**: All dependencies are created in the correct order

### 3. **Error: function expire_memberships() does not exist**
- **Cause**: The function wasn't created yet
- **Fix**: All functions are created in the complete setup script

## Alternative: Run Scripts Individually

If you prefer to run scripts individually, use this order:

1. **First**: `database/CREATE_MEMBERSHIPS_TABLE_FIXED.sql`
2. **Second**: `database/SETUP_AUTO_EXPIRATION_FIXED.sql`
3. **Third**: `database/TEST_MEMBERSHIP_SYSTEM_FIXED.sql`

## What You'll See After Setup

### Database Tables Created:
- ✅ `memberships` - Active user subscriptions
- ✅ `membership_package_durations` - Dynamic pricing
- ✅ `membership_requests` - User booking requests
- ✅ `membership_packages` - Available packages

### Functions Created:
- ✅ `expire_memberships()` - Expires old memberships
- ✅ `check_and_expire_memberships()` - Checks and expires
- ✅ `get_user_membership_status()` - User status check
- ✅ `get_membership_stats()` - Statistics for admin
- ✅ `get_user_active_memberships()` - User's active memberships

### Views Created:
- ✅ `membership_overview` - Easy membership monitoring

### RLS Policies:
- ✅ Users can view their own memberships
- ✅ Admins/Secretaries can view all memberships
- ✅ Only admins/secretaries can create/update memberships

## Testing the System

After setup, you can test by:

1. **Creating a membership request** (via the frontend)
2. **Approving the request** (via Admin Panel or Secretary Dashboard)
3. **Checking if the package is locked** (on the membership page)
4. **Verifying QR Codes access** (in the user menu)

## Frontend Integration

The frontend is already updated to work with the new system:

- ✅ **Package locking** - Shows lock icon for active memberships
- ✅ **Expiration checking** - Automatically checks for expired memberships
- ✅ **QR Codes access** - Shows/hides based on active membership
- ✅ **Approval flow** - Creates membership records when approved

## Troubleshooting

If you still get errors:

1. **Check prerequisites**: Make sure `user_profiles` and `membership_packages` tables exist
2. **Run in order**: Use the complete setup script
3. **Check permissions**: Make sure you have admin access to the database
4. **Verify RLS**: Check that RLS policies are working correctly

## Next Steps

After successful setup:

1. **Test the frontend** - Try creating and approving membership requests
2. **Check expiration** - Verify packages unlock when expired
3. **Monitor performance** - Use the membership overview view
4. **Set up monitoring** - Consider setting up alerts for expiring memberships

## Support

If you encounter any issues:

1. Check the error messages carefully
2. Verify all prerequisites are met
3. Run the test script to identify problems
4. Check the Supabase logs for detailed error information

The system is designed to be robust and self-healing, but proper setup is crucial for everything to work correctly.
