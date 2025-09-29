# 🚀 Free Gym 3-Months Package (99€) - Deployment Guide

## 📋 **Overview**
This guide provides step-by-step instructions for safely deploying the new 3-month (99€) subscription package to the Free Gym system.

## ⚠️ **CRITICAL SAFETY REQUIREMENTS**

### **1. BACKUP FIRST** 
```bash
# Create full database backup
pg_dump -h your-host -U your-user -d your-db > backup_before_3months_package_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -la backup_before_3months_package_*.sql
```

### **2. STAGING FIRST**
- Deploy to staging environment first
- Run all tests on staging
- Verify functionality before production

## 🗄️ **Database Migration Steps**

### **Step 1: Run the Migration**
Execute the following SQL script in Supabase SQL Editor:

```sql
-- File: database/ADD_FREE_GYM_3MONTHS_PACKAGE.sql
```

**What this script does:**
- ✅ Updates database constraints to include '3months' duration type
- ✅ Adds 3-month (90 days, €99) duration option to Free Gym package
- ✅ Verifies the package was created correctly
- ✅ Shows updated duration options in correct order

### **Step 2: Verify Migration**
After running the migration, verify:

```sql
-- Check that 3months duration exists
SELECT 
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym' 
AND mpd.duration_type = '3months';

-- Check correct sorting order
SELECT 
    mpd.duration_type,
    mpd.duration_days,
    mpd.price
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym' 
AND mpd.is_active = true
ORDER BY mpd.duration_days;
```

**Expected Result:**
- `3months` duration with 90 days and €99.00 price
- Correct order: lesson → month → **3months** → semester → year

## 🖥️ **Frontend Deployment**

### **Step 1: Deploy Code Changes**
The following files have been updated and need to be deployed:

1. **Backend Logic:**
   - `src/utils/membershipApi.ts` - Added 3months support
   - `src/types/index.ts` - Added 3months to type definitions

2. **Frontend UI:**
   - `src/pages/Membership.tsx` - Updated sorting logic
   - `src/pages/PublicRegistration.tsx` - Updated sorting logic

### **Step 2: Build and Deploy**
```bash
# Build the application
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, etc.)
```

## 🧪 **Testing Checklist**

### **Automated Tests**
```bash
# Run the test suite
node test_3months_package.js
```

### **Manual Testing Checklist**

#### **1. Package Selection UI**
- [ ] Visit `/membership` page
- [ ] Select "Free Gym" package
- [ ] Verify 3-month option appears between 1-month and 6-month
- [ ] Verify price shows €99.00
- [ ] Verify duration shows "Τρίμηνο"

#### **2. Registration Flow**
- [ ] Visit `/register` page
- [ ] Complete registration form
- [ ] Select "Free Gym" package
- [ ] Verify 3-month option is available
- [ ] Complete registration with 3-month option

#### **3. Admin Panel**
- [ ] Login as admin
- [ ] Go to "Membership Packages" tab
- [ ] Verify 3-month option appears in Free Gym package
- [ ] Test creating a membership request with 3-month option

#### **4. Secretary Panel**
- [ ] Login as secretary
- [ ] Verify 3-month requests appear in the system
- [ ] Test approving a 3-month request

#### **5. QR Code System**
- [ ] Create a 3-month membership
- [ ] Generate QR code for Free Gym
- [ ] Verify QR code works for gym access

#### **6. Expiration Logic**
- [ ] Create a 3-month membership starting today
- [ ] Verify end date is exactly 90 days from start date
- [ ] Test edge cases (Jan 31 → Apr 30, Feb 28 → May 28)

## 🔄 **Rollback Plan**

If issues occur, use the rollback script:

```sql
-- File: database/ROLLBACK_FREE_GYM_3MONTHS_PACKAGE.sql
```

**What the rollback does:**
- ✅ Removes 3months duration from Free Gym package
- ✅ Checks for active memberships before deletion
- ✅ Provides warnings if active memberships exist
- ✅ Restores Free Gym to original state

## 📊 **Expected Results**

### **New Free Gym Duration Options:**
1. **1 εβδομάδα** (7 days) - €10.00
2. **1 μήνας** (30 days) - €50.00
3. **Τρίμηνο** (90 days) - €99.00 ← **NEW**
4. **6 μήνες** (180 days) - €150.00
5. **1 έτος** (365 days) - €240.00

### **System Integration:**
- ✅ QR codes work automatically
- ✅ Payment processing works automatically
- ✅ Notifications work automatically
- ✅ Admin/Secretary panels work automatically
- ✅ Expiration calculation works correctly

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Constraint Error:**
   ```
   ERROR: new row violates check constraint "membership_package_durations_duration_type_check"
   ```
   **Solution:** Run the migration script - it includes constraint fixes

2. **3months Not Appearing in UI:**
   **Solution:** Check that frontend code is deployed and browser cache is cleared

3. **Sorting Order Wrong:**
   **Solution:** Verify the sorting logic in Membership.tsx and PublicRegistration.tsx

4. **Price Not Showing:**
   **Solution:** Check that the database migration completed successfully

## 📞 **Support**

If you encounter any issues:
1. Check the test results: `node test_3months_package.js`
2. Verify database migration completed successfully
3. Check browser console for JavaScript errors
4. Review the rollback script if needed

## ✅ **Success Criteria**

The deployment is successful when:
- [ ] 3-month option appears in Free Gym package selection
- [ ] Price shows €99.00 and duration shows "Τρίμηνο"
- [ ] Option appears between 1-month and 6-month options
- [ ] Users can successfully purchase 3-month memberships
- [ ] QR codes work for 3-month memberships
- [ ] Expiration dates calculate correctly (90 days)
- [ ] Admin/Secretary panels show 3-month options
- [ ] All tests pass

---

**🎉 Once all criteria are met, the 3-month (99€) Free Gym package is successfully deployed!**
