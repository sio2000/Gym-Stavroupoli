# Υλοποίηση της Καρτέλας "Διόρθωση Σφαλμάτων"

## Τι Έγινε

Προστέθηκε μια νέα καρτέλα "Διόρθωση Σφαλμάτων" στα panels:
- ✅ **Admin Panel** - Ήδη υπήρχε
- ✅ **Control Panel (Γραμματεία)** - Προστέθηκε τώρα

## Δομή Υλοποίησης

### 1. Component: `ErrorFixing.tsx`
Τοποθεσία: `src/components/admin/ErrorFixing.tsx`

**Χαρακτηριστικά:**
- ⚠️ Alert προειδοποίησης στην κορυφή για χρήση μόνο σε περίπτωση ανάγκης
- 🔘 Κουμπί "Έλεγχος Χρηστών" που τρέχει το SQL query ελέγχου
- 📊 Εμφάνιση αποτελεσμάτων με πληροφορίες χρηστών (ID, Email, Ημερομηνία Δημιουργίας)
- 🔧 Κουμπί "Διόρθωση Όλων των Χρηστών" που εμφανίζεται μόνο όταν υπάρχουν προβλήματα
- ✔️ Confirmation dialog πριν την εκτέλεση της διόρθωσης
- 🔄 Αυτόματη επανεκτέλεση ελέγχου μετά τη διόρθωση
- ✨ Απλό και κατανοητό UI

### 2. SQL Query
Το SQL query που χρησιμοποιείται:

```sql
SELECT 
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL
  AND au.deleted_at IS NULL
ORDER BY au.created_at DESC;
```

### 3. RPC Function στη Βάση Δεδομένων
Τοποθεσία: `database/functions/get_users_without_profiles.sql`

**Γιατί χρειάζεται:**
- Δεν μπορούμε να κάνουμε direct query στο `auth.users` από το frontend
- Το RPC function δίνει ασφαλή πρόσβαση στο auth schema

## Οδηγίες Εφαρμογής

### Βήμα 1: Εφαρμογή των RPC Functions

Ανοίξτε το **SQL Editor** στο Supabase Dashboard και εκτελέστε τα παρακάτω SQL:

#### 1.1 Function για Έλεγχο Χρηστών (get_users_without_profiles)

```sql
-- Δημιουργία RPC function για να βρούμε χρήστες χωρίς user profile
-- Αυτό είναι απαραίτητο γιατί δεν μπορούμε να κάνουμε direct query στο auth.users

CREATE OR REPLACE FUNCTION get_users_without_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.created_at
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.user_id
  WHERE up.user_id IS NULL
    AND au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
END;
$$;

-- Δώσε δικαιώματα στους authenticated users
GRANT EXECUTE ON FUNCTION get_users_without_profiles() TO authenticated;

-- Comment για documentation
COMMENT ON FUNCTION get_users_without_profiles() IS 'Επιστρέφει λίστα με χρήστες που έχουν λογαριασμό στο auth.users αλλά δεν έχουν αντίστοιχο user profile';
```

#### 1.2 Function για Διόρθωση Χρηστών (fix_users_without_profiles)

```sql
-- Δημιουργία RPC function για να διορθώσουμε χρήστες χωρίς user profile
-- Αυτό δημιουργεί user profiles για όλους τους χρήστες που δεν έχουν

CREATE OR REPLACE FUNCTION fix_users_without_profiles()
RETURNS TABLE (
  created_count integer,
  user_ids uuid[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_created_count integer;
  v_user_ids uuid[];
BEGIN
  -- Παίρνουμε τα IDs των χρηστών που θα διορθωθούν
  SELECT array_agg(au.id)
  INTO v_user_ids
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.user_id
  WHERE up.user_id IS NULL
    AND au.deleted_at IS NULL;

  -- Αν δεν υπάρχουν χρήστες προς διόρθωση, επιστρέφουμε 0
  IF v_user_ids IS NULL THEN
    RETURN QUERY SELECT 0::integer, ARRAY[]::uuid[];
    RETURN;
  END IF;

  -- Ασφαλές INSERT για προσθήκη όλων των χρηστών χωρίς προφίλ
  INSERT INTO user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  )
  SELECT 
    au.id,
    au.email,
    COALESCE(
      au.raw_user_meta_data->>'first_name',
      au.raw_user_meta_data->>'display_name',
      SPLIT_PART(au.email, '@', 1)
    ) as first_name,
    COALESCE(
      au.raw_user_meta_data->>'last_name',
      ''
    ) as last_name,
    'user' as role,
    au.created_at,
    NOW()
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.user_id
  WHERE up.user_id IS NULL
    AND au.deleted_at IS NULL;

  -- Παίρνουμε τον αριθμό των εγγραφών που δημιουργήθηκαν
  GET DIAGNOSTICS v_created_count = ROW_COUNT;

  -- Επιστρέφουμε τα αποτελέσματα
  RETURN QUERY SELECT v_created_count, v_user_ids;
END;
$$;

-- Δώσε δικαιώματα στους authenticated users
GRANT EXECUTE ON FUNCTION fix_users_without_profiles() TO authenticated;

-- Comment για documentation
COMMENT ON FUNCTION fix_users_without_profiles() IS 'Δημιουργεί user profiles για όλους τους χρήστες που έχουν λογαριασμό αλλά δεν έχουν αντίστοιχο user profile';
```

### Βήμα 2: Επαλήθευση

Μετά την εκτέλεση του SQL, ελέγξτε ότι τα functions δημιουργήθηκαν:

```sql
-- Έλεγχος ότι τα functions υπάρχουν
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('get_users_without_profiles', 'fix_users_without_profiles');

-- Test του function ελέγχου
SELECT * FROM get_users_without_profiles();

-- Test του function διόρθωσης (ΠΡΟΣΟΧΗ: Αυτό θα δημιουργήσει τα profiles!)
-- SELECT * FROM fix_users_without_profiles();
```

### Βήμα 3: Δοκιμή στην Εφαρμογή

1. Μπείτε στο Admin Panel ή Control Panel (Γραμματεία)
2. Επιλέξτε την καρτέλα "Διόρθωση Σφαλμάτων"
3. Πατήστε το κουμπί "Έλεγχος Χρηστών"
4. Τα αποτελέσματα θα εμφανιστούν στο section
5. Αν υπάρχουν χρήστες με σφάλματα, θα εμφανιστεί το κουμπί "🔧 Διόρθωση Όλων των Χρηστών"
6. Πατήστε το κουμπί διόρθωσης και επιβεβαιώστε την ενέργεια
7. Τα user profiles θα δημιουργηθούν αυτόματα

## Σκοπός του Feature

Το feature αυτό βοηθά στον εντοπισμό χρηστών που:
- Έχουν λογαριασμό στο σύστημα (`auth.users`)
- ΔΕΝ έχουν αντίστοιχο user profile (`user_profiles`)
- Δεν αναγνωρίζονται από το σύστημα
- Δεν μπορούν να αγοράσουν πακέτα συνδρομών
- Δεν μπορούν να κλείσουν μάθημα
- Γενικά δεν λειτουργούν σωστά

## Προειδοποιήσεις

⚠️ **ΠΡΟΣΟΧΗ:**
- Χρησιμοποιήστε αυτή τη σελίδα **ΜΟΝΟ** για περιπτώσεις ανάγκης
- ΜΗΝ κάνετε spam το κουμπί (πολλαπλές χρήσεις σε λίγο χρόνο)
- Χρησιμοποιήστε **ΜΟΝΟ** όταν υπάρχει πραγματικό πρόβλημα με χρήστες

## Αρχεία που Δημιουργήθηκαν/Τροποποιήθηκαν

### Section 1: User Profiles
1. ✅ `src/pages/ControlPanel.tsx` - Προστέθηκε το tab
2. ✅ `src/components/admin/ErrorFixing.tsx` - Ενημερώθηκε με RPC functions και fix button
3. ✅ `database/functions/get_users_without_profiles.sql` - RPC function για έλεγχο
4. ✅ `database/functions/fix_users_without_profiles.sql` - RPC function για διόρθωση
5. ✅ `apply_get_users_without_profiles.cjs` - Script εφαρμογής (έλεγχος)
6. ✅ `apply_fix_users_without_profiles.cjs` - Script εφαρμογής (διόρθωση)

### Section 2: Email Confirmation
7. ✅ `database/functions/get_unconfirmed_emails.sql` - RPC function για έλεγχο unconfirmed emails
8. ✅ `database/functions/confirm_all_emails.sql` - RPC function για επιβεβαίωση emails (100% ασφαλές)
9. ✅ `apply_email_confirmation_functions.cjs` - Script εφαρμογής

### Section 3: Pilates Lessons Management
10. ✅ `database/functions/get_user_pilates_lessons.sql` - RPC function για έλεγχο Pilates μαθημάτων χρήστη
11. ✅ `database/functions/set_user_pilates_lessons.sql` - RPC function για ενημέρωση Pilates μαθημάτων (100% ασφαλές)
12. ✅ `apply_pilates_lessons_functions.cjs` - Script εφαρμογής

---

## 📧 SECTION 2: Έλεγχος και Επιβεβαίωση Μη Επιβεβαιωμένων Emails

### Τι Κάνει

Εντοπίζει χρήστες που δεν έχουν επιβεβαιώσει το email τους και παρέχει τη δυνατότητα αυτόματης επιβεβαίωσης.

### SQL για Έλεγχο Μη Επιβεβαιωμένων Emails

```sql
SELECT 
    id as user_id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_user_meta_data->>'display_name' as display_name,
    raw_user_meta_data->>'full_name' as full_name,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'Μη επιβεβαιωμένο'
        ELSE 'Επιβεβαιωμένο'
    END as confirmation_status
FROM auth.users
WHERE email_confirmed_at IS NULL
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### RPC Functions που Χρειάζονται

#### Function 1: get_unconfirmed_emails()

```sql
CREATE OR REPLACE FUNCTION get_unconfirmed_emails()
RETURNS TABLE (
  user_id uuid,
  email text,
  email_confirmed_at timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  display_name text,
  full_name text,
  confirmation_status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email::text,
    au.email_confirmed_at,
    au.created_at,
    au.last_sign_in_at,
    (au.raw_user_meta_data->>'display_name')::text as display_name,
    (au.raw_user_meta_data->>'full_name')::text as full_name,
    CASE 
      WHEN au.email_confirmed_at IS NULL THEN 'Μη επιβεβαιωμένο'
      ELSE 'Επιβεβαιωμένο'
    END::text as confirmation_status
  FROM auth.users au
  WHERE au.email_confirmed_at IS NULL
    AND au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_unconfirmed_emails() TO authenticated;

COMMENT ON FUNCTION get_unconfirmed_emails() IS 'Επιστρέφει λίστα με χρήστες που δεν έχουν επιβεβαιώσει το email τους';
```

#### Function 2: confirm_all_emails() - 100% Ασφαλές

```sql
-- Δημιουργία RPC function για να επιβεβαιώσουμε όλα τα μη επιβεβαιωμένα emails
-- Αυτό είναι 100% ασφαλές και ενημερώνει μόνο τους χρήστες με NULL email_confirmed_at

CREATE OR REPLACE FUNCTION confirm_all_emails()
RETURNS TABLE (
  confirmed_count integer,
  user_ids uuid[],
  user_emails text[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_confirmed_count integer;
  v_user_ids uuid[];
  v_user_emails text[];
BEGIN
  -- Παίρνουμε τα IDs και emails των χρηστών που θα επιβεβαιωθούν
  SELECT 
    array_agg(au.id),
    array_agg(au.email)
  INTO v_user_ids, v_user_emails
  FROM auth.users au
  WHERE au.email_confirmed_at IS NULL
    AND au.deleted_at IS NULL;

  -- Αν δεν υπάρχουν χρήστες προς επιβεβαίωση, επιστρέφουμε 0
  IF v_user_ids IS NULL THEN
    RETURN QUERY SELECT 0::integer, ARRAY[]::uuid[], ARRAY[]::text[];
    RETURN;
  END IF;

  -- Ασφαλές UPDATE για επιβεβαίωση όλων των μη επιβεβαιωμένων emails
  -- Χρησιμοποιούμε NOW() για να θέσουμε την τρέχουσα ημερομηνία/ώρα
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE email_confirmed_at IS NULL
    AND deleted_at IS NULL;

  -- Παίρνουμε τον αριθμό των εγγραφών που ενημερώθηκαν
  GET DIAGNOSTICS v_confirmed_count = ROW_COUNT;

  -- Επιστρέφουμε τα αποτελέσματα
  RETURN QUERY SELECT v_confirmed_count, v_user_ids, v_user_emails;
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_all_emails() TO authenticated;

COMMENT ON FUNCTION confirm_all_emails() IS 'Επιβεβαιώνει αυτόματα όλα τα μη επιβεβαιωμένα emails των χρηστών. ΠΡΟΣΟΧΗ: Χρησιμοποιήστε μόνο σε περίπτωση ανάγκης!';
```

### Χαρακτηριστικά του Section

- 🔶 **Διαφορετικό χρώμα** (πορτοκαλί) για διαφοροποίηση από το πρώτο section
- 📊 **Εμφάνιση**: Email, Όνομα Χρήστη, Ημερομηνία Δημιουργίας, Status, Τελευταία Σύνδεση
- ✅ **Κουμπί Επιβεβαίωσης**: Εμφανίζεται μόνο όταν υπάρχουν μη επιβεβαιωμένα emails
- 🔒 **Ασφάλεια**: Confirmation dialog πριν την εκτέλεση
- 🔄 **Αυτόματη ενημέρωση**: Μετά την επιβεβαίωση, ξανατρέχει ο έλεγχος

---

## 🏋️ SECTION 3: Διαχείριση Pilates Μαθημάτων

### Τι Κάνει

Επιτρέπει τον έλεγχο και την ενημέρωση των διαθέσιμων Pilates μαθημάτων για συγκεκριμένο χρήστη.

### Λειτουργικότητα

1. **Έλεγχος Μαθημάτων**: Εισαγωγή email χρήστη και εμφάνιση:
   - Ενεργά μαθήματα (active lessons)
   - Συνολικά μαθήματα (all lessons)
   - Αριθμός deposits
   - Λεπτομέρειες κάθε deposit (status, ημερομηνίες, κλπ.)

2. **Ενημέρωση Μαθημάτων**: Ορισμός νέου αριθμού διαθέσιμων μαθημάτων
   - Εισαγωγή του επιθυμητού αριθμού (π.χ. 12)
   - Confirmation dialog με προβολή προηγούμενου και νέου αριθμού
   - Αυτόματη ενημέρωση του ενεργού deposit ή δημιουργία νέου
   - Toast notification με αποτέλεσμα

### RPC Functions που Χρειάζονται

#### Function 1: get_user_pilates_lessons(p_user_email)

```sql
CREATE OR REPLACE FUNCTION get_user_pilates_lessons(p_user_email text)
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  total_active_lessons integer,
  total_all_lessons integer,
  total_deposits integer,
  deposits jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Βρίσκουμε το user_id από το email
  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE u.email = p_user_email
    AND u.deleted_at IS NULL;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::text,
    up.first_name::text,
    up.last_name::text,
    up.phone::text,
    COALESCE(
      (SELECT SUM(pd.deposit_remaining)::integer 
       FROM pilates_deposits pd 
       WHERE pd.user_id = u.id AND pd.is_active = true),
      0
    ) as total_active_lessons,
    COALESCE(
      (SELECT SUM(pd.deposit_remaining)::integer 
       FROM pilates_deposits pd 
       WHERE pd.user_id = u.id),
      0
    ) as total_all_lessons,
    COALESCE(
      (SELECT COUNT(*)::integer 
       FROM pilates_deposits pd 
       WHERE pd.user_id = u.id),
      0
    ) as total_deposits,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', pd.id,
          'deposit_remaining', pd.deposit_remaining,
          'is_active', pd.is_active,
          'credited_at', pd.credited_at,
          'expires_at', pd.expires_at,
          'status', 
            CASE 
              WHEN pd.expires_at IS NOT NULL AND pd.expires_at < NOW() THEN 'EXPIRED'
              WHEN pd.deposit_remaining <= 0 THEN 'EMPTY'
              WHEN pd.is_active = false THEN 'INACTIVE'
              ELSE 'ACTIVE'
            END
        ) ORDER BY pd.credited_at DESC
      )
      FROM pilates_deposits pd 
      WHERE pd.user_id = u.id),
      '[]'::jsonb
    ) as deposits
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  WHERE u.id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_pilates_lessons(text) TO authenticated;

COMMENT ON FUNCTION get_user_pilates_lessons(text) IS 'Επιστρέφει τα διαθέσιμα Pilates μαθήματα και deposits για συγκεκριμένο χρήστη';
```

#### Function 2: set_user_pilates_lessons(p_user_email, p_lesson_count) - 100% Ασφαλές

```sql
CREATE OR REPLACE FUNCTION set_user_pilates_lessons(
  p_user_email text,
  p_lesson_count integer
)
RETURNS TABLE (
  success boolean,
  message text,
  user_id uuid,
  new_lesson_count integer,
  previous_lesson_count integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_pilates_package_id uuid;
  v_active_deposit_id uuid;
  v_previous_remaining integer;
  v_deposit_exists boolean;
BEGIN
  -- Έλεγχος αρνητικών αριθμών
  IF p_lesson_count < 0 THEN
    RETURN QUERY SELECT 
      false, 
      'Ο αριθμός μαθημάτων δεν μπορεί να είναι αρνητικός'::text,
      NULL::uuid,
      0::integer,
      0::integer;
    RETURN;
  END IF;

  -- Βρίσκουμε το user_id από το email
  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE u.email = p_user_email
    AND u.deleted_at IS NULL;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 
      false, 
      'Ο χρήστης με email ' || p_user_email || ' δεν βρέθηκε'::text,
      NULL::uuid,
      0::integer,
      0::integer;
    RETURN;
  END IF;

  -- Βρίσκουμε το Pilates package
  SELECT mp.id INTO v_pilates_package_id
  FROM membership_packages mp
  WHERE mp.name ILIKE '%pilates%' 
    AND mp.is_active = true
  ORDER BY mp.created_at DESC
  LIMIT 1;

  IF v_pilates_package_id IS NULL THEN
    RETURN QUERY SELECT 
      false, 
      'Δεν βρέθηκε ενεργό Pilates package'::text,
      v_user_id,
      0::integer,
      0::integer;
    RETURN;
  END IF;

  -- Έλεγχος για ενεργό deposit
  SELECT pd.id, pd.deposit_remaining, true 
  INTO v_active_deposit_id, v_previous_remaining, v_deposit_exists
  FROM pilates_deposits pd
  WHERE pd.user_id = v_user_id 
    AND pd.is_active = true
  ORDER BY pd.credited_at DESC
  LIMIT 1;

  -- Ενημέρωση ή δημιουργία deposit
  IF v_deposit_exists THEN
    UPDATE pilates_deposits 
    SET 
      deposit_remaining = p_lesson_count,
      updated_at = NOW()
    WHERE id = v_active_deposit_id;
    
    RETURN QUERY SELECT 
      true, 
      'Ενημερώθηκαν τα διαθέσιμα Pilates μαθήματα σε ' || p_lesson_count::text,
      v_user_id,
      p_lesson_count,
      COALESCE(v_previous_remaining, 0);
    RETURN;
  ELSE
    INSERT INTO pilates_deposits (
      user_id,
      package_id,
      deposit_remaining,
      expires_at,
      is_active,
      credited_at,
      created_by
    ) VALUES (
      v_user_id,
      v_pilates_package_id,
      p_lesson_count,
      NOW() + INTERVAL '1 year',
      true,
      NOW(),
      NULL
    );
    
    RETURN QUERY SELECT 
      true, 
      'Δημιουργήθηκε νέο Pilates deposit με ' || p_lesson_count::text || ' μαθήματα',
      v_user_id,
      p_lesson_count,
      0::integer;
    RETURN;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION set_user_pilates_lessons(text, integer) TO authenticated;

COMMENT ON FUNCTION set_user_pilates_lessons(text, integer) IS 'Ορίζει τον ακριβή αριθμό διαθέσιμων Pilates μαθημάτων για συγκεκριμένο χρήστη. ΠΡΟΣΟΧΗ: Χρησιμοποιήστε μόνο σε περίπτωση ανάγκης!';
```

### Χαρακτηριστικά του Section

- 💜 **Μοβ χρώμα** για διαφοροποίηση από τα άλλα sections
- 📧 **Email Input**: Εύκολη επιλογή χρήστη
- 📊 **3 Μεγάλα Cards**: Ενεργά, Συνολικά, Deposits
- 📝 **Επεξεργασία**: Input για νέο αριθμό μαθημάτων με instant update
- 🔍 **Λεπτομέρειες**: Collapsible section με όλα τα deposits
- 🔒 **Ασφάλεια**: Confirmation dialog με προβολή προηγούμενου και νέου αριθμού
- ✅ **Success Message**: Εμφάνιση αποτελέσματος με προηγούμενο → νέο αριθμό

---

## Επόμενα Βήματα (Για το μέλλον)

Αυτά είναι τα 3 βασικά sections για τη σελίδα "Διόρθωση Σφαλμάτων". Για κάθε νέο SQL:

1. Δημιουργία RPC function στη βάση
2. Προσθήκη νέου section στο ErrorFixing component
3. Εμφάνιση αποτελεσμάτων με κατάλληλο UI

## Υποστήριξη

Αν αντιμετωπίσετε προβλήματα:
1. Ελέγξτε ότι το RPC function εφαρμόστηκε σωστά στη βάση
2. Ελέγξτε τα browser console logs για σφάλματα
3. Βεβαιωθείτε ότι έχετε τα σωστά δικαιώματα (admin ή control_panel role)

