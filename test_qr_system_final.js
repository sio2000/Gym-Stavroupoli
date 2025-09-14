// Manual Test Script for QR System
// This script tests the QR system functionality
// Run this in the browser console after logging in

console.log('🧪 Starting QR System Manual Tests...');

// Test 1: Check if QR system is enabled
async function testQRSystemEnabled() {
  console.log('\n📋 Test 1: Checking if QR system is enabled...');
  
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('is_enabled')
      .eq('name', 'FEATURE_QR_SYSTEM')
      .single();
    
    if (error) {
      console.error('❌ Error checking feature flag:', error);
      return false;
    }
    
    console.log('✅ Feature flag status:', data?.is_enabled);
    return data?.is_enabled;
  } catch (error) {
    console.error('❌ Error in test 1:', error);
    return false;
  }
}

// Test 2: Generate QR codes for all activities
async function testGenerateQRCodes() {
  console.log('\n📋 Test 2: Generating QR codes for all activities...');
  
  const activities = ['free_gym', 'pilates', 'personal'];
  const results = {};
  
  for (const activity of activities) {
    console.log(`\n🔧 Testing ${activity}...`);
    
    try {
      // Import the generateQRCode function
      const { generateQRCode } = await import('./src/utils/qrSystem.ts');
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ User not authenticated');
        continue;
      }
      
      console.log(`👤 User ID: ${user.id}`);
      
      // Generate QR code
      const result = await generateQRCode(user.id, activity);
      
      console.log(`✅ ${activity} QR code generated successfully:`);
      console.log(`   QR ID: ${result.qrCode.id}`);
      console.log(`   QR Token: ${result.qrData}`);
      console.log(`   Status: ${result.qrCode.status}`);
      
      results[activity] = {
        success: true,
        qrCode: result.qrCode,
        qrData: result.qrData
      };
      
    } catch (error) {
      console.error(`❌ Error generating ${activity} QR code:`, error);
      results[activity] = {
        success: false,
        error: error.message
      };
    }
  }
  
  return results;
}

// Test 3: Validate QR codes
async function testValidateQRCodes(qrResults) {
  console.log('\n📋 Test 3: Validating QR codes...');
  
  const results = {};
  
  for (const [activity, data] of Object.entries(qrResults)) {
    if (!data.success) {
      console.log(`⏭️ Skipping ${activity} - generation failed`);
      continue;
    }
    
    console.log(`\n🔍 Validating ${activity} QR code...`);
    
    try {
      // Import the validateQRCode function
      const { validateQRCode } = await import('./src/utils/qrSystem.ts');
      
      // Validate QR code
      const result = await validateQRCode(data.qrData, 'entrance');
      
      console.log(`✅ ${activity} QR code validation result:`);
      console.log(`   Result: ${result.result}`);
      console.log(`   Reason: ${result.reason}`);
      console.log(`   User ID: ${result.user_id}`);
      console.log(`   Category: ${result.category}`);
      
      results[activity] = {
        success: true,
        validationResult: result
      };
      
    } catch (error) {
      console.error(`❌ Error validating ${activity} QR code:`, error);
      results[activity] = {
        success: false,
        error: error.message
      };
    }
  }
  
  return results;
}

// Test 4: Check database entries
async function testDatabaseEntries() {
  console.log('\n📋 Test 4: Checking database entries...');
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ User not authenticated');
      return false;
    }
    
    // Get all QR codes for user
    const { data: qrCodes, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching QR codes:', error);
      return false;
    }
    
    console.log(`✅ Found ${qrCodes.length} QR codes for user:`);
    
    qrCodes.forEach((qr, index) => {
      console.log(`\n   QR Code ${index + 1}:`);
      console.log(`     ID: ${qr.id}`);
      console.log(`     Category: ${qr.category}`);
      console.log(`     Status: ${qr.status}`);
      console.log(`     Token: ${qr.qr_token}`);
      console.log(`     Created: ${new Date(qr.created_at).toLocaleString()}`);
      console.log(`     Scans: ${qr.scan_count}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error in test 4:', error);
    return false;
  }
}

// Test 5: Test QR token format
function testQRTokenFormat(qrResults) {
  console.log('\n📋 Test 5: Testing QR token format...');
  
  for (const [activity, data] of Object.entries(qrResults)) {
    if (!data.success) {
      console.log(`⏭️ Skipping ${activity} - generation failed`);
      continue;
    }
    
    console.log(`\n🔍 Testing ${activity} token format...`);
    
    const token = data.qrData;
    const parts = token.split('-');
    
    console.log(`   Token: ${token}`);
    console.log(`   Parts: ${parts.length}`);
    console.log(`   Part 1 (User ID): ${parts[0]}`);
    console.log(`   Part 2 (Category): ${parts[1]}`);
    console.log(`   Part 3 (Timestamp): ${parts[2]}`);
    
    // Validate format
    const isValidFormat = parts.length === 3 && 
                         parts[0].length === 36 && // UUID length
                         parts[1] === activity &&
                         !isNaN(parts[2]);
    
    console.log(`   ✅ Valid format: ${isValidFormat}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive QR system tests...\n');
  
  const results = {
    systemEnabled: false,
    qrGeneration: {},
    qrValidation: {},
    databaseCheck: false,
    tokenFormat: true
  };
  
  // Test 1: System enabled
  results.systemEnabled = await testQRSystemEnabled();
  
  if (!results.systemEnabled) {
    console.log('\n❌ QR system is not enabled. Please enable it first.');
    return results;
  }
  
  // Test 2: Generate QR codes
  results.qrGeneration = await testGenerateQRCodes();
  
  // Test 3: Validate QR codes
  results.qrValidation = await testValidateQRCodes(results.qrGeneration);
  
  // Test 4: Database entries
  results.databaseCheck = await testDatabaseEntries();
  
  // Test 5: Token format
  testQRTokenFormat(results.qrGeneration);
  
  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('================');
  console.log(`System Enabled: ${results.systemEnabled ? '✅' : '❌'}`);
  console.log(`Database Check: ${results.databaseCheck ? '✅' : '❌'}`);
  
  console.log('\nQR Generation Results:');
  for (const [activity, data] of Object.entries(results.qrGeneration)) {
    console.log(`  ${activity}: ${data.success ? '✅' : '❌'}`);
    if (!data.success) {
      console.log(`    Error: ${data.error}`);
    }
  }
  
  console.log('\nQR Validation Results:');
  for (const [activity, data] of Object.entries(results.qrValidation)) {
    console.log(`  ${activity}: ${data.success ? '✅' : '❌'}`);
    if (!data.success) {
      console.log(`    Error: ${data.error}`);
    }
  }
  
  // Overall result
  const allGenerationSuccessful = Object.values(results.qrGeneration).every(r => r.success);
  const allValidationSuccessful = Object.values(results.qrValidation).every(r => r.success);
  
  console.log('\n🎯 OVERALL RESULT:');
  if (results.systemEnabled && allGenerationSuccessful && allValidationSuccessful && results.databaseCheck) {
    console.log('✅ ALL TESTS PASSED! QR system is working correctly.');
  } else {
    console.log('❌ SOME TESTS FAILED. Please check the errors above.');
  }
  
  return results;
}

// Export for manual testing
window.testQRSystem = runAllTests;

console.log('✅ QR System test functions loaded. Run testQRSystem() to start testing.');
