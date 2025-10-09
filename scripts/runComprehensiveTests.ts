/**
 * SCRIPT TO RUN COMPREHENSIVE MEMBERSHIP TESTS
 * This script runs the full test suite and outputs results
 */

import { MembershipTestSuite } from '../tests/comprehensive/membershipPackageTestSuite.js';

async function runTests() {
  console.log('🧪 COMPREHENSIVE MEMBERSHIP PACKAGE TEST RUNNER');
  console.log('=' .repeat(80));
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
  console.log('=' .repeat(80));

  try {
    const testSuite = new MembershipTestSuite();
    const results = await testSuite.runAllTests();

    // Detailed results
    console.log('\n📋 DETAILED TEST RESULTS:');
    console.log('=' .repeat(80));
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.testName}`);
      console.log(`   Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (result.details) {
        console.log('   Details:');
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`     ${key}: ${JSON.stringify(value)}`);
        });
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Final summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log('\n' + '=' .repeat(80));
    console.log('🏁 FINAL SUMMARY');
    console.log('=' .repeat(80));
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System is working correctly.');
      console.log('✅ Ultimate packages create dual memberships');
      console.log('✅ Pilates deposits are created and managed');
      console.log('✅ Weekly refill system is functional');
      console.log('✅ Admin approval workflows work');
      console.log('✅ Installment payments are supported');
      console.log('✅ All subscription types are properly handled');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED! Please review the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 CRITICAL ERROR: Test suite failed to run');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);
