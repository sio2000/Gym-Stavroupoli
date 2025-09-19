# 🔍 USER SEARCH GUIDE - ΜΙΧΑΛΑΚΗΣ ΘΕΩΔΩΡΗΣ

## 🎯 **Αναζήτηση Χρήστη**

Δημιούργησα δύο SQL scripts για να βρεις όλα τα στοιχεία του χρήστη **ΜΙΧΑΛΑΚΗΣ ΘΕΩΔΩΡΗΣ**:

### **1. Comprehensive Search**
- **File**: `find_user_michalakis_theodoros.sql`
- **Purpose**: Εκτενής αναζήτηση σε όλους τους πίνακες
- **Includes**: 
  - User profiles
  - Memberships  
  - Personal training schedules
  - Group assignments
  - Lesson deposits (Paspartu)
  - Lesson bookings
  - Cash transactions
  - Kettlebell points

### **2. Simple Search**
- **File**: `search_user_simple.sql`  
- **Purpose**: Γρήγορη αναζήτηση βασικών στοιχείων
- **Includes**: User profile, memberships, personal training

## 🔍 **Search Patterns που Χρησιμοποιούνται**

### **Name Variations**:
- ΘΕΩΔΩΡ* / THEODOR*
- ΜΙΧΑΛΑΚ* / MICHALAK*
- Combinations of first/last name
- Case-insensitive search (ILIKE)

### **Email Patterns**:
- %michalak%
- %theodor%
- %μιχαλακ%
- %θεωδωρ%

## 📊 **Data που θα Βρεις**

### **Basic Information**:
- User ID
- First Name / Last Name
- Email & Phone
- Role (user/admin/trainer)
- Account status (active/inactive)
- Registration date

### **Memberships**:
- Active/expired subscriptions
- Package types (Personal Training, Group, etc.)
- Start/end dates
- Remaining days
- Membership status

### **Personal Training**:
- Training schedules
- Training type (individual/group)
- User type (personal/paspartu)
- Group room size & frequency
- Schedule status (pending/accepted/declined)

### **Group Activities**:
- Group assignments
- Session dates/times
- Trainers & rooms
- Group capacity
- Assignment status

### **Paspartu Data** (if applicable):
- Lesson deposits
- Total/used/remaining lessons
- Expiration dates
- Lesson bookings
- Booking history

### **Financial Data**:
- Cash transactions
- Kettlebell points
- Payment history

## 🚀 **Πώς να Εκτελέσεις**

### **Option 1: Comprehensive Search**
```sql
-- Execute in Supabase SQL Editor
-- Copy and paste: find_user_michalakis_theodoros.sql
```

### **Option 2: Quick Search**
```sql
-- Execute in Supabase SQL Editor  
-- Copy and paste: search_user_simple.sql
```

### **Option 3: Manual Search**
```sql
-- Direct query in Supabase
SELECT * FROM user_profiles 
WHERE first_name ILIKE '%THEODOR%' 
   OR last_name ILIKE '%MICHALAK%';
```

## 📋 **Expected Results**

Αν ο χρήστης υπάρχει, θα δεις:
- ✅ **User Profile**: Βασικά στοιχεία χρήστη
- ✅ **Memberships**: Ενεργές/ληγμένες συνδρομές
- ✅ **Training Data**: Personal/Group προγράμματα
- ✅ **Activity History**: Κρατήσεις, συναλλαγές, κλπ

Αν δεν υπάρχει:
- ❌ **No Results**: Κενά αποτελέσματα σε όλους τους πίνακες

## 🔧 **Troubleshooting**

### **Αν δεν βρεις αποτελέσματα**:
1. **Check spelling**: Μήπως το όνομα γράφεται διαφορετικά;
2. **Try variations**: THEODOROS vs ΘΕΩΔΩΡΟΣ
3. **Search by email**: Αν ξέρεις το email
4. **Search by partial name**: Μόνο "MICHALAK" ή "THEODOR"

### **Alternative Searches**:
```sql
-- By email domain
SELECT * FROM user_profiles WHERE email LIKE '%@gmail.com%';

-- By partial name
SELECT * FROM user_profiles WHERE first_name ILIKE '%THEO%';

-- Recent users
SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 50;
```

## 🎯 **Επόμενα Βήματα**

1. **Execute** one of the SQL scripts
2. **Review** the results
3. **Identify** the correct user_id
4. **Use** the user_id for further operations

**Καλή αναζήτηση!** 🔍✨
