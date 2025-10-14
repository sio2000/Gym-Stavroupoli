const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Πραγματικά ελληνικά ονόματα και επώνυμα
const realNames = [
  { firstName: 'Γιάννης', lastName: 'Παπαδόπουλος' },
  { firstName: 'Μαρία', lastName: 'Κωνσταντίνου' },
  { firstName: 'Νίκος', lastName: 'Δημητρίου' },
  { firstName: 'Ελένη', lastName: 'Αντωνίου' },
  { firstName: 'Κώστας', lastName: 'Γεωργίου' },
  { firstName: 'Αννα', lastName: 'Πετρίδου' },
  { firstName: 'Δημήτρης', lastName: 'Βασιλείου' },
  { firstName: 'Σοφία', lastName: 'Ιωάννου' },
  { firstName: 'Αλέξανδρος', lastName: 'Χρυσόπουλος' },
  { firstName: 'Ευαγγελία', lastName: 'Μαντατζη' },
  { firstName: 'Χαράλαμπος', lastName: 'Χαριπίδης' },
  { firstName: 'Γιάννης', lastName: 'Κοπανος' },
  { firstName: 'Γεωργία', lastName: 'Καλαιτζιδου' },
  { firstName: 'Maria', lastName: 'Kaltsidi' },
  { firstName: 'Ελευθέριος', lastName: 'Ντούσας' },
  { firstName: 'Παύλος', lastName: 'Μυρωνιδης' },
  { firstName: 'Γεωργιος', lastName: 'Πατσιδης' },
  { firstName: 'Αναστασία', lastName: 'Πιπερίδου' },
  { firstName: 'Grigorios', lastName: 'Spiridis' },
  { firstName: 'Μαγδαληνή', lastName: 'Μόσχου' },
  { firstName: 'Μαρια Νικη', lastName: 'Κυριακιδου' },
  { firstName: 'Alexandra', lastName: 'Ntintou' },
  { firstName: 'Ελευθερία', lastName: 'Τσουρεκα' },
  { firstName: 'Lina', lastName: 'Papad' },
  { firstName: 'Φώτιος', lastName: 'Δαδούπης' },
  { firstName: 'Ευγενια', lastName: 'Ρεντζου' },
  { firstName: 'Ioanna', lastName: 'Toulke' },
  { firstName: 'Ελευθερία', lastName: 'Μπουχούρη' },
  { firstName: 'Νικολετα', lastName: 'Αντριασοβα' },
  { firstName: 'Πολυς', lastName: 'Παλουκης' },
  { firstName: 'Ευαγγελία', lastName: 'Καραγεώργιου' },
  { firstName: 'ΔΗΜΗΤΡΗΣ', lastName: 'ΚΩΣΤΟΠΟΥΛΟΣ' },
  { firstName: 'Χριστίνα', lastName: 'Καλαιτζιδου' },
  { firstName: 'XRISTOS', lastName: 'KOURTIDIS' },
  { firstName: 'ΑΓΓΕΛΟΣ', lastName: 'ΝΤΑΒΑΚΗΣ ΣΑΒΒΙΔΗΣ' },
  { firstName: 'ΠΑΝΑΓΙΩΤΗΣ', lastName: 'ΚΟΥΦΟΥΝΑΚΗΣ' },
  { firstName: 'Αφροδίτη', lastName: 'Καλαπούτη' },
  { firstName: 'Βασίλης', lastName: 'Τρους' },
  { firstName: 'Stefanos', lastName: 'Karamichos' },
  { firstName: 'Νένα', lastName: 'Παπαδοπούλου' },
  { firstName: 'Φωτεινή', lastName: 'Χαραλάμπους' },
  { firstName: 'ΣΟΥΖΑΝΑ', lastName: 'ΔΑΛΛΑ' },
  { firstName: 'Anna', lastName: 'Papadopoulou' }
];

// Πραγματικοί αριθμοί τηλεφώνου (με ελληνικές περιοχές)
const realPhones = [
  '6971234567', '6982345678', '6943456789', '6934567890',
  '6975678901', '6986789012', '6947890123', '6938901234',
  '6979012345', '6980123456', '6941234567', '6932345678',
  '6973456789', '6984567890', '6945678901', '6936789012',
  '6977890123', '6988901234', '6949012345', '6930123456',
  '6971234567', '6982345678', '6943456789', '6934567890',
  '6975678901', '6986789012', '6947890123', '6938901234',
  '6979012345', '6980123456', '6941234567', '6932345678',
  '6973456789', '6984567890', '6945678901', '6936789012',
  '6977890123', '6988901234', '6949012345', '6930123456',
  '6971234567', '6982345678', '6943456789', '6934567890'
];

// Πραγματικά emails (με ελληνικούς domain)
const realEmails = [
  'giannis.papadopoulos@gmail.com', 'maria.konstantinou@gmail.com',
  'nikos.dimitriou@yahoo.gr', 'eleni.antoniou@hotmail.com',
  'kostas.georgiou@gmail.com', 'anna.petridou@yahoo.gr',
  'dimitris.vasileiou@gmail.com', 'sofia.ioannou@hotmail.com',
  'alexandros.chrysopoulos@gmail.com', 'evangelia.mantatzi@yahoo.gr',
  'charalampos.charipidis@gmail.com', 'giannis.kopanos@hotmail.com',
  'georgia.kalaitsidou@gmail.com', 'maria.kaltsidi@yahoo.gr',
  'eleftherios.ntousas@gmail.com', 'pavlos.myronidis@hotmail.com',
  'georgios.patsidis@gmail.com', 'anastasia.piperidou@yahoo.gr',
  'grigorios.spiridis@gmail.com', 'magdalini.moschou@hotmail.com',
  'maria.kyriakidou@gmail.com', 'alexandra.ntintou@yahoo.gr',
  'eleutheria.tsourekas@gmail.com', 'lina.papad@hotmail.com',
  'fotios.dadoupis@gmail.com', 'evgenia.rentzou@yahoo.gr',
  'ioanna.toulke@gmail.com', 'eleutheria.bouchouri@hotmail.com',
  'nikoletta.antriasova@gmail.com', 'polys.paloukis@yahoo.gr',
  'evangelia.karageorgiou@gmail.com', 'dimitris.kostopoulos@hotmail.com',
  'christina.kalaitsidou@gmail.com', 'xristos.kourtidis@yahoo.gr',
  'angelos.ntavakis@gmail.com', 'panagiotis.koufounakis@hotmail.com',
  'afroditi.kalapouti@gmail.com', 'vasilis.trous@yahoo.gr',
  'stefanos.karamichos@gmail.com', 'nena.papadopoulou@hotmail.com',
  'foteini.charalambous@gmail.com', 'souzana.dalla@yahoo.gr',
  'anna.papadopoulou@gmail.com', 'eleni.georgiou@hotmail.com'
];

function getRandomRealData() {
  const nameIndex = Math.floor(Math.random() * realNames.length);
  const phoneIndex = Math.floor(Math.random() * realPhones.length);
  const emailIndex = Math.floor(Math.random() * realEmails.length);
  
  return {
    firstName: realNames[nameIndex].firstName,
    lastName: realNames[nameIndex].lastName,
    phone: realPhones[phoneIndex],
    email: realEmails[emailIndex]
  };
}

async function fixUserProfiles() {
  try {
    console.log('=== ΑΡΧΗΣ ΔΙΟΡΘΩΣΗΣ ΠΡΟΦΙΛΩΝ ΧΡΗΣΤΩΝ ===\n');
    
    // Βρίσκω όλα τα προφίλ με test emails ή άκυρα στοιχεία
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or('email.like.%test%,first_name.like.%test%,last_name.like.%test%,phone.like.%test%,first_name.is.null,last_name.is.null,phone.is.null,phone.eq.');

    if (error) {
      console.error('Σφάλμα στη λήψη δεδομένων:', error);
      return;
    }

    console.log(`Βρέθηκαν ${profiles.length} προφίλ προς διόρθωση\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const profile of profiles) {
      // Παρακάμπτω admin και trainer accounts
      if (profile.role === 'admin' || profile.role === 'trainer') {
        console.log(`Παράκαμψη ${profile.role} account: ${profile.email}`);
        skippedCount++;
        continue;
      }

      // Παρακάμπτω προφίλ που έχουν ήδη καλά στοιχεία
      if (profile.email && 
          !profile.email.includes('test') && 
          !profile.email.includes('@obirah.com') && 
          !profile.email.includes('@merumart.com') &&
          !profile.email.includes('@poesd.com') &&
          !profile.email.includes('@fanwn.com') &&
          !profile.email.includes('@reifide.com') &&
          !profile.email.includes('@ekuali.com') &&
          !profile.email.includes('@ishense.com') &&
          !profile.email.includes('@kwifa.com') &&
          !profile.email.includes('@noidos.com') &&
          !profile.email.includes('@camjoint.com') &&
          !profile.email.includes('@djkux.com') &&
          !profile.email.includes('@bdnets.com') &&
          !profile.email.includes('@fanlvr.com') &&
          !profile.email.includes('@lorkex.com') &&
          !profile.email.includes('@arqsis.com') &&
          !profile.email.includes('@mv6a.com') &&
          !profile.email.includes('@certve.com') &&
          !profile.email.includes('@dextrago.com') &&
          !profile.email.includes('@dpwev.com') &&
          !profile.email.includes('@knilok.com') &&
          !profile.email.includes('@gta5hx.com') &&
          !profile.email.includes('@auslank.com') &&
          profile.first_name && 
          profile.first_name.length > 2 && 
          !profile.first_name.includes('test') &&
          profile.last_name && 
          profile.last_name.length > 2 && 
          !profile.last_name.includes('test')) {
        console.log(`Παράκαμψη καλού προφίλ: ${profile.email}`);
        skippedCount++;
        continue;
      }

      const newData = getRandomRealData();
      
      // Δημιουργώ νέο email που να είναι μοναδικός
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000);
      newData.email = newData.email.replace('@', `_${timestamp}_${randomNum}@`);

      const updateData = {
        email: newData.email,
        first_name: newData.firstName,
        last_name: newData.lastName,
        phone: newData.phone,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (updateError) {
        console.error(`Σφάλμα στην ενημέρωση προφίλ ${profile.id}:`, updateError);
      } else {
        console.log(`✅ Διορθώθηκε: ${profile.email} → ${newData.email} (${newData.firstName} ${newData.lastName})`);
        fixedCount++;
      }

      // Μικρή καθυστέρηση για να μη φορτώσουμε τη βάση
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n=== ΟΛΟΚΛΗΡΩΣΗ ΔΙΟΡΘΩΣΗΣ ===`);
    console.log(`Διορθώθηκαν: ${fixedCount} προφίλ`);
    console.log(`Παρακάμφθηκαν: ${skippedCount} προφίλ`);
    console.log(`Συνολικά επεξεργάστηκαν: ${profiles.length} προφίλ`);

  } catch (error) {
    console.error('Σφάλμα:', error);
  }
}

fixUserProfiles();
