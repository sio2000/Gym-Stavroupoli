# Σύστημα Διαχείρισης Μαθημάτων και Εγγραφής Μελών

## Επισκόπηση

Αυτό το σύστημα παρέχει μια ολοκληρωμένη λύση για τη διαχείριση μαθημάτων και την εγγραφή μελών στο FreeGym. Περιλαμβάνει:

- **Διαχείριση Μαθημάτων**: Δημιουργία, επεξεργασία και διαχείριση μαθημάτων
- **Εγγραφή Μελών**: Δημόσια εγγραφή και διαχείριση μελών
- **Προβολή Μαθημάτων**: Δημόσια σελίδα για προβολή διαθέσιμων μαθημάτων
- **Admin Interface**: Πλήρες admin panel για διαχείριση

## Αρχεία που Δημιουργήθηκαν

### Components
- `src/components/admin/LessonManagement.tsx` - Component διαχείρισης μαθημάτων
- `src/components/admin/MemberRegistration.tsx` - Component διαχείρισης μελών

### Pages
- `src/pages/PublicRegistration.tsx` - Δημόσια σελίδα εγγραφής μελών
- `src/pages/PublicLessons.tsx` - Δημόσια σελίδα προβολής μαθημάτων

### API Utilities
- `src/utils/lessonApi.ts` - API functions για μαθήματα
- `src/utils/memberApi.ts` - API functions για μέλη

### Database
- `database/lesson_management_schema.sql` - Database schema για το σύστημα

## Χαρακτηριστικά

### 1. Διαχείριση Μαθημάτων

#### Admin Panel Features:
- **Δημιουργία Μαθημάτων**: Προσθήκη νέων μαθημάτων με όλες τις λεπτομέρειες
- **Επεξεργασία**: Τροποποίηση υπαρχόντων μαθημάτων
- **Διαγραφή**: Αφαίρεση μαθημάτων
- **Φίλτρα**: Αναζήτηση και φιλτράρισμα μαθημάτων
- **Κατηγορίες**: Διαχείριση κατηγοριών μαθημάτων
- **Αίθουσες**: Διαχείριση αίθουσών
- **Εκπαιδευτές**: Διαχείριση εκπαιδευτών

#### Lesson Fields:
- Όνομα μαθήματος
- Περιγραφή
- Κατηγορία
- Εκπαιδευτής
- Αίθουσα
- Ημέρα εβδομάδας
- Ώρα έναρξης/λήξης
- Χωρητικότητα
- Επίπεδο δυσκολίας
- Τιμή
- Κατάσταση (ενεργό/ανενεργό)

### 2. Εγγραφή Μελών

#### Public Registration Features:
- **3-Step Process**: Προσωπικά στοιχεία → Επιλογή πακέτου → Επιβεβαίωση
- **Form Validation**: Πλήρης επαλήθευση δεδομένων
- **Package Selection**: Επιλογή πακέτου συνδρομής
- **Terms & Conditions**: Αποδοχή όρων χρήσης
- **Email Verification**: Επιβεβαίωση email

#### Admin Member Management:
- **Member List**: Λίστα όλων των μελών
- **Edit Members**: Επεξεργασία στοιχείων μελών
- **Registration Requests**: Διαχείριση αιτημάτων εγγραφής
- **Approve/Reject**: Έγκριση ή απόρριψη αιτημάτων
- **Package Management**: Διαχείριση πακέτων συνδρομής

### 3. Δημόσια Προβολή Μαθημάτων

#### Features:
- **Lesson Grid**: Προβολή μαθημάτων σε grid layout
- **Search & Filter**: Αναζήτηση και φιλτράρισμα
- **Date Picker**: Επιλογή ημερομηνίας
- **Category Filter**: Φιλτράρισμα κατά κατηγορία
- **Difficulty Filter**: Φιλτράρισμα κατά επίπεδο δυσκολίας
- **Availability Status**: Εμφάνιση διαθέσιμων θέσεων
- **Expandable Cards**: Λεπτομερείς πληροφορίες μαθημάτων

## Database Schema

### Πίνακες που Δημιουργήθηκαν:

1. **lesson_categories** - Κατηγορίες μαθημάτων
2. **rooms** - Αίθουσες γυμναστηρίου
3. **trainers** - Εκπαιδευτές
4. **lessons** - Μαθήματα
5. **lesson_schedules** - Προγράμματα μαθημάτων
6. **lesson_bookings** - Κρατήσεις μαθημάτων
7. **lesson_attendance** - Παρακολούθηση μαθημάτων

### Functions που Δημιουργήθηκαν:

1. **get_lesson_availability()** - Έλεγχος διαθεσιμότητας μαθήματος
2. **book_lesson()** - Κράτηση μαθήματος
3. **cancel_lesson_booking()** - Ακύρωση κράτησης
4. **get_user_lesson_bookings()** - Κρατήσεις χρήστη
5. **get_available_lessons()** - Διαθέσιμα μαθήματα

## Εγκατάσταση

### 1. Database Setup

Εκτελέστε το SQL script στο Supabase:

```sql
-- Εκτέλεση του database/lesson_management_schema.sql
```

### 2. Environment Variables

Βεβαιωθείτε ότι έχετε τις απαραίτητες environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Dependencies

Οι απαραίτητες dependencies είναι ήδη εγκατεστημένες στο `package.json`.

## Χρήση

### Admin Panel

1. **Πρόσβαση**: Συνδεθείτε ως admin και πηγαίνετε στο Admin Panel
2. **Διαχείριση Μαθημάτων**: Κλικ στο tab "Διαχείριση Μαθημάτων"
3. **Εγγραφή Μελών**: Κλικ στο tab "Εγγραφή Μελών"

### Public Pages

1. **Εγγραφή Μελών**: `/public-registration`
2. **Προβολή Μαθημάτων**: `/public-lessons`

### API Usage

```typescript
// Παράδειγμα χρήσης API
import { getLessons, createLesson, bookLesson } from '@/utils/lessonApi';

// Λήψη όλων των μαθημάτων
const lessons = await getLessons();

// Δημιουργία νέου μαθήματος
const newLesson = await createLesson({
  name: 'Yoga για Αρχάριους',
  description: 'Βασικά μαθήματα yoga',
  category_id: 'category-id',
  trainer_id: 'trainer-id',
  room_id: 'room-id',
  day_of_week: 1,
  start_time: '09:00',
  end_time: '10:00',
  capacity: 15,
  difficulty: 'beginner',
  price: 10.00,
  is_active: true
});

// Κράτηση μαθήματος
const booking = await bookLesson(userId, lessonId, '2024-01-15');
```

## Security

### RLS Policies

Όλοι οι πίνακες έχουν Row Level Security (RLS) policies:

- **Public Access**: Μόνο για προβολή μαθημάτων και κατηγοριών
- **Admin Access**: Πλήρη πρόσβαση για διαχείριση
- **User Access**: Περιορισμένη πρόσβαση για κρατήσεις

### Authentication

- **Public Pages**: Δεν απαιτούν authentication
- **Admin Pages**: Απαιτούν admin role
- **User Pages**: Απαιτούν authentication

## Customization

### Adding New Lesson Categories

```sql
INSERT INTO lesson_categories (name, description, color, icon) VALUES
('New Category', 'Description', '#FF6B9D', '🏃');
```

### Adding New Rooms

```sql
INSERT INTO rooms (name, capacity, description, equipment, floor) VALUES
('New Room', 20, 'Description', ARRAY['Equipment'], 1);
```

### Customizing Lesson Fields

Τροποποιήστε το `LessonFormData` interface στο `src/components/admin/LessonManagement.tsx` για να προσθέσετε νέα πεδία.

## Troubleshooting

### Common Issues

1. **RLS Errors**: Βεβαιωθείτε ότι οι RLS policies είναι σωστά ρυθμισμένες
2. **Permission Errors**: Ελέγξτε ότι ο χρήστης έχει τον σωστό role
3. **API Errors**: Ελέγξτε τα environment variables

### Debug Mode

Ενεργοποιήστε debug mode στα components για περισσότερες πληροφορίες:

```typescript
console.log('[ComponentName] Debug info:', data);
```

## Future Enhancements

### Planned Features

1. **Lesson Booking System**: Πλήρες σύστημα κρατήσεων
2. **Payment Integration**: Ενσωμάτωση πληρωμών
3. **Email Notifications**: Ειδοποιήσεις email
4. **Mobile App**: Mobile application
5. **Analytics Dashboard**: Dashboard αναλυτικών στοιχείων

### API Extensions

1. **Bulk Operations**: Μαζικές λειτουργίες
2. **Export/Import**: Εξαγωγή/εισαγωγή δεδομένων
3. **Webhooks**: Webhook support
4. **Rate Limiting**: Περιορισμός ρυθμού αιτημάτων

## Support

Για υποστήριξη ή ερωτήσεις, επικοινωνήστε με την ομάδα ανάπτυξης.

---

**Σημείωση**: Αυτό το σύστημα είναι σχεδιασμένο για το FreeGym και μπορεί να χρειαστεί προσαρμογές για άλλες χρήσεις.
