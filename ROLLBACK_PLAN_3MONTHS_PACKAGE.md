# 🔄 Rollback Plan: Free Gym 3-Months Package

## 🚨 **Emergency Rollback Instructions**

If the 3-months package deployment causes any issues, follow this rollback plan immediately.

## ⚡ **Quick Rollback (5 minutes)**

### **Step 1: Database Rollback**
Execute the rollback SQL script in Supabase SQL Editor:

```sql
-- File: database/ROLLBACK_FREE_GYM_3MONTHS_PACKAGE.sql
```

**This will:**
- ✅ Remove 3months duration from Free Gym package
- ✅ Check for active memberships before deletion
- ✅ Warn if active memberships exist
- ✅ Restore Free Gym to original state

### **Step 2: Frontend Rollback**
Revert the following files to their previous state:

```bash
# Revert backend changes
git checkout HEAD~1 -- src/utils/membershipApi.ts
git checkout HEAD~1 -- src/types/index.ts

# Revert frontend changes  
git checkout HEAD~1 -- src/pages/Membership.tsx
git checkout HEAD~1 -- src/pages/PublicRegistration.tsx

# Rebuild and redeploy
npm run build
# Deploy to your hosting platform
```

## 🔍 **Detailed Rollback Steps**

### **Database Rollback Details**

The rollback script performs these operations:

1. **Safety Checks:**
   - Verifies 3months duration exists
   - Counts active memberships using 3months
   - Counts pending requests using 3months
   - Shows warnings if data exists

2. **Data Removal:**
   - Deletes 3months duration from membership_package_durations
   - Verifies removal was successful
   - Shows remaining Free Gym options

3. **Verification:**
   - Confirms 3months duration is removed
   - Shows updated Free Gym duration list
   - Confirms system is restored

### **Frontend Rollback Details**

**Files to revert:**

1. **`src/utils/membershipApi.ts`:**
   - Remove '3months': 90 from getDurationDays()
   - Remove 3months handling from getDurationDisplayText()

2. **`src/types/index.ts`:**
   - Remove '3months' from duration_type union types

3. **`src/pages/Membership.tsx`:**
   - Remove '3months': 90 from sorting order

4. **`src/pages/PublicRegistration.tsx`:**
   - Remove '3months': 90 from sorting order

## ⚠️ **Important Considerations**

### **Before Rollback:**

1. **Check for Active Memberships:**
   ```sql
   SELECT COUNT(*) as active_3months_memberships
   FROM memberships m
   JOIN membership_package_durations mpd ON m.package_id = mpd.package_id
   JOIN membership_packages mp ON mpd.package_id = mp.id
   WHERE mp.name = 'Free Gym' 
   AND mpd.duration_type = '3months'
   AND m.is_active = true
   AND m.end_date >= CURRENT_DATE;
   ```

2. **Check for Pending Requests:**
   ```sql
   SELECT COUNT(*) as pending_3months_requests
   FROM membership_requests mr
   JOIN membership_package_durations mpd ON mr.package_id = mpd.package_id
   JOIN membership_packages mp ON mpd.package_id = mp.id
   WHERE mp.name = 'Free Gym' 
   AND mpd.duration_type = '3months'
   AND mr.status = 'pending';
   ```

### **If Active Memberships Exist:**

**Option 1: Wait for Expiration**
- Let existing 3-month memberships expire naturally
- Rollback after all memberships expire

**Option 2: Manual Migration**
- Convert 3-month memberships to 6-month memberships
- Adjust pricing accordingly
- Then proceed with rollback

**Option 3: Force Rollback**
- ⚠️ **WARNING:** This will break active memberships
- Only use if absolutely necessary
- Notify affected users immediately

## 🧪 **Post-Rollback Verification**

### **Database Verification:**
```sql
-- Verify 3months duration is removed
SELECT COUNT(*) as three_months_count
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym' 
AND mpd.duration_type = '3months';

-- Should return 0
```

### **Frontend Verification:**
1. Visit `/membership` page
2. Select "Free Gym" package
3. Verify 3-month option is NOT visible
4. Verify only original options appear:
   - 1 εβδομάδα (€10.00)
   - 1 μήνας (€50.00)
   - 6 μήνες (€150.00)
   - 1 έτος (€240.00)

### **System Verification:**
1. Test existing functionality works
2. Verify no JavaScript errors in console
3. Test QR code generation still works
4. Test admin/secretary panels work correctly

## 📞 **Emergency Contacts**

If rollback fails or causes additional issues:

1. **Immediate Actions:**
   - Restore from database backup
   - Revert to previous code deployment
   - Notify users of temporary service issues

2. **Investigation:**
   - Check database logs for errors
   - Review application logs
   - Test in staging environment

3. **Recovery:**
   - Fix any issues found
   - Re-test the rollback process
   - Plan re-deployment if needed

## 📋 **Rollback Checklist**

- [ ] Database rollback script executed
- [ ] Frontend code reverted
- [ ] Application rebuilt and redeployed
- [ ] 3-month option no longer visible in UI
- [ ] Existing functionality works correctly
- [ ] No JavaScript errors in console
- [ ] QR codes work for existing memberships
- [ ] Admin/secretary panels work correctly
- [ ] Users notified of any service interruption

## ✅ **Rollback Complete**

Once all checklist items are verified:
- [ ] System is restored to pre-deployment state
- [ ] All functionality works as before
- [ ] No 3-month package references remain
- [ ] Users can continue using the system normally

---

**🔄 Rollback complete! The system has been restored to its previous state.**
