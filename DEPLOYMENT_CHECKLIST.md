# Weekly Pilates Refill System - Deployment Checklist

## Pre-Deployment Requirements

### 1. Database Backup
- [ ] Create full database backup before deployment
- [ ] Verify backup integrity
- [ ] Document backup location and timestamp

### 2. Environment Verification
- [ ] Confirm Supabase project is in correct environment (staging/production)
- [ ] Verify database connection and permissions
- [ ] Check that all required packages exist:
  - [ ] Ultimate package (500€)
  - [ ] Ultimate Medium package (400€)
  - [ ] Pilates package
  - [ ] Free Gym package

### 3. Code Review
- [ ] Review all migration scripts for syntax errors
- [ ] Verify feature flag implementation
- [ ] Check API functions and error handling
- [ ] Confirm frontend components are properly integrated

## Deployment Steps

### Phase 1: Database Migration
```bash
# 1. Run the main migration script
psql -h your-db-host -U your-user -d your-database -f database/WEEKLY_PILATES_REFILL_UP.sql

# 2. Verify migration success
psql -h your-db-host -U your-user -d your-database -f database/TEST_WEEKLY_PILATES_REFILL.sql
```

### Phase 2: Feature Flag Configuration
```sql
-- Enable the feature flag (initially disabled for safety)
UPDATE public.feature_flags 
SET is_enabled = true, updated_at = now()
WHERE name = 'weekly_pilates_refill_enabled';
```

### Phase 3: Frontend Deployment
- [ ] Deploy updated API functions (`src/utils/weeklyRefillApi.ts`)
- [ ] Deploy admin component (`src/components/admin/WeeklyRefillManager.tsx`)
- [ ] Deploy user component (`src/components/user/WeeklyRefillStatus.tsx`)
- [ ] Update AdminPanel to include WeeklyRefillManager
- [ ] Update user dashboard to include WeeklyRefillStatus

### Phase 4: Integration Testing
```sql
-- Test Ultimate package activation
SELECT * FROM create_ultimate_dual_memberships(
    'test-user-id'::uuid,
    'test-request-id'::uuid,
    365,
    CURRENT_DATE - INTERVAL '7 days'
);

-- Test weekly refill processing
SELECT * FROM process_weekly_pilates_refills();

-- Test user status retrieval
SELECT * FROM get_user_weekly_refill_status('test-user-id'::uuid);
```

## Post-Deployment Verification

### 1. Database Verification
- [ ] Verify all tables were created:
  - [ ] `ultimate_weekly_refills`
  - [ ] `feature_flags`
- [ ] Check all functions exist:
  - [ ] `process_weekly_pilates_refills()`
  - [ ] `get_user_weekly_refill_status()`
  - [ ] `manual_trigger_weekly_refill()`
  - [ ] Updated `create_ultimate_dual_memberships()`

### 2. Feature Flag Testing
```sql
-- Check feature flag status
SELECT * FROM feature_flags WHERE name = 'weekly_pilates_refill_enabled';

-- Test disable/enable
UPDATE feature_flags SET is_enabled = false WHERE name = 'weekly_pilates_refill_enabled';
UPDATE feature_flags SET is_enabled = true WHERE name = 'weekly_pilates_refill_enabled';
```

### 3. Ultimate Package Testing
- [ ] Create test Ultimate membership request
- [ ] Approve the request through admin panel
- [ ] Verify both Pilates and Free Gym memberships are created
- [ ] Verify initial Pilates deposit is credited (3 lessons)
- [ ] Verify Ultimate Medium works correctly (1 lesson)

### 4. Weekly Refill Testing
- [ ] Create test user with Ultimate package activated 7+ days ago
- [ ] Manually trigger weekly refill
- [ ] Verify deposit is topped up correctly
- [ ] Test idempotency (run twice, should only refill once)
- [ ] Test with sufficient deposits (should not change)

### 5. Frontend Testing
- [ ] Admin can access WeeklyRefillManager
- [ ] Admin can process weekly refills
- [ ] Admin can toggle feature flag
- [ ] Users can see their refill status
- [ ] Users can manually trigger refills when due

## Monitoring Setup

### 1. Database Monitoring
```sql
-- Query to monitor refill activity
SELECT 
    DATE(created_at) as refill_date,
    COUNT(*) as total_refills,
    SUM(CASE WHEN package_name = 'Ultimate' THEN 1 ELSE 0 END) as ultimate_refills,
    SUM(CASE WHEN package_name = 'Ultimate Medium' THEN 1 ELSE 0 END) as ultimate_medium_refills
FROM ultimate_weekly_refills 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY refill_date DESC;
```

### 2. Error Monitoring
- [ ] Set up alerts for function execution errors
- [ ] Monitor failed refill attempts
- [ ] Track feature flag toggles
- [ ] Monitor database performance impact

### 3. Business Metrics
- [ ] Track weekly refill volume
- [ ] Monitor Ultimate vs Ultimate Medium usage
- [ ] Track manual refill triggers
- [ ] Monitor deposit utilization

## Rollback Plan

### Immediate Rollback (if issues detected)
```sql
-- 1. Disable feature flag immediately
UPDATE feature_flags 
SET is_enabled = false, updated_at = now()
WHERE name = 'weekly_pilates_refill_enabled';

-- 2. Run rollback script if needed
psql -h your-db-host -U your-user -d your-database -f database/WEEKLY_PILATES_REFILL_DOWN.sql
```

### Full Rollback Steps
1. [ ] Disable feature flag
2. [ ] Run rollback migration script
3. [ ] Revert frontend code changes
4. [ ] Restore database from backup if necessary
5. [ ] Verify system is back to pre-deployment state

## Scheduled Job Setup

### Option 1: Supabase Edge Functions (Recommended)
```typescript
// Create edge function for daily refill processing
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data, error } = await supabase.rpc('process_weekly_pilates_refills')
  
  return new Response(JSON.stringify({ data, error }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

### Option 2: External Cron Job
```bash
# Add to crontab to run daily at 2 AM
0 2 * * * /usr/bin/psql -h your-db-host -U your-user -d your-database -c "SELECT process_weekly_pilates_refills();"
```

### Option 3: Manual Processing
- [ ] Document manual processing procedure
- [ ] Train admin users on manual refill processing
- [ ] Set up monitoring to detect when manual processing is needed

## Success Criteria

### Technical Success
- [ ] All migrations run without errors
- [ ] Feature flag controls system behavior
- [ ] Functions execute without database errors
- [ ] Frontend components render correctly
- [ ] API calls return expected data

### Business Success
- [ ] Ultimate users receive weekly Pilates deposit refills
- [ ] Ultimate Medium users receive weekly Pilates deposit refills
- [ ] System is idempotent and safe for multiple executions
- [ ] Admin can monitor and control the system
- [ ] Users can see their refill status and manually trigger when needed

## Post-Deployment Tasks

### Week 1
- [ ] Monitor daily refill processing
- [ ] Verify no performance issues
- [ ] Check error logs daily
- [ ] Confirm users are receiving refills

### Week 2-4
- [ ] Analyze refill patterns
- [ ] Optimize performance if needed
- [ ] Gather user feedback
- [ ] Document any issues and resolutions

### Month 2+
- [ ] Review business impact
- [ ] Consider optimizations
- [ ] Plan any enhancements
- [ ] Update documentation based on learnings

## Emergency Contacts

- **Database Issues**: [Database Admin Contact]
- **Frontend Issues**: [Frontend Developer Contact]
- **Business Issues**: [Product Manager Contact]
- **Emergency Rollback**: [DevOps Contact]

## Documentation Updates

- [ ] Update API documentation
- [ ] Update user guide
- [ ] Update admin guide
- [ ] Update system architecture documentation
- [ ] Update monitoring runbooks
