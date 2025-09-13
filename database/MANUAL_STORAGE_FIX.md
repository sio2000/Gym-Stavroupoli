# MANUAL STORAGE FIX - ΧΕΙΡΟΚΙΝΗΤΗ ΔΙΟΡΘΩΣΗ STORAGE

## Το Πρόβλημα:
- **Policy Already Exists Error (42710)** - Το policy υπάρχει ήδη
- **Must be Owner Error (42501)** - Δεν έχουμε δικαιώματα για RLS

## Λύση μέσω Supabase Dashboard:

### 1. Πήγαινε στο Supabase Dashboard:
- URL: https://nolqodpfaqdnprixaqlo.supabase.co
- Πήγαινε στο **Storage** section

### 2. Δημιούργησε το Bucket:
- Κάνε κλικ στο **"New bucket"**
- Όνομα: `profile-photos`
- Public: **Yes** (ενεργοποίησε)
- File size limit: `5MB`
- Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`

### 3. Ρύθμισε RLS Policies:
- Πήγαινε στο **Authentication > Policies**
- Βρες το `storage.objects` table
- Διέγραψε όλα τα υπάρχοντα policies
- Δημιούργησε νέο policy:
  - **Name**: `Allow profile photos`
  - **Operation**: `All`
  - **Target roles**: `authenticated`
  - **USING expression**: `bucket_id = 'profile-photos'`

### 4. Εναλλακτικά - Απενεργοποίηση RLS:
- Πήγαινε στο **Database > Tables**
- Βρες το `storage.objects` table
- Κάνε κλικ στο **RLS** toggle για να το απενεργοποιήσεις

### 5. Δοκίμασε το Upload:
- Πήγαινε στο web app
- Δοκίμασε να ανεβάσεις φωτογραφία προφίλ
- Θα πρέπει να δουλεύει τώρα

## SQL Scripts που Δουλεύουν:
1. `FIX_STORAGE_ERRORS.sql` - Διαγραφή policies και δημιουργία νέων
2. `ALTERNATIVE_STORAGE_FIX.sql` - Εναλλακτική προσέγγιση

## Σημείωση:
Αν τα SQL scripts δεν δουλεύουν λόγω permissions, χρησιμοποίησε το Supabase Dashboard για manual setup.
