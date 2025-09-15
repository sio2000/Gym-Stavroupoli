// Test script to verify that personal training users don't see Pilates elements
// Run this in browser console to test

console.log('=== TESTING PERSONAL TRAINING ONLY ===');

// Test 1: Check if user has personal training but no pilates membership
async function testPersonalTrainingOnly() {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No user logged in');
      return;
    }

    // Check memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select(`
        id,
        is_active,
        end_date,
        membership_packages(package_type)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]);

    console.log('Active memberships:', memberships);

    // Check for pilates specifically
    const hasPilatesPackage = memberships && memberships.some(membership => 
      membership.membership_packages?.package_type === 'pilates'
    );
    console.log('Has Pilates package:', hasPilatesPackage);

    // Check for personal training schedule
    const { data: personalSchedule, error: personalErr } = await supabase
      .from('personal_training_schedules')
      .select('id,status')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('Personal training schedule:', personalSchedule);
    console.log('Has personal training:', personalSchedule && personalSchedule.length > 0);

    // Test QR categories
    const { getAvailableQRCategories } = await import('./src/utils/activeMemberships.ts');
    const qrCategories = await getAvailableQRCategories(user.id);
    console.log('Available QR categories:', qrCategories);

    // Check if pilates appears in QR categories
    const hasPilatesQR = qrCategories.some(cat => cat.key === 'pilates');
    console.log('Has Pilates in QR categories:', hasPilatesQR);

    // Summary
    console.log('=== SUMMARY ===');
    console.log('Has Pilates membership:', hasPilatesPackage);
    console.log('Has Personal Training:', personalSchedule && personalSchedule.length > 0);
    console.log('Should show Pilates menu:', hasPilatesPackage);
    console.log('Should show QR codes for Pilates:', hasPilatesQR);
    
    if (personalSchedule && personalSchedule.length > 0 && !hasPilatesPackage) {
      console.log('✅ User has ONLY personal training - should NOT see Pilates elements');
      if (hasPilatesQR) {
        console.log('❌ ERROR: Pilates QR categories are showing for personal training user!');
      } else {
        console.log('✅ GOOD: No Pilates QR categories for personal training user');
      }
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testPersonalTrainingOnly();
