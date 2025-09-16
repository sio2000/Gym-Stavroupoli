// Test script to check database connection and user profiles
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('\n1. Testing Supabase connection...');
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Test 2: Check user_profiles table structure
    console.log('\n2. Checking user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
      return false;
    }
    
    console.log('✅ user_profiles table accessible');
    console.log(`📊 Found ${profiles.length} profiles`);
    
    // Test 3: Check for profiles with unknown email
    console.log('\n3. Checking for profiles with unknown email...');
    const { data: unknownProfiles, error: unknownError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name, created_at')
      .eq('email', 'unknown@example.com');
    
    if (unknownError) {
      console.error('❌ Error fetching unknown profiles:', unknownError.message);
      return false;
    }
    
    console.log(`📊 Found ${unknownProfiles.length} profiles with unknown email`);
    if (unknownProfiles.length > 0) {
      console.log('⚠️  Profiles with unknown email:');
      unknownProfiles.forEach(profile => {
        console.log(`   - ${profile.user_id}: ${profile.email} (${profile.first_name} ${profile.last_name})`);
      });
    }
    
    // Test 4: Check for profiles with "User" first name
    console.log('\n4. Checking for profiles with "User" first name...');
    const { data: userProfiles, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name, created_at')
      .eq('first_name', 'User');
    
    if (userError) {
      console.error('❌ Error fetching user profiles:', userError.message);
      return false;
    }
    
    console.log(`📊 Found ${userProfiles.length} profiles with "User" first name`);
    if (userProfiles.length > 0) {
      console.log('⚠️  Profiles with "User" first name:');
      userProfiles.forEach(profile => {
        console.log(`   - ${profile.user_id}: ${profile.email} (${profile.first_name} ${profile.last_name})`);
      });
    }
    
    // Test 5: Test safe function
    console.log('\n5. Testing safe function...');
    const { data: safeTest, error: safeError } = await supabase
      .rpc('get_user_profile_safe', {
        p_user_id: '00000000-0000-0000-0000-000000000001'
      });
    
    if (safeError) {
      console.error('❌ Safe function error:', safeError.message);
      return false;
    }
    
    console.log('✅ Safe function accessible');
    console.log('📊 Safe function result:', safeTest ? 'Profile found' : 'No profile');
    
    // Test 6: Check recent profiles
    console.log('\n6. Checking recent profiles...');
    const { data: recentProfiles, error: recentError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (recentError) {
      console.error('❌ Error fetching recent profiles:', recentError.message);
      return false;
    }
    
    console.log('📊 Recent profiles:');
    recentProfiles.forEach(profile => {
      console.log(`   - ${profile.user_id}: ${profile.email} (${profile.first_name} ${profile.last_name}) - ${profile.created_at}`);
    });
    
    console.log('\n✅ All database tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testDatabaseConnection().then(success => {
  if (success) {
    console.log('\n🎉 Database connection test completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Database connection test failed!');
    process.exit(1);
  }
});
