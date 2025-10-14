# 📧 Contact Form Email Setup Guide

## Επισκόπηση

Η φόρμα επικοινωνίας στο `/contact` είναι πλήρως λειτουργική και έτοιμη να στείλει emails στο `devtaskhub@gmail.com`.

## 🚀 Τρέχουσα Λειτουργία

### Development Mode
- Τα μηνύματα εμφανίζονται στο browser console
- Προσομοιώνει την αποστολή email με επιτυχία
- Εμφανίζει μήνυμα επιτυχίας στον χρήστη

### Production Mode (Προαιρετικό)
Για πραγματική αποστολή email, ακολουθήστε τα παρακάτω βήματα:

## 📋 Ρύθμιση για Production

### 1. Ρύθμιση Resend API (Προτεινόμενο)

1. **Δημιουργία λογαριασμού Resend:**
   - Πηγαίνετε στο [resend.com](https://resend.com)
   - Δημιουργήστε λογαριασμό
   - Επιβεβαιώστε το domain σας

2. **Λήψη API Key:**
   - Στο dashboard, πηγαίνετε στο "API Keys"
   - Δημιουργήστε νέο API key
   - Αποθηκεύστε το key

3. **Ρύθμιση Environment Variables:**
   ```bash
   # Στο .env file
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

4. **Ενεργοποίηση πραγματικής αποστολής:**
   - Ανοίξτε το `src/api/send-email.ts`
   - Αφαιρέστε τα σχόλια από τον κώδικα Resend API
   - Αφαιρέστε το simulation code

### 2. Εναλλακτικά: Supabase Edge Functions

1. **Deploy το Edge Function:**
   ```bash
   npx supabase functions deploy send-contact-email
   ```

2. **Ρύθμιση Environment Variables:**
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 3. Database Backup (Προαιρετικό)

Για να αποθηκεύονται τα μηνύματα στη βάση δεδομένων ως backup:

1. **Εκτέλεση SQL Script:**
   ```bash
   # Στο Supabase SQL Editor, εκτελέστε:
   # database/create_contact_messages_table.sql
   ```

2. **Ενεργοποίηση στο κώδικα:**
   - Ανοίξτε το `src/api/send-email.ts`
   - Αφαιρέστε τα σχόλια από τη συνάρτηση `saveContactMessageToDatabase`

## 🧪 Δοκιμή

1. **Πηγαίνετε στο `/contact`**
2. **Συμπληρώστε τη φόρμα**
3. **Στείλτε το μήνυμα**
4. **Ελέγξτε:**
   - Browser console για logs (development)
   - Email inbox του `devtaskhub@gmail.com` (production)

## 📊 Παρακολούθηση

### Development
- Όλα τα μηνύματα εμφανίζονται στο browser console
- Format: JSON με timestamp και όλα τα στοιχεία

### Production
- Emails στο `devtaskhub@gmail.com`
- Database entries (αν ενεργοποιηθεί)
- Resend dashboard για στατιστικά

## 🔧 Προβλήματα και Λύσεις

### Πρόβλημα: "Failed to send email"
**Λύση:**
1. Ελέγξτε τα environment variables
2. Επιβεβαιώστε το Resend API key
3. Ελέγξτε τα network logs

### Πρόβλημα: Emails δεν φτάνουν
**Λύση:**
1. Ελέγξτε το spam folder
2. Επιβεβαιώστε το domain στο Resend
3. Δοκιμάστε με διαφορετικό recipient email

### Πρόβλημα: Database errors
**Λύση:**
1. Εκτελέστε το SQL script ξανά
2. Ελέγξτε τα RLS policies
3. Επιβεβαιώστε τα permissions

## 📝 Customization

### Αλλαγή Recipient Email
Αλλάξτε το `devtaskhub@gmail.com` στο:
- `src/api/send-email.ts` (γραμμή 23)

### Αλλαγή Email Template
Τροποποιήστε το `emailHtml` στο:
- `src/api/send-email.ts` (γραμμές 42-70)

### Προσθήκη Πεδίων
1. Ενημερώστε το `ContactFormData` interface
2. Προσθέστε τα πεδία στη φόρμα
3. Ενημερώστε το email template

## ✅ Checklist για Production

- [ ] Resend API key configured
- [ ] Domain verified στο Resend
- [ ] Environment variables set
- [ ] Email template customized
- [ ] Database table created (optional)
- [ ] Test email sent successfully
- [ ] Error handling tested
- [ ] Spam folder checked

## 🎯 Τελικό Αποτέλεσμα

Μετά την ρύθμιση, η φόρμα επικοινωνίας θα:
1. ✅ Στέλνει emails στο `devtaskhub@gmail.com`
2. ✅ Εμφανίζει επιτυχημένο μήνυμα στον χρήστη
3. ✅ Διαχειρίζεται errors gracefully
4. ✅ Αποθηκεύει backup στη βάση δεδομένων (optional)
5. ✅ Πληροί τις απαιτήσεις του App Store για support URL

---

**Σημείωση:** Η φόρμα λειτουργεί ήδη στο development mode και είναι έτοιμη για production με την παραπάνω ρύθμιση.
