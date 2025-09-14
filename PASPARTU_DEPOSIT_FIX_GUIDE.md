# Paspartu Lesson Deposit System Fix Guide

## Προβλήματα που διορθώθηκαν

1. **Trigger δεν λειτουργούσε σωστά** - Το trigger `update_deposit_on_booking` δεν ενημερωνόταν το deposit όταν γίνονταν κρατήσεις
2. **Manual update στο frontend** - Το `PaspartuTraining.tsx` έκανε manual update του deposit επειδή το trigger δεν λειτουργούσε
3. **Δεν αντικαθιστούσε το παλιό πρόγραμμα** - Όταν ο admin δημιουργούσε νέο πρόγραμμα Paspartu, δεν αντικαθιστούσε το παλιό
4. **Δεν resetάρει το deposit** - Όταν δημιουργείται νέο πρόγραμμα, το deposit δεν resetάριζε

## Αλλαγές που έγιναν

### 1. Database Functions (database/fix_lesson_deposit_system.sql)

- **Διορθώθηκε το trigger `update_deposit_on_booking`** - Τώρα λειτουργεί σωστά για INSERT, DELETE και UPDATE operations
- **Προστέθηκε function `replace_paspartu_schedule`** - Αντικαθιστά το παλιό πρόγραμμα με το νέο
- **Προστέθηκε function `reset_lesson_deposit_for_new_program`** - Resetάρει το deposit όταν δημιουργείται νέο πρόγραμμα
- **Προστέθηκε function `test_lesson_deposit_triggers`** - Για testing του συστήματος

### 2. AdminPanel.tsx

- **Αντικαταστάθηκε το manual deposit creation** με RPC calls
- **Προστέθηκε αντικατάσταση παλιού προγράμματος** όταν δημιουργείται νέο
- **Προστέθηκε reset του deposit** όταν δημιουργείται νέο πρόγραμμα

### 3. PaspartuTraining.tsx

- **Αφαιρέθηκε το manual deposit update** - Τώρα το trigger κάνει την εργασία
- **Απλοποιήθηκε ο κώδικας** - Μόνο δημιουργία booking, το trigger κάνει το υπόλοιπο

## Πώς να εφαρμόσεις τις αλλαγές

### Βήμα 1: Εφάρμοσε το SQL script

```sql
-- Εκτέλεσε το αρχείο database/fix_lesson_deposit_system.sql στο Supabase
-- Αυτό θα διορθώσει τα triggers και θα δημιουργήσει τις νέες functions
```

### Βήμα 2: Ελέγξε ότι οι αλλαγές εφαρμόστηκαν

```bash
# Εκτέλεσε το test script
node test_lesson_deposit_system.js
```

### Βήμα 3: Ελέγξε το σύστημα

1. **Δημιούργησε νέο πρόγραμμα Paspartu** από το AdminPanel
2. **Έλεγξε ότι το deposit resetάρισε** σε 5 μαθήματα
3. **Κάνε κράτηση μαθήματος** από το PaspartuTraining
4. **Έλεγξε ότι το deposit ενημερώθηκε** (από 5 σε 4)
5. **Ακύρωσε την κράτηση** και έλεγξε ότι το deposit επέστρεψε σε 5

## Λειτουργία του συστήματος

### Όταν δημιουργείται νέο πρόγραμμα Paspartu:

1. **Αντικαθιστά το παλιό πρόγραμμα** (αν υπάρχει)
2. **Διαγράφει όλες τις παλιές κρατήσεις** του παλιού προγράμματος
3. **Resetάρει το deposit** σε 5 μαθήματα
4. **Δημιουργεί το νέο πρόγραμμα**

### Όταν γίνεται κράτηση μαθήματος:

1. **Δημιουργείται το booking** στον πίνακα `lesson_bookings`
2. **Το trigger `update_deposit_on_booking`** αυτόματα:
   - Αυξάνει το `used_lessons` κατά 1
   - Ενημερώνει το `remaining_lessons` (calculated field)
   - Ενημερώνει το `updated_at`

### Όταν ακυρώνεται κράτηση:

1. **Ενημερώνεται το status** του booking σε 'cancelled'
2. **Το trigger `update_deposit_on_booking`** αυτόματα:
   - Μειώνει το `used_lessons` κατά 1
   - Ενημερώνει το `remaining_lessons`
   - Ενημερώνει το `updated_at`

## Testing

Το σύστημα περιλαμβάνει comprehensive testing:

- **Database trigger tests** - Ελέγχει ότι τα triggers λειτουργούν
- **Real user tests** - Ελέγχει με πραγματικούς χρήστες
- **Booking lifecycle tests** - Ελέγχει κράτηση και ακύρωση

## Troubleshooting

### Αν το trigger δεν λειτουργεί:

1. Έλεγξε ότι το SQL script εκτελέστηκε σωστά
2. Έλεγξε τα logs του Supabase για errors
3. Εκτέλεσε το test script για debugging

### Αν το deposit δεν ενημερώνεται:

1. Έλεγξε ότι υπάρχει deposit record για τον χρήστη
2. Έλεγξε ότι το booking δημιουργήθηκε σωστά
3. Έλεγξε τα RLS policies

### Αν δεν αντικαθιστά το παλιό πρόγραμμα:

1. Έλεγξε ότι η function `replace_paspartu_schedule` υπάρχει
2. Έλεγξε ότι έχει τα σωστά permissions
3. Έλεγξε τα logs για errors

## Σημειώσεις

- Το σύστημα τώρα είναι **fully automated** - δεν χρειάζεται manual intervention
- Το **deposit ενημερώνεται αυτόματα** με κάθε κράτηση/ακύρωση
- Το **παλιό πρόγραμμα αντικαθίσταται αυτόματα** όταν δημιουργείται νέο
- Το **deposit resetάρει αυτόματα** όταν δημιουργείται νέο πρόγραμμα
