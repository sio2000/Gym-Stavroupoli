// Test Personal Training Package Locking
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testPersonalTrainingLock() {
  console.log('🧪 Testing Personal Training Package Locking...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Find users with Personal Training memberships
    console.log('1️⃣ Finding users with Personal Training memberships...');
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
      .limit(10);

    if (membershipError) {
      console.log('❌ Error fetching memberships:', membershipError.message);
      return;
    }

    console.log(`✅ Found ${memberships.length} active memberships`);

    // Find Personal Training memberships
    const personalTrainingMemberships = memberships.filter(m => {
      const packages = Array.isArray(m.membership_packages) 
        ? m.membership_packages 
        : m.membership_packages ? [m.membership_packages] : [];
      
      return packages.some(pkg => 
        pkg.package_type === 'personal_training' || 
        pkg.name === 'Personal Training'
      );
    });

    console.log(`✅ Found ${personalTrainingMemberships.length} Personal Training memberships`);

    if (personalTrainingMemberships.length === 0) {
      console.log('❌ No Personal Training memberships found for testing');
      return;
    }

    // 2. Test the first Personal Training membership
    const testMembership = personalTrainingMemberships[0];
    const userId = testMembership.user_id;
    
    console.log('\n2️⃣ Testing with user:', userId);
    console.log('Membership details:', {
      package_id: testMembership.package_id,
      package_name: testMembership.membership_packages?.name,
      package_type: testMembership.membership_packages?.package_type,
      is_active: testMembership.is_active,
      end_date: testMembership.end_date
    });

    // 3. Test getUserActiveMemberships
    console.log('\n3️⃣ Testing getUserActiveMemberships...');
    const { data: activeMemberships, error: activeError } = await supabase
      .from('memberships')
      .select(`
        id,
        package_id,
        is_active,
        start_date,
        end_date,
        membership_packages(
          id,
          name,
          package_type
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('end_date', { ascending: false });

    if (activeError) {
      console.log('❌ Error fetching active memberships:', activeError.message);
    } else {
      console.log(`✅ Found ${activeMemberships.length} active memberships for user`);
      
      activeMemberships.forEach((membership, i) => {
        const packages = Array.isArray(membership.membership_packages) 
          ? membership.membership_packages 
          : membership.membership_packages ? [membership.membership_packages] : [];
        
        packages.forEach(pkg => {
          console.log(`   ${i+1}. Package: ${pkg.name} (${pkg.package_type})`);
        });
      });
    }

    // 4. Test Personal Training package locking logic
    console.log('\n4️⃣ Testing Personal Training package locking logic...');
    
    // Simulate the locking logic from Membership.tsx
    const mockPersonalTrainingPackage = {
      id: 'mock-personal-training',
      name: 'Personal Training'
    };

    const isLocked = activeMemberships.some(m => {
      const packages = Array.isArray(m.membership_packages) 
        ? m.membership_packages 
        : m.membership_packages ? [m.membership_packages] : [];
      
      return packages.some(pkg => 
        pkg.name === 'Personal Training' || 
        pkg.package_type === 'personal_training' ||
        pkg.package_type === 'standard'
      );
    });

    console.log(`✅ Personal Training package should be locked: ${isLocked ? 'YES' : 'NO'}`);

    if (isLocked) {
      console.log('✅ User has active Personal Training membership - package should be locked');
    } else {
      console.log('❌ User does not have active Personal Training membership - package should be unlocked');
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testPersonalTrainingLock();
