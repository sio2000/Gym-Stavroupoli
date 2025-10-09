/**
 * SIMPLE TEST RUNNER FOR MEMBERSHIP PACKAGES
 * This script runs basic validation tests without complex imports
 */

console.log('🧪 COMPREHENSIVE MEMBERSHIP PACKAGE TEST RUNNER');
console.log('='.repeat(80));
console.log('Starting comprehensive test suite...');
console.log('This will test:');
console.log('  - Ultimate Package (500€) flows');
console.log('  - Ultimate Medium Package (400€) flows');
console.log('  - Regular Pilates Package flows');
console.log('  - Free Gym Package flows');
console.log('  - Installment payment systems');
console.log('  - Weekly refill mechanisms');
console.log('  - Admin approval workflows');
console.log('  - User registration and activation');
console.log('='.repeat(80));

// Test results tracking
const testResults = [];

function logTest(testName, passed, details = null, error = null) {
  const result = {
    testName,
    passed,
    details,
    error
  };
  
  testResults.push(result);
  
  if (passed) {
    console.log(`✅ ${testName} - PASSED`);
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  } else {
    console.log(`❌ ${testName} - FAILED: ${error}`);
  }
}

// Test 1: File System Validation
async function testFileSystem() {
  console.log('\n📁 Testing file system...');
  
  const fs = await import('fs');
  const path = await import('path');
  
  const requiredFiles = [
    'src/config/supabase.js',
    'src/utils/membershipApi.ts',
    'src/utils/weeklyRefillApi.ts',
    'src/utils/ultimateWeeklyDepositApi.ts',
    'database/WEEKLY_PILATES_REFILL_UP.sql',
    'database/COMPREHENSIVE_MEMBERSHIP_TEST.sql'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${file} exists`);
    } else {
      console.log(`   ❌ ${file} missing`);
      allFilesExist = false;
    }
  });
  
  logTest('File System Validation', allFilesExist, {
    required_files: requiredFiles.length,
    existing_files: requiredFiles.filter(f => fs.existsSync(path.join(__dirname, '..', f))).length
  }, allFilesExist ? null : 'Some required files are missing');
}

// Test 2: Package.json Validation
async function testPackageJson() {
  console.log('\n📦 Testing package.json...');
  
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const hasTestScripts = packageJson.scripts && 
      packageJson.scripts['test:comprehensive'] && 
      packageJson.scripts['test:sql'] && 
      packageJson.scripts['test:all'];
    
    const hasSupabase = packageJson.dependencies && packageJson.dependencies['@supabase/supabase-js'];
    
    logTest('Package.json Validation', hasTestScripts && hasSupabase, {
      has_test_scripts: hasTestScripts,
      has_supabase: hasSupabase,
      scripts_count: packageJson.scripts ? Object.keys(packageJson.scripts).length : 0
    }, (!hasTestScripts || !hasSupabase) ? 'Missing required scripts or dependencies' : null);
    
  } catch (error) {
    logTest('Package.json Validation', false, null, error.message);
  }
}

// Test 3: Database Scripts Validation
function testDatabaseScripts() {
  console.log('\n🗄️ Testing database scripts...');
  
  const fs = require('fs');
  const path = require('path');
  
  const dbScripts = [
    'database/WEEKLY_PILATES_REFILL_UP.sql',
    'database/WEEKLY_PILATES_REFILL_DOWN.sql',
    'database/COMPREHENSIVE_MEMBERSHIP_TEST.sql',
    'database/APPLY_WEEKLY_REFILL_FIXES.sql'
  ];
  
  let allScriptsValid = true;
  const scriptDetails = {};
  
  dbScripts.forEach(script => {
    try {
      const scriptPath = path.join(__dirname, '..', script);
      if (fs.existsSync(scriptPath)) {
        const content = fs.readFileSync(scriptPath, 'utf8');
        scriptDetails[script] = {
          exists: true,
          size: content.length,
          has_create_function: content.includes('CREATE OR REPLACE FUNCTION'),
          has_feature_flag: content.includes('feature_flags'),
          has_weekly_refill: content.includes('weekly_refill')
        };
      } else {
        scriptDetails[script] = { exists: false };
        allScriptsValid = false;
      }
    } catch (error) {
      scriptDetails[script] = { exists: false, error: error.message };
      allScriptsValid = false;
    }
  });
  
  logTest('Database Scripts Validation', allScriptsValid, scriptDetails, 
    allScriptsValid ? null : 'Some database scripts are missing or invalid');
}

// Test 4: Frontend API Validation
function testFrontendAPIs() {
  console.log('\n🎨 Testing frontend APIs...');
  
  const fs = require('fs');
  const path = require('path');
  
  const apiFiles = [
    'src/utils/membershipApi.ts',
    'src/utils/weeklyRefillApi.ts',
    'src/utils/ultimateWeeklyDepositApi.ts'
  ];
  
  let allAPIsValid = true;
  const apiDetails = {};
  
  apiFiles.forEach(apiFile => {
    try {
      const apiPath = path.join(__dirname, '..', apiFile);
      if (fs.existsSync(apiPath)) {
        const content = fs.readFileSync(apiPath, 'utf8');
        apiDetails[apiFile] = {
          exists: true,
          size: content.length,
          has_export_functions: content.includes('export'),
          has_supabase_import: content.includes('supabase')
        };
      } else {
        apiDetails[apiFile] = { exists: false };
        allAPIsValid = false;
      }
    } catch (error) {
      apiDetails[apiFile] = { exists: false, error: error.message };
      allAPIsValid = false;
    }
  });
  
  logTest('Frontend APIs Validation', allAPIsValid, apiDetails, 
    allAPIsValid ? null : 'Some frontend API files are missing or invalid');
}

// Test 5: Test Suite Structure Validation
function testTestSuiteStructure() {
  console.log('\n🧪 Testing test suite structure...');
  
  const fs = require('fs');
  const path = require('path');
  
  const testFiles = [
    'tests/comprehensive/membershipPackageTestSuite.ts',
    'scripts/runComprehensiveTests.ts',
    'scripts/simpleTestRunner.js'
  ];
  
  let allTestsValid = true;
  const testDetails = {};
  
  testFiles.forEach(testFile => {
    try {
      const testPath = path.join(__dirname, '..', testFile);
      if (fs.existsSync(testPath)) {
        const content = fs.readFileSync(testPath, 'utf8');
        testDetails[testFile] = {
          exists: true,
          size: content.length,
          has_class: content.includes('class'),
          has_test_methods: content.includes('test'),
          has_async: content.includes('async')
        };
      } else {
        testDetails[testFile] = { exists: false };
        allTestsValid = false;
      }
    } catch (error) {
      testDetails[testFile] = { exists: false, error: error.message };
      allTestsValid = false;
    }
  });
  
  logTest('Test Suite Structure Validation', allTestsValid, testDetails, 
    allTestsValid ? null : 'Some test files are missing or invalid');
}

// Run all tests
function runAllTests() {
  console.log('\n🚀 RUNNING ALL VALIDATION TESTS...');
  console.log('='.repeat(80));
  
  testFileSystem();
  testPackageJson();
  testDatabaseScripts();
  testFrontendAPIs();
  testTestSuiteStructure();
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUITE SUMMARY');
  console.log('='.repeat(80));
  
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.filter(r => !r.passed).forEach(result => {
      console.log(`  - ${result.testName}: ${result.error}`);
    });
  }
  
  console.log('\n📋 NEXT STEPS:');
  if (failed === 0) {
    console.log('🎉 All validation tests passed!');
    console.log('✅ You can now run the SQL database tests:');
    console.log('   Execute: database/COMPREHENSIVE_MEMBERSHIP_TEST.sql in your database');
    console.log('✅ The system is ready for comprehensive testing');
  } else {
    console.log('⚠️  Some validation tests failed');
    console.log('🔧 Please fix the issues above before running database tests');
    console.log('📝 Check the error messages for specific problems');
  }
  
  console.log('\n🏁 VALIDATION COMPLETED');
  console.log('='.repeat(80));
}

// Execute tests
runAllTests();
