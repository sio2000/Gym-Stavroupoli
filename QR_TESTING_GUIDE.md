# QR Membership Integration - Testing Guide

## 🧪 **Testing the QR Membership Integration**

### **Step 1: Check Database Structure**

Run this SQL script first to understand your database structure:

```sql
-- Copy and paste the contents of database/SIMPLE_QR_TEST.sql
```

This will show you:
- What columns exist in the `memberships` table
- How many rows are in the table
- What package types are available
- Sample data structure

### **Step 2: Run the Main Test**

After understanding the structure, run the comprehensive test:

```sql
-- Copy and paste the contents of database/TEST_QR_MEMBERSHIP_INTEGRATION.sql
```

This will test both possible column structures (`status` vs `is_active`).

### **Step 3: Expected Results**

#### **If using `status` column:**
- You should see results in the "using status" queries
- The QR system will work with `status = 'active'`

#### **If using `is_active` column:**
- You should see results in the "using is_active" queries  
- The QR system will work with `is_active = true`

#### **If no data exists:**
- You'll see 0 rows in all queries
- The QR page will show "Δεν έχετε ενεργά πακέτα"

### **Step 4: Test the Frontend**

1. **Login to your application**
2. **Navigate to `/qr-codes` page**
3. **Check what you see:**

#### **Scenario A: No Active Memberships**
- Should show: "Δεν έχετε ενεργά πακέτα"
- Should show link to membership page
- Should NOT show any QR generation buttons

#### **Scenario B: Has Active Memberships**
- Should show QR generation buttons for each active package
- Each button should have correct icon and label:
  - 🏋️ Ελεύθερο Gym
  - 🧘 Pilates  
  - 🥊 Personal Training

#### **Scenario C: Mixed Status**
- Should only show buttons for active, non-expired memberships
- Should NOT show buttons for expired memberships

### **Step 5: Test QR Generation**

1. **Click on a QR generation button**
2. **Verify:**
   - QR code is generated successfully
   - Success message appears
   - QR code appears in "Ενεργά QR Codes" section
   - Available categories refresh automatically

### **Step 6: Test Edge Cases**

#### **Test Expired Membership:**
1. Create a membership with past `end_date`
2. Verify QR generation button disappears
3. Verify existing QR codes still work

#### **Test Multiple Memberships:**
1. Create multiple active memberships
2. Verify all show up as QR generation options
3. Verify each generates separate QR codes

#### **Test No Memberships:**
1. Ensure user has no active memberships
2. Verify "no active packages" message appears
3. Verify link to membership page works

### **Step 7: Debug Information**

If something doesn't work, check the browser console for:

```
[ActiveMemberships] Fetching active memberships for user: [user-id]
[ActiveMemberships] Status column not found, trying with is_active...
[ActiveMemberships] Found active memberships: [array]
```

### **Step 8: Common Issues & Solutions**

#### **Issue: "No active packages" when user has memberships**
**Solution:** Check if the membership has:
- Correct `status` or `is_active` value
- `end_date` in the future
- Valid `package_type` (free_gym, pilates, personal_training)

#### **Issue: Wrong package types showing**
**Solution:** Check the `package_type` values in `membership_packages` table

#### **Issue: QR generation fails**
**Solution:** Check if QR system is enabled in `feature_flags` table

#### **Issue: Database connection errors**
**Solution:** Verify Supabase connection and RLS policies

### **Step 9: Performance Testing**

1. **Test with many memberships** (10+)
2. **Test page load speed**
3. **Test refresh functionality**
4. **Test mobile responsiveness**

### **Step 10: Final Verification**

✅ **All QR generation options show only for active memberships**
✅ **Expired memberships don't show QR options**
✅ **No active memberships shows helpful message**
✅ **QR generation works for all package types**
✅ **Page loads quickly and responsively**
✅ **Error handling works gracefully**

---

## 🔧 **Technical Notes**

### **Database Compatibility**
The system automatically detects whether your database uses:
- `status` column (with values: 'active', 'expired', etc.)
- `is_active` column (with boolean values: true/false)

### **Package Type Mapping**
Make sure your `membership_packages` table has these `package_type` values:
- `free_gym` → 🏋️ Ελεύθερο Gym
- `pilates` → 🧘 Pilates
- `personal_training` → 🥊 Personal Training

### **Date Format**
The system expects `end_date` in `YYYY-MM-DD` format and compares with `CURRENT_DATE`.

---

## 🎉 **Success Criteria**

The implementation is working correctly when:

1. **Security**: Users only see QR options for their own active memberships
2. **Accuracy**: Only non-expired memberships show QR options  
3. **User Experience**: Clear messaging and intuitive interface
4. **Performance**: Fast loading and responsive design
5. **Reliability**: Graceful error handling and fallbacks

If all these criteria are met, the QR Membership Integration is **100% working**! 🚀
