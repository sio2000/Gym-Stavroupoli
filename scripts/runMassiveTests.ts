/**
 * MASSIVE TEST RUNNER - 2000+ SCENARIOS
 * This script runs the massive test suite with comprehensive reporting
 */

import { MassiveTestSuite } from '../tests/massive/MassiveTestSuite.js';

async function runMassiveTests() {
  console.log('🚀 MASSIVE TEST SUITE RUNNER - 2000+ SCENARIOS');
  console.log('=' .repeat(100));
  console.log('This massive test suite will execute:');
  console.log('  📝 200+ User Registration & Authentication scenarios');
  console.log('  💳 500+ Subscription Request flows');
  console.log('  ✅ 300+ Admin Approval workflows');
  console.log('  💪 400+ Personal Training & Booking scenarios');
  console.log('  💰 300+ Treasury & Points System flows');
  console.log('  👩‍💼 300+ Secretary & User Management scenarios');
  console.log('  🔄 200+ Weekly Refill System tests');
  console.log('  🎯 TOTAL: 2000+ comprehensive test scenarios');
  console.log('=' .repeat(100));
  console.log('⚠️  WARNING: This will create thousands of test records!');
  console.log('✅ All test data will be automatically cleaned up after execution');
  console.log('⏱️  Estimated execution time: 15-30 minutes');
  console.log('=' .repeat(100));

  const startTime = Date.now();

  try {
    const massiveTestSuite = new MassiveTestSuite();
    const results = await massiveTestSuite.runMassiveTests();

    const totalExecutionTime = Date.now() - startTime;
    const minutes = Math.floor(totalExecutionTime / 60000);
    const seconds = Math.floor((totalExecutionTime % 60000) / 1000);

    // Final comprehensive report
    console.log('\n' + '=' .repeat(100));
    console.log('🏆 FINAL COMPREHENSIVE REPORT');
    console.log('=' .repeat(100));
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`🎯 Total Scenarios Executed: ${results.length}`);
    console.log(`✅ Successful Scenarios: ${passed}`);
    console.log(`❌ Failed Scenarios: ${failed}`);
    console.log(`📈 Overall Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
    console.log(`⏱️  Total Execution Time: ${minutes}m ${seconds}s`);
    console.log(`🚀 Average Speed: ${(results.length / (totalExecutionTime / 1000)).toFixed(2)} scenarios/second`);
    
    // Detailed category analysis
    const categories = [...new Set(results.map(r => r.category))];
    console.log('\n📊 DETAILED CATEGORY ANALYSIS:');
    console.log('-' .repeat(80));
    
    categories.forEach(category => {
      const categoryResults = results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.passed).length;
      const categoryFailed = categoryResults.filter(r => !r.passed).length;
      const categorySuccessRate = ((categoryPassed / categoryResults.length) * 100).toFixed(1);
      const avgTime = categoryResults.reduce((sum, r) => sum + r.executionTime, 0) / categoryResults.length;
      
      console.log(`\n📁 ${category}:`);
      console.log(`   Scenarios: ${categoryResults.length}`);
      console.log(`   Success Rate: ${categorySuccessRate}% (${categoryPassed}/${categoryResults.length})`);
      console.log(`   Avg Execution Time: ${avgTime.toFixed(2)}ms`);
      
      if (categoryFailed > 0) {
        const topFailures = categoryResults.filter(r => !r.passed).slice(0, 3);
        console.log(`   Top Failures:`);
        topFailures.forEach(failure => {
          console.log(`     - ${failure.subcategory}: ${failure.error}`);
        });
      }
    });

    // Performance analysis
    console.log('\n⚡ PERFORMANCE ANALYSIS:');
    console.log('-' .repeat(80));
    
    const executionTimes = results.map(r => r.executionTime);
    const fastest = Math.min(...executionTimes);
    const slowest = Math.max(...executionTimes);
    const median = executionTimes.sort((a, b) => a - b)[Math.floor(executionTimes.length / 2)];
    
    console.log(`🚀 Fastest Scenario: ${fastest}ms`);
    console.log(`🐌 Slowest Scenario: ${slowest}ms`);
    console.log(`📊 Median Execution Time: ${median}ms`);
    console.log(`⚖️  Execution Time Variance: ${Math.sqrt(executionTimes.reduce((sum, time) => sum + Math.pow(time - (executionTimes.reduce((a, b) => a + b) / executionTimes.length), 2), 0) / executionTimes.length).toFixed(2)}ms`);

    // System health assessment
    console.log('\n🏥 SYSTEM HEALTH ASSESSMENT:');
    console.log('-' .repeat(80));
    
    if (failed === 0) {
      console.log('🟢 EXCELLENT: All 2000+ scenarios passed successfully!');
      console.log('✅ System is performing flawlessly');
      console.log('🎉 Ready for production deployment');
    } else if (failed <= results.length * 0.01) {
      console.log('🟡 GOOD: Less than 1% failure rate');
      console.log('✅ System is performing well with minor issues');
      console.log('🔧 Consider reviewing failed scenarios');
    } else if (failed <= results.length * 0.05) {
      console.log('🟠 FAIR: Less than 5% failure rate');
      console.log('⚠️  System has some issues that need attention');
      console.log('🔧 Review failed scenarios before production');
    } else {
      console.log('🔴 POOR: More than 5% failure rate');
      console.log('❌ System has significant issues');
      console.log('🚨 Do not deploy to production');
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-' .repeat(80));
    
    if (failed > 0) {
      const errorCategories = {};
      results.filter(r => !r.passed).forEach(result => {
        const errorType = result.error?.split(':')[0] || 'Unknown';
        errorCategories[errorType] = (errorCategories[errorType] || 0) + 1;
      });
      
      const topErrors = Object.entries(errorCategories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      console.log('🔧 Top issues to investigate:');
      topErrors.forEach(([error, count]) => {
        console.log(`   - ${error}: ${count} occurrences`);
      });
    }
    
    console.log('\n📈 Next steps:');
    if (failed === 0) {
      console.log('   🎉 Deploy to production with confidence');
      console.log('   📊 Monitor system performance in production');
      console.log('   🔄 Schedule regular test suite execution');
    } else {
      console.log('   🔍 Investigate failed scenarios');
      console.log('   🛠️  Fix identified issues');
      console.log('   🔄 Re-run test suite after fixes');
      console.log('   📋 Document lessons learned');
    }

    console.log('\n🏁 MASSIVE TEST SUITE EXECUTION COMPLETED');
    console.log('=' .repeat(100));
    
    if (failed === 0) {
      console.log('🎊 CONGRATULATIONS! All 2000+ scenarios passed!');
      process.exit(0);
    } else {
      console.log('⚠️  Some scenarios failed. Please review the report above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 CRITICAL ERROR: Massive test suite failed to run');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the massive tests
runMassiveTests().catch(console.error);
