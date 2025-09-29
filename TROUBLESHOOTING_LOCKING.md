# Troubleshooting Installment Locking Issues

## Problem: Locking not persisting after page refresh

### Root Cause
The issue is that the original `getMembershipRequests()` function doesn't load the locked installments data from the database.

### Solution Applied
1. **Created new API function**: `getMembershipRequestsWithLockedInstallments()`
2. **Updated components**: Both AdminPanel and SecretaryDashboard now use the new function
3. **Database integration**: The new function loads locked installments for each request

### Files Modified
- `src/utils/membershipApi.ts` - Added new function
- `src/pages/AdminPanel.tsx` - Updated to use new function
- `src/pages/SecretaryDashboard.tsx` - Updated to use new function

## Problem: "policy already exists" error

### Root Cause
The SQL script was trying to create policies that already existed.

### Solution Applied
Created `setup-permanent-locking-fixed.sql` which:
1. Drops existing policies first
2. Drops existing functions first
3. Creates everything fresh

### How to Fix
1. Run `setup-permanent-locking-fixed.sql` in Supabase SQL Editor
2. This will resolve the "policy already exists" error

## Step-by-Step Fix Instructions

### Step 1: Fix Database Setup
```sql
-- Run this in Supabase SQL Editor
-- File: setup-permanent-locking-fixed.sql
```

### Step 2: Verify Database Functions
After running the SQL script, verify these functions exist:
```sql
-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN (
    'get_locked_installments_for_request',
    'lock_installment',
    'unlock_installment'
);
```

### Step 3: Test Database Functions
```sql
-- Test the functions (replace with actual IDs)
SELECT get_locked_installments_for_request('your-request-id'::UUID);
SELECT lock_installment('your-request-id'::UUID, 1, 'your-user-id'::UUID);
```

### Step 4: Check Browser Console
1. Open Admin Panel → Ultimate Package tab
2. Open browser developer tools (F12)
3. Check Console tab for errors
4. Look for these API calls in Network tab:
   - `get_locked_installments_for_request`
   - `lock_installment`

### Step 5: Verify Component State
In browser console, run:
```javascript
// Check if the new function is being called
console.log('Ultimate requests:', window.ultimateRequests);

// Check if requests have locked installments data
window.ultimateRequests?.forEach(req => {
    console.log(`Request ${req.id}:`, {
        locked_installments: req.locked_installments,
        installment_1_locked: req.installment_1_locked,
        installment_2_locked: req.installment_2_locked,
        installment_3_locked: req.installment_3_locked
    });
});
```

## Debug Checklist

### ✅ Database Setup
- [ ] `locked_installments` table exists
- [ ] Database functions exist and work
- [ ] RLS policies are correct
- [ ] User has admin/secretary role

### ✅ API Functions
- [ ] `getMembershipRequestsWithLockedInstallments()` exists
- [ ] Function is imported in components
- [ ] Function is being called correctly
- [ ] No console errors

### ✅ Component Logic
- [ ] Checkbox appears under each installment
- [ ] Clicking checkbox shows popup
- [ ] Confirming locks the installment
- [ ] Locked installments show orange styling
- [ ] Locking persists after page refresh

### ✅ Network Calls
- [ ] `get_locked_installments_for_request` API calls visible
- [ ] `lock_installment` API calls when locking
- [ ] API calls return success (200 status)
- [ ] No network errors

## Common Issues & Solutions

### Issue 1: "Function not found" error
**Solution**: Run the SQL script again, check for syntax errors

### Issue 2: "Permission denied" error
**Solution**: Check if user has admin/secretary role in database

### Issue 3: Checkbox not appearing
**Solution**: Check if component is receiving the correct props

### Issue 4: Popup not showing
**Solution**: Check browser console for JavaScript errors

### Issue 5: Locking not persisting
**Solution**: Verify `getMembershipRequestsWithLockedInstallments()` is being called

## Testing After Fix

### Test 1: Basic Functionality
1. Navigate to Admin Panel → Ultimate Package tab
2. Find a request with installments
3. Click checkbox under "1η Δόση"
4. Confirm lock in popup
5. Click "Save Installments"
6. **Result**: Installment should be locked (orange styling)

### Test 2: Persistence
1. After Test 1, refresh page (F5)
2. **Result**: Installment should still be locked

### Test 3: Database Verification
```sql
-- Check if lock was saved
SELECT * FROM locked_installments 
WHERE membership_request_id = 'your-request-id';
```

### Test 4: Multiple Installments
1. Lock installments 1 and 3
2. Refresh page
3. **Result**: Only installments 1 and 3 should be locked

### Test 5: Secretary Panel
1. Repeat all tests in Secretary Dashboard
2. **Result**: Identical functionality to Admin Panel

## Expected Behavior After Fix

### On Page Load
- Each Ultimate request loads with `locked_installments` array
- Each request has `installment_1_locked`, `installment_2_locked`, `installment_3_locked` flags
- Previously locked installments appear locked with orange styling

### On Locking
- Clicking checkbox shows confirmation popup
- Confirming calls `lock_installment()` database function
- Installment becomes locked immediately (orange styling)
- Lock persists after page refresh

### On Refresh
- `getMembershipRequestsWithLockedInstallments()` is called
- Database returns locked installments for each request
- UI shows correct locked state

## Files to Check if Issues Persist

### Database Files
- `setup-permanent-locking-fixed.sql` - Main setup script
- `database/CREATE_LOCKED_INSTALLMENTS_TABLE.sql` - Detailed table creation

### Frontend Files
- `src/utils/membershipApi.ts` - API functions
- `src/pages/AdminPanel.tsx` - Admin panel logic
- `src/pages/SecretaryDashboard.tsx` - Secretary panel logic
- `src/components/admin/AdminUltimateInstallmentsTab.tsx` - Admin component
- `src/components/secretary/UltimateInstallmentsTab.tsx` - Secretary component

### Debug Files
- `debug-locking.js` - Debug script
- `TROUBLESHOOTING_LOCKING.md` - This troubleshooting guide

## Contact Support

If issues persist after following this guide:
1. Check browser console for specific error messages
2. Check database logs for SQL errors
3. Verify all setup steps were completed
4. Test in development environment first

The locking functionality should work correctly after applying these fixes!
