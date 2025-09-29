# Permanent Installment Locking - Setup & Testing Guide

## Overview
This guide explains how to set up and test the permanent installment locking functionality for Ultimate Package requests. The system now stores locked installments in the database permanently, ensuring they persist across sessions and page refreshes.

## Database Setup

### Step 1: Create Database Table
Run the following SQL script in your Supabase SQL Editor:

```sql
-- File: setup-permanent-locking.sql
-- Run this in Supabase SQL Editor to create the locked_installments table
```

The script creates:
- `locked_installments` table with proper constraints
- Row Level Security (RLS) policies
- Database functions for locking/unlocking
- Indexes for performance
- Triggers for timestamp updates

### Step 2: Verify Database Setup
After running the SQL script, verify the setup:

```sql
-- Check if table was created
SELECT COUNT(*) FROM locked_installments;

-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN (
    'get_locked_installments_for_request',
    'lock_installment',
    'unlock_installment'
);
```

## Implementation Details

### Database Schema
```sql
CREATE TABLE locked_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_request_id UUID NOT NULL REFERENCES membership_requests(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL CHECK (installment_number IN (1, 2, 3)),
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(membership_request_id, installment_number)
);
```

### Key Features
1. **Permanent Storage**: Locked installments are stored in the database
2. **User Tracking**: Records who locked each installment and when
3. **Security**: Row Level Security policies ensure proper access control
4. **Data Integrity**: Foreign key constraints and unique constraints
5. **Performance**: Indexes on frequently queried columns

## Testing Instructions

### Manual Testing

#### Test 1: Basic Locking Functionality
1. Navigate to Admin Panel → Ultimate Package tab
2. Find a request with installments
3. Click the checkbox under "1η Δόση"
4. Confirm the lock in the popup
5. Click "💾 Αποθήκευση Δόσεων & Ημερομηνιών"
6. **Verify**: Installment 1 should be locked (orange styling, disabled inputs)

#### Test 2: Permanent Persistence
1. Lock an installment using Test 1
2. Refresh the page (F5)
3. **Verify**: The locked installment should still be locked
4. Check browser developer tools → Network tab
5. **Verify**: API call to `get_locked_installments_for_request` is made

#### Test 3: Database Verification
1. After locking an installment, check the database:
```sql
SELECT * FROM locked_installments 
WHERE membership_request_id = 'your-request-id';
```
2. **Verify**: Record exists with correct installment number and user ID

#### Test 4: Multiple Installments
1. Lock installment 1 and 3 (leave 2 unlocked)
2. Refresh the page
3. **Verify**: Only installments 1 and 3 remain locked
4. **Verify**: Installment 2 is still editable

#### Test 5: Secretary Panel
1. Repeat all tests in Secretary Dashboard → Ultimate Package tab
2. **Verify**: Identical functionality to Admin Panel

### Automated Testing

#### Run Test Script
```bash
node test-permanent-locking.js
```

The script tests:
- Database loading logic
- Permanent persistence
- Locking logic with DB + local state
- Database operations
- Error handling
- Security and permissions

### Browser Console Testing

#### Check Database Calls
Open browser developer tools and verify:

```javascript
// Check if locked installments are loaded
console.log('Ultimate requests:', window.ultimateRequests);
console.log('Locked installments:', window.ultimateRequests?.[0]?.locked_installments);

// Check API calls in Network tab
// Look for: get_locked_installments_for_request
// Look for: lock_installment
```

#### Verify Locking State
```javascript
// Check if installment is locked
const request = window.ultimateRequests?.[0];
if (request) {
    console.log('Installment 1 locked:', request.installment_1_locked);
    console.log('Installment 2 locked:', request.installment_2_locked);
    console.log('Installment 3 locked:', request.installment_3_locked);
}
```

## API Functions

### Database Functions

#### `get_locked_installments_for_request(request_id UUID)`
Returns locked installments for a specific request:
```sql
SELECT * FROM get_locked_installments_for_request('request-id');
```

#### `lock_installment(request_id UUID, installment_num INTEGER, locked_by_user_id UUID)`
Locks an installment:
```sql
SELECT lock_installment('request-id', 1, 'user-id');
```

#### `unlock_installment(request_id UUID, installment_num INTEGER)`
Unlocks an installment (admin only):
```sql
SELECT unlock_installment('request-id', 1);
```

### Frontend Functions

#### `loadUltimateRequests()`
- Loads all Ultimate requests
- Fetches locked installments for each request
- Sets locked state in request objects

#### `updateInstallmentAmounts()`
- Updates installment amounts and dates
- Calls `lock_installment` for newly locked installments
- Saves changes to database

## Security Features

### Row Level Security (RLS)
- **Admins**: Can manage all locked installments
- **Secretaries**: Can manage all locked installments  
- **Users**: Can only view their own locked installments
- **Unauthenticated**: No access

### Function Security
- All functions marked as `SECURITY DEFINER`
- Functions run with elevated privileges
- Input validation and sanitization
- Protection against SQL injection

### Data Integrity
- Foreign key constraints to `membership_requests`
- Unique constraint per request-installment pair
- Check constraints for installment numbers (1, 2, 3)
- Cascade delete when request is deleted

## Error Handling

### Common Scenarios
1. **Network Error**: Graceful error handling, user notified
2. **Already Locked**: Function returns FALSE, no duplicate created
3. **Invalid Request ID**: Returns empty array, logs error
4. **Permission Denied**: RLS policies prevent unauthorized access

### Error Messages
- Database errors are logged to console
- User-friendly error messages displayed
- Fallback behavior when database is unavailable

## Performance Considerations

### Optimization Features
- **Indexes**: On `membership_request_id` and `locked_at`
- **Batch Loading**: All locked installments loaded in single query
- **Caching**: Locked state cached in component state
- **Lazy Loading**: Only loads when Ultimate tab is accessed

### Monitoring
- Monitor database query performance
- Check for slow queries on `locked_installments` table
- Monitor API response times

## Troubleshooting

### Common Issues

#### Locking Not Persisting
1. Check if SQL script was run successfully
2. Verify database functions exist
3. Check browser console for API errors
4. Verify RLS policies are correct

#### Performance Issues
1. Check database indexes are created
2. Monitor query execution times
3. Consider adding more indexes if needed

#### Permission Errors
1. Verify user has admin/secretary role
2. Check RLS policies are enabled
3. Verify authentication is working

### Debug Commands

#### Database Queries
```sql
-- Check all locked installments
SELECT * FROM locked_installments ORDER BY locked_at DESC;

-- Check locked installments for specific request
SELECT * FROM get_locked_installments_for_request('request-id');

-- Check if user can lock installments
SELECT * FROM user_profiles WHERE id = 'user-id' AND role IN ('admin', 'secretary');
```

#### Frontend Debug
```javascript
// Check if functions exist
console.log('lock_installment function exists:', typeof window.lockInstallment);

// Check component state
console.log('Selected request options:', window.selectedRequestOptions);

// Check API responses
// Look in Network tab for API calls and responses
```

## Migration Notes

### From Mock Data to Database
The system has been updated from using mock data to permanent database storage:

1. **Before**: Locking state was only in component state
2. **After**: Locking state is stored in database permanently
3. **Backward Compatibility**: System handles both old and new data formats
4. **Migration**: No data migration needed, starts fresh with database storage

### Rollback Plan
If issues occur, the system can be rolled back by:
1. Removing database table creation from setup
2. Reverting to previous component state management
3. All existing functionality remains unchanged

## Success Criteria

✅ **Database table created successfully**
✅ **Locking state persists across page refreshes**
✅ **Admin and Secretary panels work identically**
✅ **Security policies prevent unauthorized access**
✅ **Performance is acceptable with database queries**
✅ **Error handling works correctly**
✅ **All existing functionality remains unchanged**

## Next Steps

1. **Deploy**: Run setup script in production database
2. **Test**: Verify functionality in production environment
3. **Monitor**: Watch for any performance issues
4. **Document**: Update user documentation
5. **Train**: Train admins on new locking functionality

## Support

For issues or questions:
1. Check this guide first
2. Review browser console for errors
3. Check database logs for SQL errors
4. Verify all setup steps were completed
5. Test in development environment first

The permanent locking functionality provides a robust, secure, and persistent way to lock installments that will survive page refreshes, browser restarts, and server reboots.
