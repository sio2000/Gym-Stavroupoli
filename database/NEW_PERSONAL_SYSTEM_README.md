# ΝΕΟ PERSONAL ΣΥΣΤΗΜΑ — Οδηγίες Deployment

Το νέο σύστημα αντικαθιστά πλήρως το legacy Personal (personal_training_schedules,
lesson_deposits/bookings, group_assignments/sessions, absence system, Paspartu).
Τα legacy δεδομένα ΔΕΝ διαγράφονται — απλώς δεν χρησιμοποιούνται πια από το UI.

## Βήματα (Supabase SQL Editor, με αυτή τη σειρά)

1. **`NEW_PERSONAL_SYSTEM_UP.sql`** — νέα schema:
   - Πακέτα: «Personal Ατομικό», «Ομαδικό WOD» (package_type `personal`)
   - Πίνακες: `personal_subscriptions`, `personal_class_slots`, `personal_bookings`,
     `personal_deposits`, `personal_weekly_refills`
   - View: `personal_slots_with_occupancy`
   - RPCs: `book_personal_class`, `cancel_personal_booking`,
     `process_personal_weekly_refills`, `get_personal_refill_status`,
     `get_active_personal_subscription`
   - RLS σε όλους τους νέους πίνακες
   - Επεκτείνει CHECKs: `membership_packages.package_type` (+`personal`),
     `memberships.duration_type` (+`personal_freestyle`)
   - Idempotent — ασφαλές να τρέξει ξανά.

2. **`ADD_TRAINER_LEFTERIS.sql`** — νέος trainer Λευτέρης
   - Login: `lefteris@freegym.gr` / `trainer123` (ίδια convention με Katerina)
   - Route: `/trainer/lefteris`

3. **Realtime**: βεβαιώσου ότι τα tables `personal_class_slots` και
   `personal_bookings` είναι ενεργά στο Supabase Realtime
   (Database → Replication → supabase_realtime publication):
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.personal_class_slots;
   ALTER PUBLICATION supabase_realtime ADD TABLE public.personal_bookings;
   ```

## Rollback

`NEW_PERSONAL_SYSTEM_DOWN.sql` — αφαιρεί πίνακες/RPCs του νέου συστήματος και
απενεργοποιεί τα 2 πακέτα. ΠΡΟΣΟΧΗ: διαγράφει δεδομένα του νέου συστήματος.

## Business κανόνες (όπως εγκρίθηκαν)

- Τιμές: η γραμματεία πληκτρολογεί € (μετρητά/POS) ή/και Kettlebell Points σε κάθε αγορά.
- Kettlebell Points: καταγράφονται ως επιβράβευση (όπως το υπάρχον σύστημα) — ΔΕΝ αφαιρούνται.
- WOD «Κλείνουν μόνοι τους»: εβδομαδιαίο top-up του deposit στο Χ (φορές/εβδομάδα),
  ΧΩΡΙΣ μεταφορά αχρησιμοποίητων (week 1 πιστώνεται στην αγορά, refill από week 2).
- «Εμείς τους κλείνουμε» (και όλο το Personal Ατομικό): όλα τα μαθήματα πιστώνονται
  upfront, κρατήσεις μόνο από γραμματεία/trainer.
- Legacy Personal/Paspartu: πλήρης απόκρυψη από όλα τα panels (δεδομένα διατηρούνται στη DB).
- QR: χρήστες με ΜΟΝΟ Personal ή ΜΟΝΟ Pilates συνδρομή → QR ενεργό μόνο από
  30' πριν την έναρξη έως τη λήξη ΠΡΑΓΜΑΤΙΚΗΣ κράτησης. Free Gym/Ultimate: ως είχε.
