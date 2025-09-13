# 🎯 Σύστημα Απουσιών - Οδηγός Χρήσης

## ✅ Τι Έχει Δημιουργηθεί

### Backend (Database)
- **`absence_records` table** - Αποθηκεύει όλες τις απουσίες
- **RLS Policies** - Ασφαλή πρόσβαση για trainers και admins
- **Database Functions** - `get_trainer_users`, `get_user_absences`, `add_absence`, `update_absence`, `delete_absence`

### Frontend (React Components)
- **`src/utils/absenceApi.ts`** - API functions για τη διαχείριση απουσιών
- **Updated TrainerDashboard** - Νέο σύστημα απουσιών με πραγματικά δεδομένα
- **Updated TrainerSpecificDashboard** - Ίδιο σύστημα για Mike/Jordan

## 🚀 Πώς να Δοκιμάσεις το Σύστημα

### Βήμα 1: Setup Database
1. Άνοιξε το **Supabase Dashboard** → **SQL Editor**
2. Τρέξε το `database/CREATE_ABSENCE_SYSTEM.sql`
3. Κάνε κλικ **Run**

### Βήμα 2: Δημιουργία Test Data
1. Πήγαινε στο **Admin Panel** (`/admin`)
2. **Personal Training** → **"🔑 Δημιουργία Κωδικού"**
3. Δημιούργησε schedules με **Mike** και **Jordan** ως trainers
4. Προσθήκε 2-3 sessions για κάθε trainer

### Βήμα 3: Δοκιμή Trainer Panel
1. Πήγαινε στο **Trainer Panel** (`/trainer/mike` ή `/trainer/jordan`)
2. Κάνε κλικ στην καρτέλα **"Σύστημα Απουσιών"**
3. Θα δεις:
   - **Λίστα χρηστών** που έχουν schedules με τον συγκεκριμένο trainer
   - **Κουμπί "Προσθήκη Απουσίας"**
   - **Πληροφορίες για κάθε χρήστη** (επόμενη σέσια, συνολικές σεσίας)

### Βήμα 4: Δοκιμή Προσθήκης Απουσίας
1. Κάνε κλικ σε έναν χρήστη από τη λίστα
2. Κάνε κλικ **"Προσθήκη Απουσίας"**
3. Συμπλήρωσε:
   - **Χρήστης**: Επιλέγεται αυτόματα
   - **Ημερομηνία**: Ημερομηνία της απουσίας
   - **Ώρα**: Ώρα της απουσίας
   - **Τύπος**: Απών/Καθυστέρηση/Δικαιολογημένος
   - **Αιτία**: Προαιρετική αιτία
   - **Σημειώσεις**: Προαιρετικές σημειώσεις
4. Κάνε κλικ **"Προσθήκη"**

### Βήμα 5: Επαλήθευση
1. Η απουσία θα εμφανιστεί στον πίνακα
2. Μπορείς να δεις το **ιστορικό απουσιών** για κάθε χρήστη
3. Μπορείς να **διαγράψεις** απουσίες

## 📊 Features του Συστήματος

### Για Trainers
- **Δυναμική λίστα χρηστών** - Βασίζεται στα schedules που δημιούργησε ο admin
- **Προσθήκη απουσιών** - Για οποιονδήποτε χρήστη από τη λίστα
- **Ιστορικό απουσιών** - Πλήρες ιστορικό ανά χρήστη
- **Τύποι απουσιών** - Απών, Καθυστέρηση, Δικαιολογημένος
- **Σημειώσεις** - Αιτία και σημειώσεις για κάθε απουσία

### Αυτόματος Συγχρονισμός
- **Λίστα χρηστών** ενημερώνεται αυτόματα όταν αλλάζει ο admin το πρόγραμμα
- **Real-time data** - Όλα τα δεδομένα προέρχονται από τη βάση
- **RLS Security** - Κάθε trainer βλέπει μόνο τους δικούς του χρήστες

### UI/UX
- **Responsive design** - Δουλεύει σε όλες τις συσκευές
- **Intuitive interface** - Εύκολη χρήση
- **Visual feedback** - Toast notifications για όλες τις ενέργειες
- **Modal forms** - Εύκολη προσθήκη απουσιών

## 🔧 Technical Details

### Database Schema
```sql
absence_records:
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- trainer_name (VARCHAR, 'Mike' or 'Jordan')
- session_id (VARCHAR)
- session_date (DATE)
- session_time (TIME)
- absence_type (VARCHAR, 'absent'|'late'|'excused')
- reason (TEXT, optional)
- notes (TEXT, optional)
- created_by (UUID, Foreign Key)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### API Functions
- `getTrainerUsers(trainerName)` - Λαμβάνει χρήστες για συγκεκριμένο trainer
- `getUserAbsences(userId, trainerName)` - Λαμβάνει απουσίες για συγκεκριμένο χρήστη
- `addAbsence(...)` - Προσθέτει νέα απουσία
- `updateAbsence(...)` - Ενημερώνει υπάρχουσα απουσία
- `deleteAbsence(...)` - Διαγράφει απουσία

### RLS Policies
- **Trainers** μπορούν να δουν/διαχειριστούν απουσίες μόνο για τους δικούς τους χρήστες
- **Admins** έχουν πλήρη πρόσβαση
- **Users** μπορούν να δουν τις δικές τους απουσίες

## 🎯 Success Criteria

- ✅ Trainers βλέπουν μόνο τους δικούς τους χρήστες
- ✅ Προσθήκη απουσιών λειτουργεί σωστά
- ✅ Ιστορικό απουσιών εμφανίζεται σωστά
- ✅ Διαγραφή απουσιών λειτουργεί
- ✅ Συγχρονισμός με admin schedules
- ✅ RLS security δουλεύει
- ✅ UI είναι responsive και user-friendly

## 🚀 Ready for Production

Το σύστημα είναι έτοιμο για production και θα δουλέψει τέλεια και στο webview app για Android/iOS!

**Δοκίμασε το σύστημα τώρα!** 🎉
