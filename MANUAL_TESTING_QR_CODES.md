# Manual Testing Guide - QR Code System Fix

## Overview
This guide provides step-by-step instructions for manually testing the QR code system fix in a staging environment.

## Prerequisites
- Access to staging environment
- Admin credentials for Supabase dashboard
- Test users with various membership scenarios

## Pre-Testing Setup

### 1. Execute Database Migration
1. Open Supabase SQL Editor in staging environment
2. Copy and paste the contents of `database/FIX_EXPIRED_MEMBERSHIPS_FOR_QR_CODES.sql`
3. Run the verification query first:
   ```sql
   -- Check problematic memberships
   SELECT COUNT(*) as problematic_count 
   FROM memberships 
   WHERE is_active = true AND end_date < CURRENT_DATE;
   ```
4. If count > 0, execute the migration script
5. Uncomment `COMMIT;` to apply changes
6. Verify problematic count is now 0

### 2. Verify Database State
```sql
-- Check total memberships
SELECT 
    COUNT(*) as total_memberships,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_memberships,
    SUM(CASE WHEN is_active = false AND end_date < CURRENT_DATE THEN 1 ELSE 0 END) as expired_inactive_memberships,
    SUM(CASE WHEN is_active = true AND end_date < CURRENT_DATE THEN 1 ELSE 0 END) as problematic_memberships
FROM memberships;
```

## Test Scenarios

### Scenario 1: User with No Memberships

**Objective**: Verify that users without any memberships see no QR code options.

**Steps**:
1. Find a user with no memberships in the database
2. Log in as that user
3. Navigate to QR Codes page
4. Verify that only the "No Active Memberships" message is shown
5. Verify no QR generation buttons are visible

**Expected Result**: 
- ✅ No QR generation options visible
- ✅ Message: "Δεν έχετε ενεργές συνδρομές"
- ✅ Link to membership page is present

**Test Data Query**:
```sql
-- Find user with no memberships
SELECT up.user_id, up.email, up.first_name, up.last_name
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id
WHERE m.user_id IS NULL
LIMIT 1;
```

### Scenario 2: User with Only Expired Memberships

**Objective**: Verify that users with only expired memberships see no QR code options.

**Steps**:
1. Find a user with only expired memberships
2. Log in as that user
3. Navigate to QR Codes page
4. Verify that only the "No Active Memberships" message is shown
5. Verify no QR generation buttons are visible

**Expected Result**:
- ✅ No QR generation options visible
- ✅ Message: "Δεν έχετε ενεργές συνδρομές"

**Test Data Query**:
```sql
-- Find user with only expired memberships
SELECT up.user_id, up.email, up.first_name, up.last_name
FROM user_profiles up
WHERE up.user_id IN (
    SELECT m.user_id 
    FROM memberships m 
    WHERE m.user_id NOT IN (
        SELECT DISTINCT user_id 
        FROM memberships 
        WHERE is_active = true AND end_date >= CURRENT_DATE
    )
    AND m.user_id IN (
        SELECT DISTINCT user_id 
        FROM memberships 
        WHERE is_active = false AND end_date < CURRENT_DATE
    )
)
LIMIT 1;
```

### Scenario 3: User with Only Free Gym Active Membership

**Objective**: Verify that users with only Free Gym membership see only Free Gym QR option.

**Steps**:
1. Find a user with only Free Gym active membership
2. Log in as that user
3. Navigate to QR Codes page
4. Verify that only Free Gym QR generation button is visible
5. Test QR code generation for Free Gym
6. Verify QR code is created successfully

**Expected Result**:
- ✅ Only Free Gym QR generation button visible
- ✅ Button shows: "🏋️ Ελεύθερο Gym - Δημιουργία QR Code"
- ✅ QR code generation works for Free Gym

**Test Data Query**:
```sql
-- Find user with only Free Gym active membership
SELECT up.user_id, up.email, up.first_name, up.last_name
FROM user_profiles up
WHERE up.user_id IN (
    SELECT m.user_id
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.is_active = true 
    AND m.end_date >= CURRENT_DATE
    AND mp.package_type IN ('free_gym', 'standard')
    AND m.user_id NOT IN (
        SELECT DISTINCT m2.user_id
        FROM memberships m2
        JOIN membership_packages mp2 ON m2.package_id = mp2.id
        WHERE m2.is_active = true 
        AND m2.end_date >= CURRENT_DATE
        AND mp2.package_type NOT IN ('free_gym', 'standard')
    )
)
LIMIT 1;
```

### Scenario 4: User with Only Pilates Active Membership

**Objective**: Verify that users with only Pilates membership see only Pilates QR option.

**Steps**:
1. Find a user with only Pilates active membership
2. Log in as that user
3. Navigate to QR Codes page
4. Verify that only Pilates QR generation button is visible
5. Test QR code generation for Pilates
6. Verify QR code is created successfully

**Expected Result**:
- ✅ Only Pilates QR generation button visible
- ✅ Button shows: "🧘 Pilates - Δημιουργία QR Code"
- ✅ QR code generation works for Pilates

### Scenario 5: User with Only Personal Training Accepted

**Objective**: Verify that users with only Personal Training see only Personal Training QR option.

**Steps**:
1. Find a user with accepted Personal Training schedule but no other memberships
2. Log in as that user
3. Navigate to QR Codes page
4. Verify that only Personal Training QR generation button is visible
5. Test QR code generation for Personal Training
6. Verify QR code is created successfully

**Expected Result**:
- ✅ Only Personal Training QR generation button visible
- ✅ Button shows: "🥊 Personal Training - Δημιουργία QR Code"
- ✅ QR code generation works for Personal Training

**Test Data Query**:
```sql
-- Find user with Personal Training but no other active memberships
SELECT up.user_id, up.email, up.first_name, up.last_name
FROM user_profiles up
WHERE up.user_id IN (
    SELECT pts.user_id
    FROM personal_training_schedules pts
    WHERE pts.status = 'accepted'
    AND pts.user_id NOT IN (
        SELECT DISTINCT user_id
        FROM memberships
        WHERE is_active = true AND end_date >= CURRENT_DATE
    )
)
LIMIT 1;
```

### Scenario 6: User with Multiple Active Memberships

**Objective**: Verify that users with multiple active memberships see all relevant QR options.

**Steps**:
1. Find a user with multiple active memberships (e.g., Free Gym + Pilates)
2. Log in as that user
3. Navigate to QR Codes page
4. Verify that all relevant QR generation buttons are visible
5. Test QR code generation for each membership type
6. Verify QR codes are created successfully for each

**Expected Result**:
- ✅ Multiple QR generation buttons visible (based on active memberships)
- ✅ Each button shows correct icon, label, and "Δημιουργία QR Code"
- ✅ QR code generation works for all membership types

### Scenario 7: QR Code Generation Validation

**Objective**: Verify that QR code generation properly validates active memberships.

**Steps**:
1. Try to generate QR code for each available option
2. Verify that generation succeeds for active memberships
3. Test with user who has expired memberships (should not see options)
4. Test with user who has no memberships (should not see options)

**Expected Result**:
- ✅ QR code generation succeeds for active memberships
- ✅ No QR code options visible for expired/no memberships
- ✅ Error handling works correctly for edge cases

### Scenario 8: Real-time Updates

**Objective**: Verify that QR options update when membership status changes.

**Steps**:
1. Login as user with active membership
2. Navigate to QR Codes page
3. Verify QR options are visible
4. (Admin) Expire the user's membership in database
5. Refresh QR Codes page
6. Verify QR options are no longer visible

**Expected Result**:
- ✅ QR options disappear when membership expires
- ✅ "No Active Memberships" message appears
- ✅ Real-time updates work correctly

## Edge Cases Testing

### Edge Case 1: Network Latency
- Test with slow network connection
- Verify loading states work correctly
- Ensure QR options don't show incorrectly during loading

### Edge Case 2: Cache Invalidation
- Test with multiple browser tabs open
- Verify that membership changes are reflected across tabs
- Test browser refresh behavior

### Edge Case 3: Multiple Tabs
- Open QR Codes page in multiple tabs
- Make membership changes in one tab
- Verify other tabs update correctly

### Edge Case 4: Time Zone Handling
- Test with users in different time zones
- Verify date comparisons work correctly
- Test membership expiration at midnight

## Performance Testing

### Load Testing
1. Test with multiple users accessing QR Codes page simultaneously
2. Verify page load times are acceptable
3. Test QR code generation under load

### Database Performance
1. Monitor database queries during testing
2. Verify query performance is acceptable
3. Check for any slow queries or locks

## Error Handling Testing

### Error Scenarios
1. Test with database connection issues
2. Test with invalid user data
3. Test with corrupted membership data
4. Verify error messages are user-friendly

### Recovery Testing
1. Test system recovery after database issues
2. Verify QR code generation works after recovery
3. Test cleanup function execution

## Browser Compatibility Testing

### Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Testing
- Test on mobile devices
- Verify QR code display works on small screens
- Test touch interactions

## Security Testing

### Access Control
1. Verify only authenticated users can access QR Codes page
2. Test with users who don't have memberships
3. Verify proper error handling for unauthorized access

### Data Validation
1. Test with malformed user data
2. Verify SQL injection protection
3. Test with invalid membership data

## Documentation Verification

### User Experience
1. Verify error messages are clear and helpful
2. Check that loading states are informative
3. Verify navigation works correctly

### Accessibility
1. Test keyboard navigation
2. Verify screen reader compatibility
3. Check color contrast and readability

## Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: Staging

Scenario 1 (No Memberships):
- [ ] Pass
- [ ] Fail
- Notes: ___________

Scenario 2 (Expired Memberships):
- [ ] Pass
- [ ] Fail
- Notes: ___________

Scenario 3 (Free Gym Only):
- [ ] Pass
- [ ] Fail
- Notes: ___________

Scenario 4 (Pilates Only):
- [ ] Pass
- [ ] Fail
- Notes: ___________

Scenario 5 (Personal Training Only):
- [ ] Pass
- [ ] Fail
- Notes: ___________

Scenario 6 (Multiple Memberships):
- [ ] Pass
- [ ] Fail
- Notes: ___________

Scenario 7 (QR Generation Validation):
- [ ] Pass
- [ ] Fail
- Notes: ___________

Scenario 8 (Real-time Updates):
- [ ] Pass
- [ ] Fail
- Notes: ___________

Edge Cases:
- [ ] Network Latency: Pass/Fail
- [ ] Cache Invalidation: Pass/Fail
- [ ] Multiple Tabs: Pass/Fail
- [ ] Time Zone Handling: Pass/Fail

Performance:
- [ ] Load Testing: Pass/Fail
- [ ] Database Performance: Pass/Fail

Error Handling:
- [ ] Error Scenarios: Pass/Fail
- [ ] Recovery Testing: Pass/Fail

Browser Compatibility:
- [ ] Chrome: Pass/Fail
- [ ] Firefox: Pass/Fail
- [ ] Safari: Pass/Fail
- [ ] Edge: Pass/Fail
- [ ] Mobile: Pass/Fail

Security:
- [ ] Access Control: Pass/Fail
- [ ] Data Validation: Pass/Fail

Overall Result: [ ] PASS [ ] FAIL

Issues Found:
1. ___________
2. ___________
3. ___________

Recommendations:
1. ___________
2. ___________
3. ___________
```

## Sign-off Criteria

### Must Pass
- [ ] All 8 main scenarios pass
- [ ] No QR options visible for expired/no memberships
- [ ] QR generation works for all active memberships
- [ ] Real-time updates work correctly
- [ ] No database errors or performance issues

### Should Pass
- [ ] All edge cases pass
- [ ] Performance is acceptable
- [ ] Error handling works correctly
- [ ] Browser compatibility is good
- [ ] Security tests pass

### Nice to Have
- [ ] All accessibility tests pass
- [ ] Mobile experience is excellent
- [ ] Documentation is complete

## Post-Testing Actions

### If All Tests Pass
1. Document test results
2. Get stakeholder approval
3. Schedule production deployment
4. Prepare rollback plan

### If Tests Fail
1. Document all failures
2. Investigate root causes
3. Fix issues and retest
4. Update documentation

### Production Deployment
1. Execute database migration in production
2. Verify migration success
3. Monitor system for 24 hours
4. Confirm no issues reported

## Contact Information

**Technical Lead**: [Name]
**Email**: [Email]
**Phone**: [Phone]

**QA Lead**: [Name]
**Email**: [Email]
**Phone**: [Phone]

**Database Admin**: [Name]
**Email**: [Email]
**Phone**: [Phone]
