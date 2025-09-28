# Οδηγίες για Μηδενισμό Kettlebell Points

## 📋 Τι κάνει αυτό το script

Το `safe_reset_kettlebell_points.sql` μηδενίζει **ΜΟΝΟ** τα Kettlebell Points από όλους τους χρήστες. ΔΕΝ αγγίζει:
- Cash transactions
- Memberships  
- User profiles
- Άλλα δεδομένα

## 🔒 Ασφάλεια

✅ **Αυτόματα backup**: Δημιουργεί backup πριν από οποιαδήποτε αλλαγή  
✅ **Rollback capability**: Μπορείς να επαναφέρεις τα δεδομένα αν χρειαστεί  
✅ **Verification**: Ελέγχει ότι όλα πήγαν καλά  

## 📝 Βήματα εκτέλεσης

### 1. Έλεγχος τρέχουσας κατάστασης
```sql
-- Τρέξε πρώτα αυτό για να δεις τι υπάρχει
\i database/verify_kettlebell_points_status.sql
```

### 2. Εκτέλεση του reset
```sql
-- Αυτό θα μηδενίσει τα points με ασφάλεια
\i database/safe_reset_kettlebell_points.sql
```

### 3. Επαλήθευση αποτελέσματος
```sql
-- Τρέξε ξανά για να επιβεβαιώσεις ότι όλα είναι 0
\i database/verify_kettlebell_points_status.sql
```

## 🔄 Αν χρειαστεί rollback

```sql
-- ΜΟΝΟ αν χρειαστεί να επαναφέρεις τα δεδομένα
\i database/rollback_kettlebell_points_reset.sql
```

## ⚠️ Προσοχή

- **Πάντα** τρέξε πρώτα το verification script
- **Κάνε backup** της βάσης πριν από το reset (αν δεν το έχεις ήδη)
- **Δοκίμασε** πρώτα σε staging environment αν είναι δυνατόν

## 📊 Τι θα δεις

Μετά το reset:
- Όλοι οι χρήστες θα έχουν 0 Kettlebell Points
- Το backup θα είναι διαθέσιμο για rollback
- Η εφαρμογή θα λειτουργεί κανονικά με 0 points
