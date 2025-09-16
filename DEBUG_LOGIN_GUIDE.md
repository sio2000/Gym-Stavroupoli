# 🔍 ΟΔΗΓΟΣ DEBUG ΣΥΝΔΕΣΗΣ

## 📋 Τι να κάνεις:

### 1. Ανοίγει το Developer Console
- Πατήσε F12 στο browser
- Πήγαινε στο tab "Console"

### 2. Κάνε σύνδεση
- Πήγαινε στη σελίδα σύνδεσης
- Βάλε τα σωστά credentials
- Πατήσε "Σύνδεση"

### 3. Αντιγράψε τα logs
Αντιγράψε όλα τα logs που ξεκινούν με `[Auth]` και στείλε τα μου.

## 🔍 Τι να ψάχνεις:

### ✅ Κανονική ροή:
```
[Auth] ===== AUTH CONTEXT USEEFFECT STARTED =====
[Auth] isInitialized: false
[Auth] Calling getInitialSession...
[Auth] Getting initial session...
[Auth] Auth state changed: SIGNED_IN [USER_ID]
[Auth] ===== LOADING USER PROFILE =====
[Auth] User ID: [USER_ID]
[Auth] Using safe function to get profile...
[Auth] ===== SAFE FUNCTION RESPONSE =====
[Auth] Safe function result: [PROFILE_DATA]
[Auth] Safe function error: null
[Auth] ===== PROFILE LOADED SUCCESSFULLY =====
[Auth] Profile data: [PROFILE_JSON]
[Auth] Profile state updated, loading set to false, initialized set to true
```

### ❌ Πιθανά προβλήματα:

1. **Κολλάει στο Safe Function Response:**
   - Αν δεν βλέπεις `[Auth] ===== SAFE FUNCTION RESPONSE =====`
   - Το πρόβλημα είναι στο RPC call

2. **Error στο Safe Function:**
   - Αν βλέπεις `[Auth] ===== SAFE FUNCTION ERROR =====`
   - Αντιγράψε το error message

3. **No Profile Data:**
   - Αν βλέπεις `[Auth] ===== NO PROFILE DATA =====`
   - Το profile δεν δημιουργήθηκε σωστά

4. **Fallback Profile Creation:**
   - Αν βλέπεις `[Auth] ===== ATTEMPTING FALLBACK PROFILE CREATION =====`
   - Το σύστημα προσπαθεί να δημιουργήσει fallback profile

## 🚀 Επόμενα Βήματα:

1. Κάνε τη σύνδεση με τα νέα logs
2. Αντιγράψε όλα τα `[Auth]` logs
3. Στείλε τα μου για να δω ακριβώς τι συμβαίνει

## 📝 Σημείωση:

Τα νέα logs θα σου δείξουν ακριβώς:
- Αν το RPC function λειτουργεί
- Τι δεδομένα επιστρέφει
- Πού ακριβώς κολλάει η ροή
- Αν υπάρχει error και ποιο
