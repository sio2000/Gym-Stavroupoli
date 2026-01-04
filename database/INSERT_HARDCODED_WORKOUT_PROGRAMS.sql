-- Insert Hardcoded Workout Programs Data
-- This script inserts all the original hardcoded workout programs into the database
-- Run this after CREATE_WORKOUT_PROGRAMS_SCHEMA.sql

-- First, ensure categories exist (they should already exist from CREATE_WORKOUT_PROGRAMS_SCHEMA.sql)
-- But we'll insert them again with ON CONFLICT DO NOTHING to be safe

-- Insert Categories
INSERT INTO workout_program_categories (name, name_english, icon, display_order) VALUES
  ('Leg & Glutes (πόδια & γλουτός)', 'Leg & Glutes', '🦵', 1),
  ('Abdominals (ABS) (κοιλιακοί)', 'Abdominals', '💪', 2),
  ('Arms & Traps (χέρια & τραπεζοειδής)', 'Arms & Traps', '💪', 3),
  ('WARM UP', 'Warm Up', '🔥', 4),
  ('COOL DOWN', 'Cool Down', '🧘', 5),
  ('Lower Back (Ραχιαίοι)', 'Lower Back', '🦴', 6)
ON CONFLICT (name) DO NOTHING;

-- Get category IDs for reference
DO $$
DECLARE
  leg_glutes_id UUID;
  abdominals_id UUID;
  arms_traps_id UUID;
  warmup_id UUID;
  cooldown_id UUID;
  lowerback_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO leg_glutes_id FROM workout_program_categories WHERE name = 'Leg & Glutes (πόδια & γλουτός)';
  SELECT id INTO abdominals_id FROM workout_program_categories WHERE name = 'Abdominals (ABS) (κοιλιακοί)';
  SELECT id INTO arms_traps_id FROM workout_program_categories WHERE name = 'Arms & Traps (χέρια & τραπεζοειδής)';
  SELECT id INTO warmup_id FROM workout_program_categories WHERE name = 'WARM UP';
  SELECT id INTO cooldown_id FROM workout_program_categories WHERE name = 'COOL DOWN';
  SELECT id INTO lowerback_id FROM workout_program_categories WHERE name = 'Lower Back (Ραχιαίοι)';

  -- Insert LEG & GLUTES Exercises
  INSERT INTO workout_exercises (name, name_english, description, youtube_url, category_id, display_order) VALUES
    ('Leg extension', 'Leg extension', 'Άσκηση για τον τετρακέφαλο μυ του μηρού με μηχάνημα', 'https://www.youtube.com/results?search_query=leg+extension+exercise', leg_glutes_id, 1),
    ('Seated leg curl', 'Seated leg curl', 'Άσκηση για τους οπίσθιους μυς του μηρού σε καθιστή θέση', 'https://www.youtube.com/results?search_query=seated+leg+curl+exercise', leg_glutes_id, 2),
    ('Abductor and adductor', 'Abductor and adductor', 'Άσκηση για τους απομακρυντικούς και προσθαγγιστικούς μυς του μηρού', 'https://www.youtube.com/results?search_query=abductor+adductor+machine', leg_glutes_id, 3),
    ('Leg press / calf raise', 'Leg press / calf raise', 'Σύνθετη άσκηση για πόδια και γάμπες', 'https://www.youtube.com/results?search_query=leg+press+calf+raise', leg_glutes_id, 4),
    ('calf seated raise machine', 'calf seated raise machine', 'Άσκηση για τις γάμπες σε καθιστή θέση', 'https://www.youtube.com/results?search_query=seated+calf+raise+machine', leg_glutes_id, 5),
    ('smith Maschine', 'smith Maschine', 'Άσκηση με Smith μηχάνημα', 'https://www.youtube.com/results?search_query=smith+machine+exercises', leg_glutes_id, 6),
    ('Squat bodyweight', 'Squat bodyweight', 'Κλασική κάμψη με το βάρος του σώματος', 'https://www.youtube.com/results?search_query=bodyweight+squat', leg_glutes_id, 7),
    ('Squat sumo', 'Squat sumo', 'Κάμψη με πλατιά στάση πόδων', 'https://www.youtube.com/results?search_query=sumo+squat', leg_glutes_id, 8),
    ('squat jump', 'squat jump', 'Κάμψη με άλμα για εκρηκτική δύναμη', 'https://www.youtube.com/results?search_query=squat+jump', leg_glutes_id, 9),
    ('squat sumo jump', 'squat sumo jump', 'Συνο με πλατιά στάση και άλμα', 'https://www.youtube.com/results?search_query=sumo+squat+jump', leg_glutes_id, 10),
    ('barbell back squat', 'barbell back squat', 'Κλασική κάμψη με μπαρέλα στην πλάτη', 'https://www.youtube.com/results?search_query=barbell+back+squat', leg_glutes_id, 11),
    ('barbell front squat', 'barbell front squat', 'Κάμψη με μπαρέλα μπροστά', 'https://www.youtube.com/results?search_query=barbell+front+squat', leg_glutes_id, 12),
    ('dumbbell lunges or kettlebell', 'dumbbell lunges or kettlebell', 'Εμπρός βήμα με dumbells ή kettlebell', 'https://www.youtube.com/results?search_query=dumbbell+kettlebell+lunges', leg_glutes_id, 13),
    ('Romanian deadlift or dumbbell (hamstings)', 'Romanian deadlift or dumbbell (hamstings)', 'Ρουμάνικη νεκρή έλξη για τους οπίσθιους μυς', 'https://www.youtube.com/results?search_query=romanian+deadlift+hamstrings', leg_glutes_id, 14),
    ('hip thrust', 'hip thrust', 'Άσκηση για τους γλουτούς μυς', 'https://www.youtube.com/results?search_query=hip+thrust+exercise', leg_glutes_id, 15),
    ('Bulgarian split squat', 'Bulgarian split squat', 'Μονόπλευρη κάμψη με πίσω πόδι ψηλά', 'https://www.youtube.com/results?search_query=bulgarian+split+squat', leg_glutes_id, 16),
    ('cable kickback', 'cable kickback', 'Ανάκρουση ποδιού με cable για γλουτούς', 'https://www.youtube.com/results?search_query=cable+kickback+glutes', leg_glutes_id, 17),
    ('box jump', 'box jump', 'Άλμα πάνω σε κουτί για εκρηκτική δύναμη', 'https://www.youtube.com/results?search_query=box+jump+exercise', leg_glutes_id, 18),
    ('step over box with DUMBBELL or kettlebell', 'step over box with DUMBBELL or kettlebell', 'Αναβίβαση κουτιού με dumbells ή kettlebell', 'https://www.youtube.com/results?search_query=box+step+over+dumbbell', leg_glutes_id, 19),
    ('pistol squat', 'pistol squat', 'Μονόπλευρη κάμψη με ένα πόδι', 'https://www.youtube.com/results?search_query=pistol+squat', leg_glutes_id, 20),
    ('pistol squat at box', 'pistol squat at box', 'Pistol squat με υποστήριξη κουτιού', 'https://www.youtube.com/results?search_query=pistol+squat+box', leg_glutes_id, 21),
    ('standing (alf raise)', 'standing (alf raise)', 'Άσκηση για τις γάμπες σε όρθια θέση', 'https://www.youtube.com/results?search_query=standing+calf+raise', leg_glutes_id, 22)
  ON CONFLICT DO NOTHING;

  -- Insert ABDOMINALS Exercises
  INSERT INTO workout_exercises (name, name_english, description, youtube_url, category_id, display_order) VALUES
    ('sit up', 'sit up', 'Κλασική άσκηση για τους κοιλιακούς σε ξαπλωμένη θέση', 'https://www.youtube.com/results?search_query=sit+up+exercise', abdominals_id, 1),
    ('machine crunch', 'machine crunch', 'Crunch με ειδικό μηχάνημα', 'https://www.youtube.com/results?search_query=machine+crunch', abdominals_id, 2),
    ('crunch', 'crunch', 'Βασική άσκηση για τους κοιλιακούς', 'https://www.youtube.com/results?search_query=crunch+exercise', abdominals_id, 3),
    ('leg raises', 'leg raises', 'Ανύψωση ποδιών για τους κάτω κοιλιακούς', 'https://www.youtube.com/results?search_query=leg+raises+abs', abdominals_id, 4),
    ('hanging knee raises', 'hanging knee raises', 'Ανύψωση γονάτων σε κρέμασμα', 'https://www.youtube.com/results?search_query=hanging+knee+raises', abdominals_id, 5),
    ('captains chair leg raises', 'captains chair leg raises', 'Ανύψωση ποδιών σε captains chair', 'https://www.youtube.com/results?search_query=captains+chair+leg+raises', abdominals_id, 6),
    ('Russian twist', 'Russian twist', 'Στροφή σώματος για πλάγιους κοιλιακούς', 'https://www.youtube.com/results?search_query=russian+twist+exercise', abdominals_id, 7),
    ('cable woodchopper', 'cable woodchopper', 'Κοπτική κίνηση με cable για πλάγιους κοιλιακούς', 'https://www.youtube.com/results?search_query=cable+woodchopper', abdominals_id, 8),
    ('side crunch', 'side crunch', 'Crunch πλάγια για πλάγιους κοιλιακούς', 'https://www.youtube.com/results?search_query=side+crunch+exercise', abdominals_id, 9),
    ('plank', 'plank', 'Στατική άσκηση για όλους τους κοιλιακούς', 'https://www.youtube.com/results?search_query=plank+exercise', abdominals_id, 10),
    ('side plank', 'side plank', 'Plank πλάγια για πλάγιους κοιλιακούς', 'https://www.youtube.com/results?search_query=side+plank+exercise', abdominals_id, 11),
    ('ab wheel rollout', 'ab wheel rollout', 'Άσκηση με τροχό για κοιλιακούς', 'https://www.youtube.com/results?search_query=ab+wheel+rollout', abdominals_id, 12)
  ON CONFLICT DO NOTHING;

  -- Insert ARMS & TRAPS Exercises
  -- Biceps
  INSERT INTO workout_exercises (name, name_english, description, youtube_url, category_id, display_order) VALUES
    ('Dumbbell Bicep Curl', 'Dumbbell Bicep Curl', 'Κλασική άσκηση για δικέφαλους με dumbells', 'https://www.youtube.com/results?search_query=dumbbell+bicep+curl', arms_traps_id, 1),
    ('Barbell Bicep Curl', 'Barbell Bicep Curl', 'Άσκηση για δικέφαλους με μπαρέλα', 'https://www.youtube.com/results?search_query=barbell+bicep+curl', arms_traps_id, 2),
    ('Hammer Curl', 'Hammer Curl', 'Άσκηση για δικέφαλους με ουδέτερη λαβή', 'https://www.youtube.com/results?search_query=hammer+curl', arms_traps_id, 3),
    ('Preacher Curl Machine', 'Preacher Curl Machine', 'Άσκηση για δικέφαλους με ειδικό μηχάνημα', 'https://www.youtube.com/results?search_query=preacher+curl+machine', arms_traps_id, 4),
    ('Cable Bicep Curl', 'Cable Bicep Curl', 'Άσκηση για δικέφαλους με cable', 'https://www.youtube.com/results?search_query=cable+bicep+curl', arms_traps_id, 5),
    ('Eccentric Reverse Curl', 'Eccentric Reverse Curl', 'Εκκεντρική άσκηση για δικέφαλους με αντίστροφη λαβή', 'https://www.youtube.com/results?search_query=eccentric+reverse+curl', arms_traps_id, 6),
    ('EZ Bar Bicep Curl (Standing)', 'EZ Bar Bicep Curl (Standing)', 'Άσκηση για δικέφαλους με EZ bar σε όρθια θέση', 'https://www.youtube.com/results?search_query=ez+bar+bicep+curl+standing', arms_traps_id, 7),
    -- Triceps
    ('Triceps Pushdown (Cable Machine)', 'Triceps Pushdown (Cable Machine)', 'Άσκηση για τρικέφαλους με cable machine', 'https://www.youtube.com/results?search_query=triceps+pushdown+cable', arms_traps_id, 8),
    ('Overhead Tricep Extension', 'Overhead Tricep Extension', 'Άσκηση για τρικέφαλους πάνω από το κεφάλι', 'https://www.youtube.com/results?search_query=overhead+tricep+extension', arms_traps_id, 9),
    ('Bench Dips', 'Bench Dips', 'Dips σε πάγκο για τρικέφαλους', 'https://www.youtube.com/results?search_query=bench+dips', arms_traps_id, 10),
    ('Assisted Dip Machine', 'Assisted Dip Machine', 'Dips με υποβοήθηση μηχανήματος', 'https://www.youtube.com/results?search_query=assisted+dip+machine', arms_traps_id, 11),
    ('Dumbbell Kickback', 'Dumbbell Kickback', 'Κλωτσιά με dumbell για τρικέφαλους', 'https://www.youtube.com/results?search_query=dumbbell+kickback+triceps', arms_traps_id, 12),
    ('One-Arm Overhead Dumbbell Extension', 'One-Arm Overhead Dumbbell Extension', 'Μονόπλευρη άσκηση για τρικέφαλους πάνω από το κεφάλι', 'https://www.youtube.com/results?search_query=one+arm+overhead+dumbbell+extension', arms_traps_id, 13),
    -- Shoulders
    ('Dumbbell Shoulder Press', 'Dumbbell Shoulder Press', 'Άσκηση για ώμους με dumbells', 'https://www.youtube.com/results?search_query=dumbbell+shoulder+press', arms_traps_id, 14),
    ('Lateral Raises', 'Lateral Raises', 'Πλαγίες αναβάσεις για μέσους δελτοειδείς', 'https://www.youtube.com/results?search_query=lateral+raises', arms_traps_id, 15),
    ('Front Raises', 'Front Raises', 'Μπροστινές αναβάσεις για πρόσθιους δελτοειδείς', 'https://www.youtube.com/results?search_query=front+raises', arms_traps_id, 16),
    ('Shoulder Press Machine', 'Shoulder Press Machine', 'Άσκηση για ώμους με μηχάνημα', 'https://www.youtube.com/results?search_query=shoulder+press+machine', arms_traps_id, 17),
    ('Reverse Pec Deck', 'Reverse Pec Deck', 'Αντίστροφη άσκηση για οπίσθιους δελτοειδείς', 'https://www.youtube.com/results?search_query=reverse+pec+deck', arms_traps_id, 18),
    ('Shoulder Press (Barbell ή Kettlebell ή Dumbbell)', 'Shoulder Press (Barbell or Kettlebell or Dumbbell)', 'Άσκηση για ώμους με μπαρέλα, kettlebell ή dumbells', 'https://www.youtube.com/results?search_query=shoulder+press', arms_traps_id, 19),
    -- Forearms
    ('Wrist Curls', 'Wrist Curls', 'Άσκηση για πήχεις με κάμψη καρπού', 'https://www.youtube.com/results?search_query=wrist+curls', arms_traps_id, 20),
    ('Reverse Wrist Curls', 'Reverse Wrist Curls', 'Άσκηση για πήχεις με αντίστροφη κάμψη καρπού', 'https://www.youtube.com/results?search_query=reverse+wrist+curls', arms_traps_id, 21),
    ('Farmers Walk', 'Farmers Walk', 'Περπάτημα με βάρη για δύναμη και σταθερότητα', 'https://www.youtube.com/results?search_query=farmers+walk', arms_traps_id, 22),
    -- Traps
    ('Dumbbell Shrugs', 'Dumbbell Shrugs', 'Ανάταση ώμων με dumbells για τραπεζοειδή', 'https://www.youtube.com/results?search_query=dumbbell+shrugs', arms_traps_id, 23),
    ('Barbell Shrugs', 'Barbell Shrugs', 'Ανάταση ώμων με μπαρέλα για τραπεζοειδή', 'https://www.youtube.com/results?search_query=barbell+shrugs', arms_traps_id, 24)
  ON CONFLICT DO NOTHING;

  -- Insert WARM UP Exercises
  INSERT INTO workout_exercises (name, name_english, description, youtube_url, category_id, display_order) VALUES
    ('Stationary Bike', 'Stationary Bike', 'Προθέρμανση με στατικό ποδήλατο', 'https://www.youtube.com/results?search_query=stationary+bike+warm+up', warmup_id, 1),
    ('Elliptical Trainer', 'Elliptical Trainer', 'Προθέρμανση με ελλειπτικό μηχάνημα', 'https://www.youtube.com/results?search_query=elliptical+trainer+warm+up', warmup_id, 2),
    ('Treadmill (Διάδρομος)', 'Treadmill', 'Προθέρμανση με διάδρομο', 'https://www.youtube.com/results?search_query=treadmill+warm+up', warmup_id, 3),
    ('Rope Jumping', 'Rope Jumping', 'Προθέρμανση με σχοινάκι', 'https://www.youtube.com/results?search_query=rope+jumping+warm+up', warmup_id, 4),
    ('Jumping Jacks', 'Jumping Jacks', 'Κλασική προθέρμανση με άλματα', 'https://www.youtube.com/results?search_query=jumping+jacks', warmup_id, 5),
    ('Resistance Band Warm-Up', 'Resistance Band Warm-Up', 'Προθέρμανση με ελαστικό ταινία', 'https://www.youtube.com/results?search_query=resistance+band+warm+up', warmup_id, 6)
  ON CONFLICT DO NOTHING;

  -- Insert COOL DOWN Exercises
  INSERT INTO workout_exercises (name, name_english, description, youtube_url, category_id, display_order) VALUES
    ('Treadmill Walk', 'Treadmill Walk', 'Ηρεμιστικός περίπατος στο διάδρομο', 'https://www.youtube.com/results?search_query=treadmill+walk+cool+down', cooldown_id, 1),
    ('Elliptical – Easy Pedaling', 'Elliptical – Easy Pedaling', 'Ελαφρύ ποδήλατο σε ελλειπτικό μηχάνημα', 'https://www.youtube.com/results?search_query=elliptical+easy+pedaling', cooldown_id, 2),
    ('Light Stationary Bike', 'Light Stationary Bike', 'Ελαφρύ ποδήλατο σε στατικό μηχάνημα', 'https://www.youtube.com/results?search_query=light+stationary+bike+cool+down', cooldown_id, 3),
    ('Hamstring Stretch', 'Hamstring Stretch', 'Τέντωμα οπίσθιων μυών μηρού', 'https://www.youtube.com/results?search_query=hamstring+stretch', cooldown_id, 4),
    ('Quadriceps Stretch', 'Quadriceps Stretch', 'Τέντωμα τετρακέφαλων μυών μηρού', 'https://www.youtube.com/results?search_query=quadriceps+stretch', cooldown_id, 5),
    ('Calf Stretch', 'Calf Stretch', 'Τέντωμα γάμπων', 'https://www.youtube.com/results?search_query=calf+stretch', cooldown_id, 6),
    ('Shoulder Stretch', 'Shoulder Stretch', 'Τέντωμα ώμων', 'https://www.youtube.com/results?search_query=shoulder+stretch', cooldown_id, 7),
    ('Triceps Stretch', 'Triceps Stretch', 'Τέντωμα τρικέφαλων', 'https://www.youtube.com/results?search_query=triceps+stretch', cooldown_id, 8),
    ('Back Stretch', 'Back Stretch', 'Τέντωμα ραχιαίων μυών', 'https://www.youtube.com/results?search_query=back+stretch', cooldown_id, 9),
    ('Core Stretch', 'Core Stretch', 'Τέντωμα κοιλιακών μυών', 'https://www.youtube.com/results?search_query=core+stretch', cooldown_id, 10),
    ('Shoulder Rolls / Neck Rolls', 'Shoulder Rolls / Neck Rolls', 'Κυκλικές κινήσεις ώμων και λαιμού', 'https://www.youtube.com/results?search_query=shoulder+rolls+neck+rolls', cooldown_id, 11),
    ('Foam Roller', 'Foam Roller', 'Μασάζ με αφρώδη κυλινδρικό εργαλείο', 'https://www.youtube.com/results?search_query=foam+roller', cooldown_id, 12)
  ON CONFLICT DO NOTHING;

  -- Insert LOWER BACK Exercises
  INSERT INTO workout_exercises (name, name_english, description, youtube_url, category_id, display_order) VALUES
    ('Hyperextensions (Μηχάνημα)', 'Hyperextensions (Machine)', 'Υπερεκτάσεις για ραχιαίους μυς με μηχάνημα', 'https://www.youtube.com/results?search_query=hyperextensions+machine', lowerback_id, 1),
    ('Superman', 'Superman', 'Άσκηση για ραχιαίους μυς σε ξαπλωμένη θέση', 'https://www.youtube.com/results?search_query=superman+exercise+lower+back', lowerback_id, 2),
    ('Floor Back Extension', 'Floor Back Extension', 'Εκτάσεις ραχιαίων μυών στο πάτωμα', 'https://www.youtube.com/results?search_query=floor+back+extension', lowerback_id, 3),
    ('Prone Back Raise', 'Prone Back Raise', 'Ανύψωση σώματος σε πρηνή θέση', 'https://www.youtube.com/results?search_query=prone+back+raise', lowerback_id, 4),
    ('Bird Dog', 'Bird Dog', 'Αντισταθμιστική άσκηση για ραχιαίους μυς', 'https://www.youtube.com/results?search_query=bird+dog+exercise', lowerback_id, 5)
  ON CONFLICT DO NOTHING;

  -- Insert Combined Programs
  INSERT INTO combined_workout_programs (name, name_english, description, program_type, display_order) VALUES
    ('Άνω μέρος σώματος', 'Upper Body', 'Συνδυασμός ασκήσεων για άνω μέρος σώματος', 'upper-body', 1),
    ('Κάτω μέρος σώματος', 'Lower Body', 'Συνδυασμός ασκήσεων για κάτω μέρος σώματος', 'lower-body', 2),
    ('Όλο το σώμα', 'Full Body', 'Συνδυασμός ασκήσεων για όλο το σώμα', 'full-body', 3),
    ('Ελεύθερα βάρη', 'Free Weights', 'Συνδυασμός ασκήσεων με ελεύθερα βάρη', 'free-weights', 4)
  ON CONFLICT DO NOTHING;

END $$;

-- Note: Combined program exercises will need to be added manually through the admin panel
-- or you can add them programmatically here if needed

