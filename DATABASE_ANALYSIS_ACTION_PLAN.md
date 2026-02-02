# 🔍 COMPLETE DATABASE SCHEMA ANALYSIS & ACTION PLAN

## Πώς να ξεκινήσετε:

### ΒΗΜΑ 1: Ανάλυση Βάσης Δεδομένων (SQL Script)
```bash
# Αντιγράψτε ΟΛΟΚΛΗΡΟ το περιεχόμενο του αρχείου:
database/00_COMPLETE_SCHEMA_ANALYSIS.sql

# Πάστε στο Supabase SQL Editor και τρέξτε όλα τα blocks
# Θα δείτε ΑΝΑΛΥΤΙΚΑ:
# - Όλους τους πίνακες και τα μεγέθη τους
# - Την δομή της memberships table
# - NULL values σε κάθε στήλη
# - Data quality issues
# - Foreign key integrity
# - RLS policies (αν υπάρχουν)
# - Triggers & Functions
# - Orphaned records
# - Critical issues
```

### ΒΗΜΑ 2: TypeScript Analysis
```bash
npm run db:analyze
# Αυτό θα δώσει εναλλακτική ανάλυση από TypeScript/Node
# Report: DATABASE_SCHEMA_ANALYSIS_REPORT.json
```

---

## 🚨 ΓΝΩΣΤΑ ΠΡΟΒΛΗΜΑΤΑ

### 1. RLS POLICIES BLOCKING INSERTS ⚠️ CRITICAL
**Σίμπτωμα**: 
```
Error: new row violates row-level security policy for table "memberships"
```

**Αιτία**: Οι RLS policies δεν επιτρέπουν admin να δημιουργεί memberships για χρήστες

**Λύση**: Χρειάζεται SECURITY DEFINER function ή fixed RLS policy

---

### 2. DUPLICATE STATUS COLUMNS 🔴 HIGH
**Πρόβλημα**: 
- Υπάρχει `is_active` (BOOLEAN)
- Υπάρχει `status` (TEXT: 'active', 'expired', κ.λπ.)
- Αυτά είναι ΜΕΣΑ στη memberships

**Αποτέλεσμα**: 
```
is_active = true  BUT  status = 'expired'  ← CONTRADICTION!
```

**Λύση**: 
- Κρατήστε ΜΟΝΟ `is_active` (BOOLEAN)
- Αφαιρέστε τη στήλη `status`
- Ενημερώστε όλα τα queries

---

### 3. EXPIRED MEMBERSHIPS NOT AUTO-DEACTIVATING 🔴 CRITICAL
**Πρόβλημα**:
```
end_date: 2026-01-31
is_active: TRUE
today: 2026-02-05
← ΛΑΘΟΣ! Θα έπρεπε να είναι FALSE
```

**Αιτία**: Δεν υπάρχει BEFORE INSERT/UPDATE trigger που να θέτει:
```sql
IF NEW.end_date < CURRENT_DATE THEN
  NEW.is_active = FALSE;
END IF;
```

**Λύση**: Δημιουργία trigger ή RPC function

---

### 4. ORPHANED PILATES DEPOSITS 🟠 HIGH
**Πρόβλημα**:
- Μια membership λήγει → `is_active = FALSE`
- Τα pilates_deposits για τον ίδιο user παραμένουν `is_active = TRUE`

**Αποτέλεσμα**: User μπορεί να κάνει booking αλλά χωρίς ενεργή memberships!

**Λύση**: CASCADE trigger:
```sql
WHEN membership.is_active = FALSE
THEN pilates_deposits.is_active = FALSE
```

---

### 5. NULL COLUMNS IN MEMBERSHIPS 🟠 MEDIUM
**Πρόβλημα**: Αυτές οι στήλες είναι ΠΑΝΤΑ NULL:
- `approved_by` - γιατί;
- `expires_at` - redundant με `end_date`?
- `source_request_id` - χρησιμοποιείται;
- `deleted_at` - soft delete;
- `renewal_package_id` - auto-renewal;

**Λύση**: 
- Αν δεν χρησιμοποιούνται → ΑΦΑΙΡΕΣΤΕ
- Αν χρησιμοποιούνται → ΣΥΜΠΛΗΡΩΣΤΕ ΤΑ ΔΕΔΟΜΕΝΑ

---

## 📋 TABLES INVENTORY

### ✅ ACTIVE (με δεδομένα)
| Table | Rows | Purpose |
|-------|------|---------|
| `memberships` | 79 | Ενεργές συνδρομές χρηστών |
| `membership_packages` | 8 | Διαθέσιμα πακέτα (Ultimate, Free Gym, Pilates) |
| `membership_requests` | 26 | Αιτήματα συνδρομών (pending) |
| `pilates_deposits` | 36 | Μαθήματα Pilates (lessons) |
| `pilates_bookings` | 11 | Κρατήσεις μαθημάτων |
| `user_profiles` | 40 | Προφίλ χρηστών |

### ⚠️ EMPTY (δεν χρησιμοποιούνται)
| Table | Rows | Status |
|-------|------|--------|
| `ultimate_weekly_refills` | 0 | EMPTY - Πρέπει ή όχι; |
| `ultimate_dual_membership` | 0 | EMPTY - Πρέπει ή όχι; |
| `membership_logs` | 0 | EMPTY - Audit logs; |
| `membership_expiration` | 0 | EMPTY - Expired tracking; |

### 📊 VIEW (derived)
| Table | Rows | Purpose |
|-------|------|---------|
| `membership_overview` | 79 | VIEW για user-friendly display |

---

## 🔧 ACTION PLAN

### IMMEDIATELY (κρίσιμο για να δουλέψει το σύστημα):

#### 1. FIX RLS POLICIES
```sql
-- For memberships table:
DROP POLICY IF EXISTS "memberships_insert_policy" ON memberships;
CREATE POLICY memberships_insert_policy ON memberships
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id  -- User can create own
    OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'secretary')  -- Admin can create for anyone
    )
  );
```

#### 2. CREATE AUTO-DEACTIVATION TRIGGER
```sql
CREATE OR REPLACE FUNCTION deactivate_expired_memberships()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.is_active := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memberships_auto_deactivate
BEFORE INSERT OR UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION deactivate_expired_memberships();
```

#### 3. CREATE CASCADE TRIGGER
```sql
CREATE OR REPLACE FUNCTION cascade_deactivate_deposits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = FALSE THEN
    UPDATE pilates_deposits 
    SET is_active = FALSE 
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memberships_cascade_deposits
AFTER UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION cascade_deactivate_deposits();
```

#### 4. REMOVE DUPLICATE STATUS COLUMN
```sql
-- First: Update all records
UPDATE memberships 
SET status = CASE WHEN is_active THEN 'active' ELSE 'expired' END
WHERE status IS NULL;

-- Then: Remove duplicate
ALTER TABLE memberships DROP COLUMN status;

-- Update all code to use ONLY is_active
```

### HIGH PRIORITY (επόμενο sprint):

5. Consolidate NULL columns
6. Add audit logging
7. Test cascade behaviors
8. Performance optimization

---

## 🧪 TESTING COMMANDS

```bash
# Analyze database
npm run db:analyze

# Run diagnostics
npm run test:diagnostics

# Run real-user tests
npm run test:real-users

# View detailed report
cat DATABASE_SCHEMA_ANALYSIS_REPORT.json | jq '.analysis.issues'
```

---

## 📌 NEXT STEPS

1. **TODAY**: Run `database/00_COMPLETE_SCHEMA_ANALYSIS.sql` in Supabase
2. **TODAY**: Review the output - identify which NULL columns to keep
3. **TOMORROW**: Apply RLS policy fixes
4. **TOMORROW**: Apply triggers for auto-deactivation & cascade
5. **TOMORROW**: Remove duplicate status column
6. **TOMORROW**: Run full test suite
7. **TOMORROW**: Validate with real users

---

**Status**: 🔴 CRITICAL - Multiple RLS & data consistency issues blocking production
**Recommendation**: Fix RLS + triggers TODAY before deploying
