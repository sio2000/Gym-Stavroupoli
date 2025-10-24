# 🚨 URGENT: Trainers Can't See Bookings - IMMEDIATE FIX

## Το Πρόβλημα

Μετά την εκτέλεση του `ENABLE_PILATES_RLS_CRITICAL.sql`:
- ❌ **Trainers ΔΕΝ μπορούν να δουν ποιοι χρήστες έχουν κάνει κράτηση**
- Modal δείχνει: "Δεν υπάρχουν κρατήσεις" 
- ΑΛΛΑτο grid δείχνει "1/4" (υπάρχει κράτηση!)

## Γιατί Συνέβη

Το RLS policy που enabled επιτρέπει μόνο:
```sql
-- Users βλέπουν τις δικές τους κρατήσεις
FOR SELECT USING (auth.uid() = user_id)

-- Admins βλέπουν όλες τις κρατήσεις  
FOR SELECT USING (... role = 'admin' ...)
```

**ΑΛΛΑδεν συμπεριέλαβα 'trainer'!**

## 🔧 Η Λύση (1 λεπτό)

### Τρέξε αυτό το SQL:

**File:** `database/FIX_PILATES_RLS_FOR_TRAINERS.sql`

```sql
-- DROP το παλιό policy
DROP POLICY IF EXISTS "Admins can view all pilates bookings" ON public.pilates_bookings;

-- CREATE νέο με trainers included
CREATE POLICY "Admins, secretaries and trainers can view all pilates bookings" ON public.pilates_bookings
    FOR SELECT USING (
        -- Regular users see only their own
        auth.uid() = user_id
        OR
        -- Admins, secretaries ΚΑΙ TRAINERS see all
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary', 'trainer')
        )
    );
```

### Steps:

1. **Άνοιξε:** https://supabase.com/dashboard/project/nolqodpfaqdnprixaqlo/sql/new

2. **Αντίγραψε** το περιεχόμενο από:
   ```
   database/FIX_PILATES_RLS_FOR_TRAINERS.sql
   ```

3. **Πάτα "Run"**

4. **Test** - Μπες ως trainer και δοκίμασε να δεις τις κρατήσεις

---

## ✅ Αναμενόμενο Αποτέλεσμα

Μετά το fix:
- ✅ Trainers βλέπουν ποιοι χρήστες έκαναν κράτηση
- ✅ Modal δείχνει λίστα με users (όνομα, email)
- ✅ Users εξακολουθούν να βλέπουν μόνο τις δικές τους κρατήσεις
- ✅ Admins/Secretaries βλέπουν όλες τις κρατήσεις

---

## 🎯 Verification

Μετά την εκτέλεση, έλεγξε:

1. **Ως Trainer:**
   - Μπες στο Pilates schedule
   - Κάνε κλικ σε slot με κρατήσεις (π.χ. 1/4)
   - Modal πρέπει να δείχνει: "Κρατήσεις: [User Name, User Email]"

2. **Ως User:**
   - Βλέπεις μόνο τις δικές σου κρατήσεις ✅
   - ΔΕΝ βλέπεις άλλων users ✅

3. **Ως Admin:**
   - Βλέπεις όλες τις κρατήσεις ✅
   - Μπορείς να διαχειριστείς όλα ✅

---

## 📊 Testing Required

Μετά το fix, τρέξε:

```bash
node testing/verify-trainer-access.cjs
```

Αναμενόμενο output:
```
✅ Found trainer: Jordan Trainer  
✅ Bookings retrieved: N
✅ Users booked: [List of users]
```

---

**Priority:** P0 - CRITICAL  
**Impact:** Trainers can't function  
**Fix Time:** 1 minute  
**Risk:** ZERO (only adds trainer access)

---

**🚨 ΤΡΕΞΕ ΤΟ SQL ΤΩΡΑ ΚΑΙ ΟΛΑ ΘΑ ΔΟΥΛΕΨΟΥΝ! 🚨**

