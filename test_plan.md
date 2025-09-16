# COMPREHENSIVE TEST PLAN FOR INFINITE RECURSION FIX

## Phase 1: Pre-Fix Testing (Staging)

### 1.1 Reproduce the Problem
```bash
# 1. Clear browser cache and localStorage
# 2. Open browser dev tools
# 3. Navigate to signup page
# 4. Fill out registration form
# 5. Submit form
# 6. Monitor network tab for 500 errors
# 7. Check console for infinite recursion errors
```

**Expected Results:**
- Multiple 500 errors on `user_profiles` queries
- Console shows "infinite recursion detected in policy for relation 'user_profiles'"
- Signup takes 10+ seconds or times out
- User profile not available immediately after signup

### 1.2 Database State Verification
```sql
-- Run these queries in Supabase SQL Editor
-- 1. Check current policies
SELECT polname, pg_get_policydef(oid) 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- 2. Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 3. Check for existing functions
SELECT proname, prokind 
FROM pg_proc 
WHERE proname LIKE '%user_profile%';
```

## Phase 2: Apply Safe Fix (Staging)

### 2.1 Run Migration Script
```bash
# 1. Connect to staging Supabase
# 2. Run fix_infinite_recursion_safe.sql
# 3. Verify all steps complete successfully
# 4. Check for any errors in the output
```

### 2.2 Verify New Functions Work
```sql
-- Test the new safe functions
-- 1. Test profile creation
SELECT public.create_user_profile_safe(
    '00000000-0000-0000-0000-000000000001'::UUID,
    'test@example.com',
    'Test',
    'User',
    '1234567890',
    'el'
);

-- 2. Test profile query
SELECT public.get_user_profile_safe('00000000-0000-0000-0000-000000000001'::UUID);

-- 3. Test safe view
SELECT * FROM public.user_profiles_safe WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID;

-- 4. Clean up test data
DELETE FROM public.user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID;
```

## Phase 3: Frontend Integration Testing (Staging)

### 3.1 Update Frontend to Use Safe Functions
```bash
# 1. Backup current AuthContext.tsx
cp src/contexts/AuthContext.tsx src/contexts/AuthContext.backup.tsx

# 2. Replace with safe version
cp src/contexts/AuthContextSafe.tsx src/contexts/AuthContext.tsx

# 3. Restart development server
npm run dev
```

### 3.2 Test Signup Flow
```bash
# 1. Clear browser cache and localStorage
# 2. Open browser dev tools
# 3. Navigate to signup page
# 4. Fill out registration form with test data:
#    - Email: test@example.com
#    - Password: TestPassword123!
#    - First Name: Test
#    - Last Name: User
#    - Phone: 1234567890
# 5. Submit form
# 6. Monitor network tab and console
```

**Expected Results:**
- No 500 errors on `user_profiles` queries
- No infinite recursion errors in console
- Signup completes in under 3 seconds
- User is automatically logged in
- User profile is available immediately
- Success toast appears

### 3.3 Test Login Flow
```bash
# 1. Logout if logged in
# 2. Navigate to login page
# 3. Enter credentials:
#    - Email: test@example.com
#    - Password: TestPassword123!
# 4. Submit form
# 5. Monitor network tab and console
```

**Expected Results:**
- No 500 errors
- Login completes in under 2 seconds
- User is redirected to dashboard
- User profile loads correctly

### 3.4 Test Profile Loading
```bash
# 1. Navigate to profile page
# 2. Check that all profile data loads correctly
# 3. Try updating profile information
# 4. Verify changes are saved
```

**Expected Results:**
- Profile page loads without errors
- All user data displays correctly
- Profile updates work normally
- No console errors

## Phase 4: Performance Testing (Staging)

### 4.1 Load Testing
```bash
# 1. Create multiple test accounts
# 2. Test concurrent signups
# 3. Monitor database performance
# 4. Check for any timeouts or errors
```

### 4.2 Stress Testing
```bash
# 1. Rapidly sign up and log out multiple times
# 2. Test with different user roles (admin, trainer, user)
# 3. Test with special characters in names
# 4. Test with very long input values
```

## Phase 5: Security Testing (Staging)

### 5.1 Access Control Testing
```sql
-- Test that users can only access their own profiles
-- 1. Create two test users
-- 2. Login as user 1
-- 3. Try to access user 2's profile
-- 4. Verify access is denied

-- Test with different roles
-- 1. Test as anonymous user
-- 2. Test as authenticated user
-- 3. Test as service role
```

### 5.2 SQL Injection Testing
```bash
# 1. Try to inject SQL in profile fields
# 2. Test with special characters
# 3. Verify no data corruption occurs
```

## Phase 6: Rollback Testing (Staging)

### 6.1 Test Rollback Procedure
```sql
-- 1. Disable new policies
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop new policies (if needed)
DROP POLICY IF EXISTS "safe_allow_registration" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_user_view_own" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_user_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_service_role_all" ON public.user_profiles;

-- 3. Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Verify original behavior is restored
```

## Phase 7: Production Deployment

### 7.1 Pre-Deployment Checklist
- [ ] All staging tests pass
- [ ] Database backup completed
- [ ] Rollback plan tested
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment

### 7.2 Deployment Steps
```bash
# 1. Deploy database changes
# 2. Deploy frontend changes
# 3. Monitor for errors
# 4. Test critical user flows
# 5. Verify performance metrics
```

### 7.3 Post-Deployment Monitoring
```bash
# 1. Monitor error rates
# 2. Check signup completion times
# 3. Verify user satisfaction
# 4. Monitor database performance
```

## Phase 8: Success Criteria

### 8.1 Performance Metrics
- [ ] Signup completion time < 3 seconds
- [ ] Login completion time < 2 seconds
- [ ] Profile loading time < 1 second
- [ ] Zero 500 errors on user_profiles queries
- [ ] Zero infinite recursion errors

### 8.2 Functional Requirements
- [ ] Users can sign up successfully
- [ ] Users are automatically logged in after signup
- [ ] User profiles are available immediately
- [ ] All existing functionality works unchanged
- [ ] No data loss or corruption

### 8.3 Security Requirements
- [ ] Users can only access their own profiles
- [ ] Admin users can access all profiles
- [ ] Service role can perform all operations
- [ ] No unauthorized access possible

## Phase 9: Monitoring and Alerts

### 9.1 Database Monitoring
```sql
-- Monitor for RLS errors
SELECT * FROM pg_stat_user_tables WHERE relname = 'user_profiles';

-- Monitor function performance
SELECT * FROM pg_stat_user_functions WHERE funcname LIKE '%user_profile%';
```

### 9.2 Application Monitoring
- Monitor 500 error rates
- Track signup completion times
- Monitor user profile loading times
- Set up alerts for infinite recursion errors

### 9.3 Log Analysis
```bash
# Monitor Supabase logs for:
# - RLS policy errors
# - Function execution errors
# - Performance issues
# - Security violations
```

## Phase 10: Documentation and Handover

### 10.1 Update Documentation
- [ ] Update API documentation
- [ ] Update deployment procedures
- [ ] Update troubleshooting guide
- [ ] Update security procedures

### 10.2 Team Training
- [ ] Train developers on new functions
- [ ] Train support team on troubleshooting
- [ ] Train DevOps on monitoring
- [ ] Create runbooks for common issues

## Emergency Procedures

### If Issues Arise
1. **Immediate**: Revert to backup AuthContext.tsx
2. **Database**: Run rollback SQL script
3. **Monitor**: Check error rates and user impact
4. **Communicate**: Notify team and users if needed
5. **Investigate**: Analyze logs to identify root cause
6. **Fix**: Implement additional fixes if needed

### Rollback Commands
```bash
# Frontend rollback
cp src/contexts/AuthContext.backup.tsx src/contexts/AuthContext.tsx

# Database rollback (if needed)
# Run rollback SQL script
```

## Success Metrics

### Before Fix
- Signup time: 10+ seconds
- 500 error rate: High
- User satisfaction: Low
- Support tickets: High

### After Fix
- Signup time: < 3 seconds
- 500 error rate: 0%
- User satisfaction: High
- Support tickets: Low
