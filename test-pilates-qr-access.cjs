// Test Pilates QR Access
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testPilatesQRAccess() {
  console.log('🧪 Testing Pilates QR Access...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Find a user with Pilates membership
    console.log('1️⃣ Finding user with Pilates membership...');
    const { data: memberships, error: membershipError } = await supabase
      .from('memberships')
      .select(`
        user_id,
        is_active,
        end_date,
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

    // Find Pilates memberships
    const pilatesMemberships = memberships.filter(m => {
      const packages = Array.isArray(m.membership_packages) 
        ? m.membership_packages 
        : m.membership_packages ? [m.membership_packages] : [];
      
      return packages.some(pkg => 
        pkg.package_type === 'pilates' || 
        pkg.name === 'Pilates' || 
        pkg.name === 'Πιλάτες'
      );
    });

    console.log(`✅ Found ${pilatesMemberships.length} Pilates memberships`);

    if (pilatesMemberships.length === 0) {
      console.log('❌ No Pilates memberships found for testing');
      return;
    }

    // 2. Test the first Pilates membership
    const testMembership = pilatesMemberships[0];
    const userId = testMembership.user_id;
    
    console.log('\n2️⃣ Testing with user:', userId);
    console.log('Membership packages:', testMembership.membership_packages);

    // 3. Test getUserActiveMembershipsForQR
    console.log('\n3️⃣ Testing getUserActiveMembershipsForQR...');
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

    // 4. Test QR code generation eligibility
    console.log('\n4️⃣ Testing QR code generation eligibility...');
    const { data: qrMemberships, error: qrError } = await supabase
      .from('memberships')
      .select(`
        id,
        is_active,
        end_date,
        membership_packages(package_type)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]);

    if (qrError) {
      console.log('❌ Error fetching QR memberships:', qrError.message);
    } else {
      console.log(`✅ Found ${qrMemberships.length} memberships for QR check`);
      
      const pilatesMembership = qrMemberships.find(m => {
        const packages = Array.isArray(m.membership_packages) 
          ? m.membership_packages 
          : m.membership_packages ? [m.membership_packages] : [];
        
        return packages.some(pkg => pkg.package_type === 'pilates');
      });

      if (pilatesMembership) {
        console.log('✅ User has Pilates membership for QR generation');
      } else {
        console.log('❌ User does not have Pilates membership for QR generation');
      }
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testPilatesQRAccess();
