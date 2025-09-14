# 🧪 Test Complete Workflow - Admin → Trainer

## Στόχος
Να δοκιμάσουμε το πλήρες workflow: Admin δημιουργεί schedule → Trainer το βλέπει

## Βήματα Δοκιμής

### Βήμα 1: Καθαρισμός Test Data
1. Άνοιξε το **Supabase Dashboard** → **SQL Editor**
2. Τρέξε το `database/CLEANUP_TEST_DATA.sql`
3. Κάνε κλικ **Run**

### Βήμα 2: Δημιουργία Schedule από Admin
1. Πήγαινε στο **Admin Panel** (`/admin`)
2. Πήγαινε στο **Personal Training** tab
3. Κάνε κλικ **"🔑 Δημιουργία Κωδικού"**
4. Επίλεξε **"👤 Ατομικό"**
5. Επίλεξε έναν χρήστη από το dropdown
6. Επίλεξε **"Mike"** ή **"Jordan"** ως trainer
7. Πρόσθεσε 2-3 sessions με διαφορετικές ώρες
8. Κάνε κλικ **"✅ Δημιουργία Κωδικού"**

### Βήμα 3: Επαλήθευση στο Trainer Panel
1. Πήγαινε στο **Trainer Panel** (`/trainer/mike` ή `/trainer/jordan`)
2. Θα πρέπει να δεις:
   - **Σύνολο Μαθημάτων**: > 0
   - **Συνολικοί Συμμετέχοντες**: > 0
   - **Πίνακας με τις ώρες** που δημιούργησε ο admin

### Βήμα 4: Δοκιμή και για τον άλλο Trainer
1. Πήγαινε στο **Admin Panel**
2. Δημιούργησε έναν άλλο κωδικό με τον άλλο trainer
3. Πήγαινε στο **Trainer Panel** του άλλου trainer
4. Θα πρέπει να δεις τα δικά του schedules

## Expected Results

### Admin Panel
- ✅ Dropdown με επιλογές "Mike" και "Jordan"
- ✅ Δημιουργία κωδικού με επιλεγμένο trainer
- ✅ Schedule δημιουργείται στη βάση

### Trainer Panel
- ✅ Εμφάνιση schedules μόνο για τον συγκεκριμένο trainer
- ✅ Σωστά στατιστικά (Total Lessons, Total Participants)
- ✅ Πίνακας με ημερομηνίες, ώρες, χρήστες, email, αίθουσα, status, σημειώσεις

### Database
- ✅ Schedules αποθηκεύονται με σωστό trainer name
- ✅ RLS policies επιτρέπουν πρόσβαση στους trainers
- ✅ Query επιστρέφει σωστά δεδομένα

## Troubleshooting

Αν κάτι δεν δουλεύει:

1. **Έλεγξε Console Logs:**
   ```
   [TrainerDashboard] Found schedules for trainer: X
   [TrainerDashboard] All schedules: Array(X)
   ```

2. **Έλεγξε Database:**
   ```sql
   SELECT id, user_id, schedule_data->'sessions' as sessions 
   FROM personal_training_schedules 
   WHERE schedule_data->'sessions' @> '[{"trainer": "Mike"}]';
   ```

3. **Έλεγξε RLS Policies:**
   ```sql
   SELECT policyname, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'personal_training_schedules';
   ```

## Success Criteria
- ✅ Admin μπορεί να δημιουργεί schedules με Mike/Jordan
- ✅ Mike βλέπει μόνο τα δικά του schedules
- ✅ Jordan βλέπει μόνο τα δικά του schedules
- ✅ Όλα τα δεδομένα εμφανίζονται σωστά
- ✅ Δεν υπάρχουν test data

**Δοκίμασε το workflow τώρα!** 🚀
