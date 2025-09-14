# Οδηγίες Διόρθωσης Trainer Panel

## Πρόβλημα
Το Trainer Panel δεν εμφανίζει τις ώρες που δουλεύει ο κάθε προπονητής επειδή:
1. Δεν υπάρχουν schedules στη βάση με trainer = 'Mike' ή 'Jordan'
2. Τα υπάρχοντα schedules έχουν διαφορετικά ονόματα προπονητών

## Λύση

### Βήμα 1: Τρέξε το SQL Script
Ανοίγεις το Supabase SQL Editor και τρέχεις το αρχείο:
```
database/FIX_TRAINER_SCHEDULES.sql
```

Αυτό το script θα:
- Ενημερώσει όλα τα υπάρχοντα schedules να χρησιμοποιούν 'Mike' ή 'Jordan'
- Δημιουργήσει δοκιμαστικά schedules για και τους δύο προπονητές

### Βήμα 2: Επαλήθευση
Μετά το script, θα δεις:
- Schedules με trainer = 'Mike'
- Schedules με trainer = 'Jordan'
- Πραγματικές ώρες και ημερομηνίες

### Βήμα 3: Δοκιμή
1. Συνδέσου ως `trainer1@freegym.gr`
2. Πήγαινε στο `/trainer/mike` ή `/trainer/jordan`
3. Θα δεις τις ώρες που δουλεύει ο κάθε προπονητής

## Αρχεία SQL που δημιουργήθηκαν

1. **`database/FIX_TRAINER_SCHEDULES.sql`** - Κύριο script (τρέξε αυτό)
2. **`database/CHECK_CURRENT_SCHEDULES.sql`** - Για έλεγχο τι υπάρχει
3. **`database/CREATE_SAMPLE_TRAINER_SCHEDULES.sql`** - Για δοκιμαστικά δεδομένα
4. **`database/UPDATE_TRAINER_NAMES.sql`** - Για ενημέρωση υπαρχόντων

## Debug Information
Αν ακόμα δεν δουλεύει, έλεγξε τα console logs:
- `[TrainerDashboard] All schedules:` - Όλα τα schedules στη βάση
- `[TrainerDashboard] Filtered trainer schedules:` - Τα schedules του προπονητή
- `[TrainerDashboard] Found schedules for trainer:` - Πόσα βρέθηκαν

## Expected Result
Μετά το script, θα δεις:
- **Mike**: 09:00-10:00 (Personal), 18:00-19:00 (Kickboxing)
- **Jordan**: 14:00-15:00 (Personal), 19:00-20:00 (Combo)
- Πραγματικές ημερομηνίες και σημειώσεις
