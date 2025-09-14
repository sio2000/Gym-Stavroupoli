# Οδηγός Debug για Trainer Panel

## Πρόβλημα
Το Trainer Panel δεν εμφανίζει δεδομένα επειδή δεν υπάρχουν schedules στη βάση με trainer = 'Mike' ή 'Jordan'.

## Λύση - Βήμα προς Βήμα

### Βήμα 1: Άνοιξε το Browser Console
1. Πήγαινε στο `localhost:5173/trainer/mike` ή `/trainer/jordan`
2. Άνοιξε το Developer Tools (F12)
3. Πήγαινε στο Console tab

### Βήμα 2: Τρέξε το Browser Test
Αντιγράψε και επικόλλησε αυτόν τον κώδικα στο console:

```javascript
// Test Supabase access
console.log('🔍 Testing Supabase access...');

// Get the Supabase client from the app
const supabase = window.supabase || window.__supabase;

if (!supabase) {
  console.error('❌ Supabase not found. Make sure you are on the app page.');
} else {
  console.log('✅ Supabase client found');
  
  // Test 1: Query schedules
  supabase
    .from('personal_training_schedules')
    .select('*')
    .limit(5)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error querying schedules:', error);
      } else {
        console.log('✅ Schedules found:', data?.length || 0);
        console.log('📊 Sample schedule:', data?.[0]);
      }
    });
  
  // Test 2: Query with user profiles
  supabase
    .from('personal_training_schedules')
    .select(`
      *,
      user_profiles!personal_training_schedules_user_id_fkey(
        first_name,
        last_name,
        email
      )
    `)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error querying with profiles:', error);
      } else {
        console.log('✅ Schedules with profiles:', data?.length || 0);
        
        // Filter for Mike/Jordan
        const mikeSchedules = data?.filter(schedule => {
          const sessions = schedule.schedule_data?.sessions || [];
          return sessions.some(session => session.trainer === 'Mike');
        }) || [];
        
        const jordanSchedules = data?.filter(schedule => {
          const sessions = schedule.schedule_data?.sessions || [];
          return sessions.some(session => session.trainer === 'Jordan');
        }) || [];
        
        console.log('🏋️ Mike schedules:', mikeSchedules.length);
        console.log('🥊 Jordan schedules:', jordanSchedules.length);
        
        if (mikeSchedules.length > 0) {
          console.log('📋 Sample Mike schedule:', mikeSchedules[0]);
        }
        
        if (jordanSchedules.length > 0) {
          console.log('📋 Sample Jordan schedule:', jordanSchedules[0]);
        }
      }
    });
}
```

### Βήμα 3: Δημιουργία Test Data
Αν το test δείχνει 0 schedules:

1. **Μέθοδος 1: Κουμπί στο UI**
   - Πήγαινε στο Trainer Panel
   - Θα δεις ένα κουμπί "🚀 Δημιουργία Test Data"
   - Κάνε κλικ σε αυτό

2. **Μέθοδος 2: Console Command**
   ```javascript
   // Αν έχεις πρόσβαση στο createTestTrainerSchedules function
   createTestTrainerSchedules();
   ```

3. **Μέθοδος 3: SQL Script**
   - Άνοιξε το Supabase SQL Editor
   - Τρέξε το `database/FIX_TRAINER_SCHEDULES.sql`

### Βήμα 4: Επαλήθευση
Μετά τη δημιουργία test data:

1. Refresh τη σελίδα
2. Τρέξε ξανά το browser test
3. Θα δεις:
   - Mike schedules: 1-2
   - Jordan schedules: 1-2
   - Πραγματικές ώρες και ημερομηνίες

### Βήμα 5: Δοκιμή Trainer Panel
1. Πήγαινε στο `/trainer/mike`
2. Θα δεις τις ώρες του Mike (09:00-10:00, 18:00-19:00)
3. Πήγαινε στο `/trainer/jordan`
4. Θα δεις τις ώρες του Jordan (14:00-15:00, 19:00-20:00)

## Debug Information
Αν ακόμα δεν δουλεύει, έλεγξε:

1. **Console Logs:**
   - `[TrainerDashboard] All schedules:` - Πρέπει να δείχνει > 0
   - `[TrainerDashboard] Filtered trainer schedules:` - Πρέπει να δείχνει > 0

2. **Network Tab:**
   - Έλεγξε αν τα Supabase requests είναι successful
   - Look for 200 status codes

3. **Supabase Dashboard:**
   - Πήγαινε στο Supabase Dashboard
   - Έλεγξε το `personal_training_schedules` table
   - Θα πρέπει να δεις records με trainer = 'Mike' ή 'Jordan'

## Expected Result
Μετά τη διόρθωση, θα δεις:
- **Mike**: 09:00-10:00 (Personal), 18:00-19:00 (Kickboxing)
- **Jordan**: 14:00-15:00 (Personal), 19:00-20:00 (Combo)
- Πραγματικές ημερομηνίες και σημειώσεις
- Σωστά στατιστικά (Total Lessons > 0, Total Participants > 0)
