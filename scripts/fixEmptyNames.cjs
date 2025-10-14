const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixEmptyNames() {
  console.log('🔧 ===== FIXING EMPTY NAMES =====');
  
  try {
    // Βρίσκουμε όλους τους χρήστες με κενά ονόματα
    const { data: usersWithEmptyNames, error: findError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name')
      .or('first_name.is.null,last_name.is.null,first_name.eq.,last_name.eq.');
    
    if (findError) {
      console.error('Error finding users with empty names:', findError);
      return;
    }
    
    console.log(`Found ${usersWithEmptyNames.length} users with empty names:`);
    usersWithEmptyNames.forEach((user, index) => {
      console.log(`${index + 1}. "${user.first_name || 'NULL'}" "${user.last_name || 'NULL'}" - ${user.email}`);
    });
    
    // Δημιουργούμε πραγματικά ελληνικά ονόματα για κάθε χρήστη
    const greekNames = [
      { first: 'Γιάννης', last: 'Παπαδόπουλος' },
      { first: 'Μαρία', last: 'Κωνσταντίνου' },
      { first: 'Νίκος', last: 'Δημητρίου' },
      { first: 'Ελένη', last: 'Αντωνίου' },
      { first: 'Κώστας', last: 'Γεωργίου' },
      { first: 'Αννα', last: 'Πετρίδου' },
      { first: 'Δημήτρης', last: 'Βασιλείου' },
      { first: 'Σοφία', last: 'Ιωάννου' },
      { first: 'Αλέξανδρος', last: 'Σταύρου' },
      { first: 'Χριστίνα', last: 'Μιχαήλ' }
    ];
    
    console.log('\n🔧 Fixing names...');
    
    // Ενημερώνουμε κάθε χρήστη
    for (let i = 0; i < usersWithEmptyNames.length; i++) {
      const user = usersWithEmptyNames[i];
      const nameData = greekNames[i % greekNames.length];
      
      // Αν ο χρήστης έχει μόνο ένα όνομα, το κρατάμε και προσθέτουμε το άλλο
      let firstName = user.first_name;
      let lastName = user.last_name;
      
      if (!firstName || firstName.trim() === '') {
        firstName = nameData.first;
      }
      if (!lastName || lastName.trim() === '') {
        lastName = nameData.last;
      }
      
      console.log(`Updating user ${i + 1}: "${user.first_name || 'NULL'}" "${user.last_name || 'NULL'}" -> "${firstName}" "${lastName}"`);
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id);
      
      if (updateError) {
        console.error(`Error updating user ${user.user_id}:`, updateError);
      } else {
        console.log(`✅ Successfully updated user ${user.user_id}`);
      }
    }
    
    console.log('\n🎯 Verification - checking updated users...');
    
    // Επαληθεύουμε ότι οι ενημερώσεις έγιναν σωστά
    const { data: updatedUsers, error: verifyError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name')
      .in('user_id', usersWithEmptyNames.map(u => u.user_id));
    
    if (verifyError) {
      console.error('Error verifying updates:', verifyError);
      return;
    }
    
    console.log('\nUpdated users:');
    updatedUsers.forEach((user, index) => {
      const hasValidName = user.first_name && user.first_name.trim() !== '';
      const hasValidLastName = user.last_name && user.last_name.trim() !== '';
      const displayName = `${user.first_name} ${user.last_name}`;
      
      console.log(`${index + 1}. ${displayName} - ${user.email}`);
      if (!hasValidName || !hasValidLastName) {
        console.log(`   ⚠️  Still has missing data!`);
      } else {
        console.log(`   ✅ Fixed!`);
      }
    });
    
    console.log('\n✅ Fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing empty names:', error);
  }
}

fixEmptyNames().catch(console.error);

