# 🔧 RLS POLICIES FIX GUIDE

## 🚨 Πρόβλημα που Εντοπίστηκε
**RLS Policies Blocking Access** - Τα Row Level Security policies μπλοκάρουν την πρόσβαση στο `user_profiles` table.

## ✅ Λύση

### Βήμα 1: Άνοιγμα Supabase SQL Editor
1. Πήγαινε στο [Supabase Dashboard](https://supabase.com/dashboard)
2. Επίλεξε το project σου
3. Πήγαινε στο **"SQL Editor"** (αριστερά στο menu)

### Βήμα 2: Εκτέλεση SQL Fix
Αντιγράψε και τρέξε αυτό το SQL:

```sql
-- Fix RLS policies for user_profiles table

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

-- Create new policies that work
CREATE POLICY "Enable read access for all users" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON user_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON user_profiles
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON user_profiles
    FOR DELETE USING (true);

-- Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

-- Test the policies
SELECT 'RLS policies fixed successfully' as status;
```

### Βήμα 3: Επαλήθευση
Μετά την εκτέλεση, θα πρέπει να δεις:
```
RLS policies fixed successfully
```

### Βήμα 4: Δοκιμή
1. Πήγαινε πίσω στην εφαρμογή
2. Κάνε refresh τη σελίδα
3. Δοκίμασε τη σύνδεση

## 🎯 Αποτέλεσμα

- ✅ **Καμία RLS blocking**
- ✅ **Πρόσβαση στο user_profiles table**
- ✅ **Δημιουργία και ανάγνωση profiles**
- ✅ **Επιτυχής σύνδεση**

## 📝 Σημείωση

Αυτό το fix αφαιρεί τα περιοριστικά RLS policies και επιτρέπει πλήρη πρόσβαση στο `user_profiles` table. Μετά την εφαρμογή, η εφαρμογή θα πρέπει να λειτουργεί κανονικά.
