// Script για διορθωση user profile
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserProfile() {
  try {
    console.log('🔧 Διορθώνω user profile...\n');
    
    const userId = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';
    
    // Ενημερώνω το user profile
    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update({
        first_name: 'Test',
        last_name: 'User',
        email: 'fasewo2498@inupup.com'
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user profile:', error);
      return;
    }

    console.log('✅ User profile updated successfully!');
    console.log('📊 Updated profile data:', updatedProfile);
    
    // Ελέγχω το QR code
    const testToken = `${userId}-personal`;
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('qr_token', testToken)
      .eq('status', 'active')
      .maybeSingle();
      
    if (qrError) {
      console.error('❌ Error finding QR code:', qrError);
    } else if (qrCode) {
      console.log('✅ QR code found!');
      console.log('📊 QR Code data:', qrCode);
      
      console.log(`\n🎯 READY FOR TESTING!`);
      console.log(`📱 QR Token to scan: ${testToken}`);
      console.log(`👤 Expected user: ${updatedProfile.first_name} ${updatedProfile.last_name}`);
      console.log(`📧 Expected email: ${updatedProfile.email}`);
      console.log(`🏷️ Expected category: personal`);
    } else {
      console.log('❌ QR code not found');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

fixUserProfile();
