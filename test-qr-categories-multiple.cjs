// Test Multiple QR Categories
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testMultipleQRCategories() {
  console.log('🧪 Testing Multiple QR Categories...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Find users with multiple active memberships
    console.log('1️⃣ Finding users with multiple active memberships...');
    const { data: memberships, error: membershipError } = await supabase
      .from('memberships')
      .select(`
        user_id,
        is_active,
        end_date,
        package_id,
        membership_packages(name, package_type)
      `)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .limit(20);

    if (membershipError) {
      console.log('❌ Error fetching memberships:', membershipError.message);
      return;
    }

    console.log(`✅ Found ${memberships.length} active memberships`);

    // Group memberships by user
    const userMemberships = {};
    memberships.forEach(membership => {
      const userId = membership.user_id;
      if (!userMemberships[userId]) {
        userMemberships[userId] = [];
      }
      userMemberships[userId].push(membership);
    });

    // Find users with multiple different package types
    const usersWithMultipleTypes = Object.keys(userMemberships).filter(userId => {
      const userMems = userMemberships[userId];
      const packageTypes = new Set();
      
      userMems.forEach(mem => {
        const packages = Array.isArray(mem.membership_packages) 
          ? mem.membership_packages 
          : mem.membership_packages ? [mem.membership_packages] : [];
        
        packages.forEach(pkg => {
          packageTypes.add(pkg.package_type);
        });
      });
      
      return packageTypes.size > 1;
    });

    console.log(`✅ Found ${usersWithMultipleTypes.length} users with multiple package types`);

    if (usersWithMultipleTypes.length === 0) {
      console.log('❌ No users with multiple package types found for testing');
      return;
    }

    // 2. Test the first user with multiple types
    const testUserId = usersWithMultipleTypes[0];
    const testMemberships = userMemberships[testUserId];
    
    console.log('\n2️⃣ Testing with user:', testUserId);
    console.log('User memberships:');
    testMemberships.forEach((mem, i) => {
      const packages = Array.isArray(mem.membership_packages) 
        ? mem.membership_packages 
        : mem.membership_packages ? [mem.membership_packages] : [];
      
      packages.forEach(pkg => {
        console.log(`   ${i+1}. ${pkg.name} (${pkg.package_type})`);
      });
    });

    // 3. Test getAvailableQRCategories
    console.log('\n3️⃣ Testing getAvailableQRCategories...');
    
    // Simulate the function logic
    const activeMemberships = testMemberships.map(membership => {
      const packages = Array.isArray(membership.membership_packages) 
        ? membership.membership_packages 
        : membership.membership_packages ? [membership.membership_packages] : [];
      
      const pkg = packages[0];
      return {
        packageType: pkg?.package_type || 'unknown',
        packageName: pkg?.name || 'Unknown'
      };
    });

    console.log('Active memberships for QR:', activeMemberships);

    // Check for Personal Training
    const { data: personalSchedule, error: personalErr } = await supabase
      .from('personal_training_schedules')
      .select('id,status')
      .eq('user_id', testUserId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1);

    const hasPersonalTraining = !personalErr && personalSchedule && personalSchedule.length > 0;
    console.log('Has Personal Training:', hasPersonalTraining);

    // Get unique package types
    const availablePackageTypes = [...new Set(activeMemberships.map(m => m.packageType))];
    console.log('Available package types:', availablePackageTypes);

    // Map to QR categories
    const PACKAGE_TYPE_TO_QR_CATEGORY = {
      'free_gym': { key: 'free_gym', label: 'Ελεύθερο Gym', icon: '🏋️', packageType: 'free_gym' },
      'standard': { key: 'free_gym', label: 'Ελεύθερο Gym', icon: '🏋️', packageType: 'standard' },
      'pilates': { key: 'pilates', label: 'Pilates', icon: '🧘', packageType: 'pilates' },
      'personal_training': { key: 'personal', label: 'Personal Training', icon: '🥊', packageType: 'personal_training' }
    };

    const membershipCategories = availablePackageTypes
      .map(packageType => PACKAGE_TYPE_TO_QR_CATEGORY[packageType])
      .filter(Boolean);

    console.log('Membership categories:', membershipCategories);

    // Add Personal Training if exists
    const availableCategories = [...membershipCategories];
    
    if (hasPersonalTraining) {
      const personalCategory = PACKAGE_TYPE_TO_QR_CATEGORY['personal_training'];
      if (personalCategory && !availableCategories.find(cat => cat.key === 'personal')) {
        availableCategories.push(personalCategory);
      }
    }

    console.log('Final available categories:', availableCategories);
    console.log(`✅ User should see ${availableCategories.length} QR categories for generation`);

    // 4. Test specific scenarios
    console.log('\n4️⃣ Testing specific scenarios...');
    
    // Scenario 1: User with Free Gym + Pilates
    const freeGymPilatesUser = Object.keys(userMemberships).find(userId => {
      const userMems = userMemberships[userId];
      const packageTypes = new Set();
      
      userMems.forEach(mem => {
        const packages = Array.isArray(mem.membership_packages) 
          ? mem.membership_packages 
          : mem.membership_packages ? [mem.membership_packages] : [];
        
        packages.forEach(pkg => {
          packageTypes.add(pkg.package_type);
        });
      });
      
      return packageTypes.has('free_gym') && packageTypes.has('pilates');
    });

    if (freeGymPilatesUser) {
      console.log(`✅ Found user with Free Gym + Pilates: ${freeGymPilatesUser}`);
    }

    // Scenario 2: User with Personal Training + other memberships
    const personalTrainingUser = Object.keys(userMemberships).find(userId => {
      const userMems = userMemberships[userId];
      const packageTypes = new Set();
      
      userMems.forEach(mem => {
        const packages = Array.isArray(mem.membership_packages) 
          ? mem.membership_packages 
          : mem.membership_packages ? [mem.membership_packages] : [];
        
        packages.forEach(pkg => {
          packageTypes.add(pkg.package_type);
        });
      });
      
      return packageTypes.has('personal_training') || packageTypes.has('standard');
    });

    if (personalTrainingUser) {
      console.log(`✅ Found user with Personal Training: ${personalTrainingUser}`);
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testMultipleQRCategories();
