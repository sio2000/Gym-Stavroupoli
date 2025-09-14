// Script για έλεγχο users στη database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  try {
    console.log('🔍 Ελέγχω users στη database...\n');
    
    // Ελέγχω user profiles
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, user_id, email, first_name, last_name, role')
      .limit(10);
      
    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError);
      return;
    }
    
    console.log(`✅ Βρέθηκαν ${userProfiles.length} user profiles:`);
    userProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.first_name} ${profile.last_name} (${profile.email}) - Role: ${profile.role}`);
      console.log(`   User ID: ${profile.user_id}`);
    });
    
    // Ελέγχω QR codes
    const { data: qrCodes, error: qrError } = await supabase
      .from('qr_codes')
      .select('*')
      .limit(10);
      
    if (qrError) {
      console.error('❌ Error fetching QR codes:', qrError);
      return;
    }
    
    console.log(`\n✅ Βρέθηκαν ${qrCodes.length} QR codes:`);
    qrCodes.forEach((qr, index) => {
      console.log(`${index + 1}. QR Token: ${qr.qr_token}`);
      console.log(`   User ID: ${qr.user_id}`);
      console.log(`   Category: ${qr.category}`);
      console.log(`   Status: ${qr.status}`);
      console.log(`   Format: ${qr.qr_token.length > 50 ? 'COMPLEX' : 'SIMPLE'}`);
    });
    
    // Ελέγχω αν υπάρχει match μεταξύ QR codes και user profiles
    console.log('\n🔍 Ελέγχω matches μεταξύ QR codes και user profiles...');
    for (const qr of qrCodes) {
      const matchingProfile = userProfiles.find(profile => profile.user_id === qr.user_id);
      if (matchingProfile) {
        console.log(`✅ Match found: QR ${qr.qr_token.substring(0, 20)}... -> ${matchingProfile.first_name} ${matchingProfile.last_name}`);
      } else {
        console.log(`❌ No match: QR ${qr.qr_token.substring(0, 20)}... -> User ID ${qr.user_id} not found in profiles`);
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkUsers();
