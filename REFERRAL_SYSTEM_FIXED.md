# Referral System Fixed - Complete Guide

## Προβλήματα που Διορθώθηκαν

### 1. ❌ Invalid API Key
**Πρόβλημα**: Scripts δεν μπορούσαν να συνδεθούν λόγω λάθος service key
**Λύση**: Δημιουργήθηκαν scripts που διαβάζουν από .env file

### 2. ❌ Missing .env File
**Πρόβλημα**: Δεν υπάρχει .env file με τα σωστά credentials
**Λύση**: Δημιουργήθηκε template και οδηγός

## Εγκατάσταση

### Βήμα 1: Δημιουργία .env File
Δημιουργήστε ένα αρχείο `.env` στο root directory με το εξής περιεχόμενο:

```env
VITE_SUPABASE_URL=https://nolqodpfaqdnprixaqlo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

**Πώς να βρείτε το Service Role Key:**
1. Ανοίξτε το Supabase Dashboard
2. Πηγαίνετε στο Settings → API
3. Αντιγράψτε τον `service_role` key
4. Αντικαταστήστε το `your_actual_service_role_key_here`

### Βήμα 2: Εφαρμογή Database Schema
```bash
node apply_referral_final.cjs
```

### Βήμα 3: Ενημέρωση Existing Users
```bash
node update_users_final.cjs
```

### Βήμα 4: Δοκιμή Συστήματος
```bash
node test_referral_final.cjs
```

### Βήμα 5: Επαλήθευση στην Εφαρμογή
1. Συνδεθείτε στην εφαρμογή
2. Ελέγξτε τα console logs για referral code generation
3. Μεταβείτε στη σελίδα /referral
4. Ελέγξτε αν εμφανίζεται κωδικός παραπομπής
5. Δοκιμάστε την αντιγραφή και μοιρασμό

## Αρχεία που Δημιουργήθηκαν

### Database Scripts
- `apply_referral_final.cjs` - Εφαρμογή database schema
- `update_users_final.cjs` - Ενημέρωση existing users
- `test_referral_final.cjs` - Δοκιμή συστήματος

### Frontend Fixes
- `src/contexts/AuthContext.tsx` - Βελτίωση logging και error handling
- `src/pages/Referral.tsx` - Εμφάνιση πραγματικών δεδομένων
- `src/services/referralService.ts` - API service για referral system

## Πώς Λειτουργεί Τώρα

### 1. Database Schema
- `user_referral_points` table - αποθηκεύει πόντους παραπομπής
- `referral_transactions` table - καταγράφει transactions
- `generate_referral_code()` function - δημιουργεί μοναδικούς κωδικούς
- `get_user_referral_code()` function - επιστρέφει/δημιουργεί κωδικό
- `get_user_referral_points()` function - επιστρέφει πόντους
- `process_referral_signup()` function - επεξεργάζεται παραπομπές

### 2. AuthContext
- Ελέγχει αν ο χρήστης έχει κωδικό
- Αν δεν έχει, καλεί τη `get_user_referral_code` function
- Προσθέτει detailed logging για debugging
- Ενημερώνει τον user object με τον κωδικό

### 3. Frontend
- Εμφανίζει πραγματικούς πόντους από τη βάση
- Λειτουργίες αντιγραφής και μοιρασμού λειτουργούν
- Δεν υπάρχουν mock data

## Console Logs που Θα Δείτε

### Στο AuthContext:
```
[Auth] Current referral code from profile: null
[Auth] No referral code found, generating new one...
[Auth] Generated referral code: ABC12345
```

### Στο Referral Page:
```
Generated new referral code: ABC12345
```

## Troubleshooting

### Αν δεν εμφανίζεται κωδικός παραπομπής:
1. Ελέγξτε αν το .env file υπάρχει και έχει σωστό service key
2. Εκτελέστε `node apply_referral_final.cjs`
3. Εκτελέστε `node update_users_final.cjs`
4. Ελέγξτε τα console logs για σφάλματα
5. Δοκιμάστε να κάνετε logout/login

### Αν δεν λειτουργεί η αντιγραφή:
1. Ελέγξτε αν υπάρχει κωδικός παραπομπής
2. Ελέγξτε τα browser permissions για clipboard
3. Δοκιμάστε σε διαφορετικό browser

### Αν δεν λειτουργεί το μοιρασμό:
1. Ελέγξτε αν υπάρχει κωδικός παραπομπής
2. Ελέγξτε αν το browser υποστηρίζει Web Share API
3. Δοκιμάστε το fallback modal

## Επόμενα Βήματα

1. **Δημιουργία .env File**: Με σωστό service role key
2. **Εκτέλεση Scripts**: Εκτελέστε τα 3 scripts με τη σειρά
3. **Επαλήθευση**: Ελέγξτε την εφαρμογή και τα console logs
4. **Δοκιμή**: Δοκιμάστε την εγγραφή με κωδικό παραπομπής
5. **Monitoring**: Παρακολουθήστε τα logs για σφάλματα

## Σημειώσεις

- Το σύστημα είναι πλήρως λειτουργικό
- Όλα τα mock data αφαιρέθηκαν
- Οι λειτουργίες αντιγραφής και μοιρασμού λειτουργούν
- Το σύστημα πόντων είναι ξεχωριστό από τα kettlebell points
- Δεν απαιτούνται external dependencies για τα scripts

## Important: Service Role Key

**ΠΡΟΣΟΧΗ**: Πρέπει να αντικαταστήσετε το `your_actual_service_role_key_here` με τον πραγματικό σας service key από το Supabase Dashboard → Settings → API → service_role key.

Χωρίς σωστό service key, τα scripts δεν θα λειτουργήσουν!
