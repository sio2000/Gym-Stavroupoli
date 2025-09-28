# QA Checklist: Program Options Empty Field Fix

## Overview
This checklist verifies that the Program Options section correctly handles empty fields by treating them as 0 instead of reusing previous values.

## Test Scenarios

### Scenario 1: Initial Save (Should work as before)
1. **Setup**: Navigate to Admin Panel → Program Options
2. **Action**: 
   - Select a user
   - Enter kettlebell points: 10
   - Enter cash amount: 10
   - Enter POS amount: 10
   - Click Save/Approve
3. **Expected Result**: All values (10, 10, 10) are saved correctly
4. **Status**: [ ] Pass [ ] Fail

### Scenario 2: Update with Empty Fields (The Bug Fix)
1. **Setup**: After Scenario 1, return to the same user
2. **Action**:
   - Enter kettlebell points: 7
   - Enter cash amount: 5
   - Leave POS amount empty (do not enter anything)
   - Click Save/Approve
3. **Expected Result**: Values should be (7, 5, 0) - NOT (7, 5, 10)
4. **Status**: [ ] Pass [ ] Fail

### Scenario 3: All Fields Empty
1. **Setup**: Select a user with existing values
2. **Action**:
   - Clear kettlebell points field (make it empty)
   - Clear cash amount field (make it empty)
   - Clear POS amount field (make it empty)
   - Click Save/Approve
3. **Expected Result**: All values should be (0, 0, 0)
4. **Status**: [ ] Pass [ ] Fail

### Scenario 4: Mixed Empty and Valid Fields
1. **Setup**: Select a user
2. **Action**:
   - Enter kettlebell points: 15
   - Leave cash amount empty
   - Enter POS amount: 25
   - Click Save/Approve
3. **Expected Result**: Values should be (15, 0, 25)
4. **Status**: [ ] Pass [ ] Fail

### Scenario 5: Whitespace Handling
1. **Setup**: Select a user
2. **Action**:
   - Enter kettlebell points: "   " (spaces only)
   - Enter cash amount: 0
   - Enter POS amount: 0
   - Click Save/Approve
3. **Expected Result**: Kettlebell points should be treated as 0
4. **Status**: [ ] Pass [ ] Fail

### Scenario 6: Secretary Dashboard
1. **Setup**: Navigate to Secretary Dashboard → Membership Requests
2. **Action**: 
   - Select a membership request
   - Enter values: points=8, cash=12, pos= (empty)
   - Approve the request
3. **Expected Result**: Values should be (8, 12, 0)
4. **Status**: [ ] Pass [ ] Fail

## Database Verification

### Check Kettlebell Points
```sql
SELECT user_id, points, created_at 
FROM user_kettlebell_points 
WHERE user_id = 'TARGET_USER_ID' 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check Cash Transactions
```sql
SELECT user_id, amount, transaction_type, created_at 
FROM user_cash_transactions 
WHERE user_id = 'TARGET_USER_ID' 
ORDER BY created_at DESC 
LIMIT 5;
```

## Regression Testing

### Existing Functionality
1. **Normal Operations**: [ ] Pass [ ] Fail
   - Regular saves with all fields filled work correctly
   - User selection and UI interactions work normally
   - Approval/rejection workflows function properly

2. **Data Integrity**: [ ] Pass [ ] Fail
   - No data corruption or loss
   - Existing records remain unchanged
   - New records are created correctly

3. **Performance**: [ ] Pass [ ] Fail
   - No significant performance degradation
   - UI remains responsive
   - Database operations complete in reasonable time

## Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Mobile Testing (WebView)
- [ ] Android WebView
- [ ] iOS WebView

## Rollback Plan
If issues are found:
1. Run the rollback script: `database/rollback_program_options_fix.sql`
2. Verify data restoration
3. Report issues for further investigation

## Sign-off
- **QA Tester**: _________________ Date: _________
- **Developer**: _________________ Date: _________
- **Product Owner**: _____________ Date: _________

## Notes
- Test with multiple users to ensure consistency
- Verify both individual and group program creation
- Check both admin and secretary workflows
- Monitor console logs for any errors during testing
