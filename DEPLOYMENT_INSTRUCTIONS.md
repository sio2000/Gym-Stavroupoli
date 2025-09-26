# Group Training Calendar - Deployment Instructions

## Pre-Deployment Checklist

### ✅ Database Verification
- [ ] `group_sessions` table exists
- [ ] Proper indexes are created
- [ ] RLS policies are configured
- [ ] Test data is available for verification

### ✅ Code Quality
- [ ] All tests pass (`npm run test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compilation successful (`npm run build`)

### ✅ Feature Flag
- [ ] Feature flag is properly configured
- [ ] Can be disabled without breaking existing functionality
- [ ] Admin-only access is enforced

## Deployment Steps

### 1. Database Migration

Run the following SQL in your Supabase SQL Editor:

```sql
-- Verify group_sessions table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'group_sessions'
);

-- If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS group_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES personal_training_schedules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    trainer VARCHAR(255) NOT NULL,
    room VARCHAR(255) NOT NULL,
    group_type INTEGER NOT NULL DEFAULT 3,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(user_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_group_sessions_date ON group_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_group_sessions_active ON group_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_group_sessions_program_id ON group_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_user_id ON group_sessions(user_id);

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'group_sessions';
```

### 2. Code Deployment

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm install

# 3. Run tests
npm run test
npm run test:e2e

# 4. Build for production
npm run build

# 5. Deploy to your hosting platform
npm run deploy
```

### 3. Feature Flag Configuration

In `src/pages/AdminPanel.tsx`, ensure the feature flag is set correctly:

```typescript
// For production deployment
const [groupCalendarEnabled] = useState(true);

// For gradual rollout
const [groupCalendarEnabled] = useState(process.env.NODE_ENV === 'production' ? false : true);
```

### 4. Environment Verification

Verify these environment variables are set:

```bash
# Required Supabase configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Feature flags
VITE_GROUP_CALENDAR_ENABLED=true
```

## Post-Deployment Verification

### 1. Functional Testing

1. **Access Admin Panel**
   - Navigate to `/admin`
   - Login with admin credentials
   - Verify "Personal Training" tab is accessible

2. **Calendar Display**
   - Click on "Personal Training" tab
   - Scroll down to "Group Training Calendar" section
   - Verify calendar is displayed with current month
   - Check navigation controls (prev/next/today buttons)

3. **Session Interaction**
   - If sessions exist, click on them to view details
   - Verify modal opens with session information
   - Test session cancellation (if applicable)

4. **Responsive Design**
   - Test on desktop (1920x1080)
   - Test on tablet (768x1024)
   - Test on mobile (375x667)

### 2. Performance Testing

```bash
# Run performance tests
npm run test:performance

# Check bundle size
npm run analyze

# Monitor API response times
# Check browser dev tools Network tab
```

### 3. Error Handling

1. **API Failures**
   - Disable network connection
   - Verify graceful error handling
   - Check error messages are user-friendly

2. **Database Issues**
   - Test with empty database
   - Verify proper error messages
   - Check fallback behavior

## Rollback Instructions

If issues are encountered, follow these rollback steps:

### 1. Disable Feature Flag

```typescript
// In src/pages/AdminPanel.tsx
const [groupCalendarEnabled] = useState(false);
```

### 2. Remove Calendar Section

```typescript
// Comment out or remove the calendar section
{/* Group Training Calendar Section */}
{/* {groupCalendarEnabled && (
  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg border-2 border-green-200">
    <div className="p-4 sm:p-6">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-green-800">NEW FEATURE</span>
      </div>
      <GroupTrainingCalendar featureEnabled={groupCalendarEnabled} />
    </div>
  </div>
)} */}
```

### 3. Revert Code Changes

```bash
# Revert to previous commit
git revert <commit-hash>

# Or reset to previous state
git reset --hard HEAD~1
```

## Monitoring and Maintenance

### 1. Performance Monitoring

Monitor these metrics:
- API response times for calendar data
- Database query performance
- User interaction rates
- Error rates and types

### 2. User Feedback

Collect feedback on:
- Calendar usability
- Mobile experience
- Feature completeness
- Performance issues

### 3. Regular Maintenance

- **Weekly**: Check error logs
- **Monthly**: Review performance metrics
- **Quarterly**: Update documentation
- **As needed**: Address user feedback

## Troubleshooting Guide

### Common Issues

1. **Calendar Not Loading**
   ```
   Issue: Calendar shows loading state indefinitely
   Solution: Check database connection and RLS policies
   ```

2. **Sessions Not Displaying**
   ```
   Issue: Calendar is empty despite having sessions
   Solution: Verify date range and session data format
   ```

3. **Performance Issues**
   ```
   Issue: Calendar loads slowly
   Solution: Check database indexes and query optimization
   ```

4. **Mobile Display Issues**
   ```
   Issue: Calendar not responsive on mobile
   Solution: Check CSS media queries and component sizing
   ```

### Debug Commands

```bash
# Check application logs
npm run logs

# Monitor database queries
# Check Supabase dashboard for query performance

# Test API endpoints
curl -X GET "https://your-app.com/api/group-calendar?start=2025-09-01&end=2025-09-30"
```

## Support Contacts

- **Technical Issues**: Development Team
- **Database Issues**: Database Administrator
- **User Issues**: Support Team
- **Feature Requests**: Product Manager

## Success Criteria

The deployment is considered successful when:

- [ ] Calendar displays correctly in Admin Panel
- [ ] Sessions are visible and interactive
- [ ] Mobile responsiveness works properly
- [ ] Performance meets requirements (< 2s load time)
- [ ] Error handling works gracefully
- [ ] All tests pass in production environment
- [ ] User acceptance testing is completed
- [ ] Documentation is updated and accessible

## Next Steps

After successful deployment:

1. **Monitor Usage**: Track feature adoption and usage patterns
2. **Collect Feedback**: Gather user feedback for improvements
3. **Plan Enhancements**: Identify areas for future development
4. **Document Lessons**: Update deployment procedures based on experience
5. **Schedule Review**: Plan regular feature reviews and updates
