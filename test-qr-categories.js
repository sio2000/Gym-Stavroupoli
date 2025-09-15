// Test script to verify QR categories for personal training users
// Run this in browser console to test

console.log('=== TESTING QR CATEGORIES FOR PERSONAL TRAINING ===');

async function testQRCategories() {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No user logged in');
      return;
    }

    // Test the getAvailableQRCategories function
    const { getAvailableQRCategories } = await import('./src/utils/activeMemberships.ts');
    const qrCategories = await getAvailableQRCategories(user.id);
    
    console.log('=== QR CATEGORIES RESULT ===');
    console.log('Available QR categories:', qrCategories);
    
    // Check what categories are available
    const categoryKeys = qrCategories.map(cat => cat.key);
    console.log('Category keys:', categoryKeys);
    
    // Check for specific categories
    const hasFreeGym = categoryKeys.includes('free_gym');
    const hasPilates = categoryKeys.includes('pilates');
    const hasPersonal = categoryKeys.includes('personal');
    
    console.log('Has Free Gym QR:', hasFreeGym);
    console.log('Has Pilates QR:', hasPilates);
    console.log('Has Personal Training QR:', hasPersonal);
    
    // Check personal training schedule
    const { data: personalSchedule, error: personalErr } = await supabase
      .from('personal_training_schedules')
      .select('id,status')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1);
    
    console.log('Personal training schedule:', personalSchedule);
    console.log('Has personal training:', personalSchedule && personalSchedule.length > 0);
    
    // Summary
    console.log('=== SUMMARY ===');
    if (personalSchedule && personalSchedule.length > 0) {
      console.log('✅ User has Personal Training');
      if (hasPersonal && !hasFreeGym && !hasPilates) {
        console.log('✅ PERFECT: Only Personal Training QR category shown');
      } else {
        console.log('❌ ERROR: Wrong QR categories shown');
        console.log('Expected: Only Personal Training');
        console.log('Got:', categoryKeys);
      }
    } else {
      console.log('ℹ️ User does not have Personal Training');
      console.log('QR categories:', categoryKeys);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testQRCategories();
