# 🏋️ FREE GYM REQUEST CREATION GUIDE

## 🎯 **Στόχος**
Χειροκίνητη εισαγωγή αιτήματος Free Gym πακέτου για τον χρήστη **THEODOROS MICHALAKIS**.

## 👤 **User Details**
- **Email**: zige_5@hotmail.com
- **Name**: THEODOROS MICHALAKIS  
- **Phone**: 6930952930
- **User ID**: 43fa81be-1846-4b64-b136-adca986576ba ✅

## 📦 **Package Details**
- **Package**: Free Gym
- **Duration**: 1 έτος (365 ημέρες)
- **Price**: 240,00 €
- **Type**: Gym membership

## 🛠️ **SQL Scripts Διαθέσιμα**

### **Script 1: Comprehensive** 📋
- **File**: `create_free_gym_request_theodoros.sql`
- **Features**: 
  - Automatic user verification
  - Package detection
  - Error handling
  - Comprehensive verification
- **Recommended**: Για πλήρη automation

### **Script 2: Simple** ⚡
- **File**: `simple_free_gym_request.sql`  
- **Features**:
  - Direct insertion με known user_id
  - Step-by-step verification
  - Manual control
- **Recommended**: Για γρήγορη εισαγωγή

## 🚀 **Εκτέλεση**

### **Option 1: Automatic (Recommended)**
```sql
-- Execute: create_free_gym_request_theodoros.sql
-- Θα βρει αυτόματα user και package και θα δημιουργήσει το request
```

### **Option 2: Manual**
```sql
-- Execute: simple_free_gym_request.sql
-- Χρησιμοποιεί το γνωστό user_id: 43fa81be-1846-4b64-b136-adca986576ba
```

### **Option 3: Direct Query**
```sql
-- Άμεση εισαγωγή
INSERT INTO membership_requests (
    id,
    user_id,
    package_id,
    duration_type,
    requested_price,
    status
) VALUES (
    gen_random_uuid(),
    '43fa81be-1846-4b64-b136-adca986576ba',
    (SELECT id FROM membership_packages WHERE name ILIKE '%Free Gym%' LIMIT 1),
    'year',
    240.00,
    'pending'
);
```

## ✅ **Expected Results**

Μετά την εκτέλεση θα δεις:
- ✅ **New membership_request** στη βάση
- ✅ **Status**: pending
- ✅ **Package**: Free Gym  
- ✅ **Duration**: year (365 days)
- ✅ **Price**: 240.00 €
- ✅ **User**: THEODOROS MICHALAKIS

## 📊 **Verification Queries**

### **Check if request was created**:
```sql
SELECT 
    mr.id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.created_at
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
ORDER BY mr.created_at DESC;
```

### **Check user's current memberships**:
```sql
SELECT 
    mp.name,
    m.status,
    m.start_date,
    m.end_date
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = '43fa81be-1846-4b64-b136-adca986576ba';
```

## 🎉 **Next Steps**

Μετά τη δημιουργία του request:
1. **Admin Panel**: Θα εμφανιστεί στα pending requests
2. **Approval**: Ο admin μπορεί να το εγκρίνει
3. **Activation**: Θα δημιουργηθεί ενεργή συνδρομή
4. **User Access**: Ο χρήστης θα έχει πρόσβαση στο gym

**Ready to execute!** 🚀
