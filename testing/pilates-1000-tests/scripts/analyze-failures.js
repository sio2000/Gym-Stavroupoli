const fs = require('fs');
const path = require('path');

const resultsFile = path.join(__dirname, '../results/test-results-1000-2025-10-24.json');
const data = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  FAILURE ANALYSIS - 1000 TEST RESULTS                       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`Total Failures: ${data.failures.length}\n`);

// Group by error/skip reason
const byReason = {};
data.failures.forEach(f => {
  const reason = f.error || f.details?.skipped || 'Unknown';
  byReason[reason] = (byReason[reason] || 0) + 1;
});

console.log('Failures by Reason:');
Object.entries(byReason)
  .sort((a, b) => b[1] - a[1])
  .forEach(([reason, count]) => {
    console.log(`  ${count.toString().padStart(4)} - ${reason}`);
  });

console.log('\n' + '='.repeat(60) + '\n');

// Show first 5 failures
console.log('First 5 Failures (Details):\n');
data.failures.slice(0, 5).forEach((f, i) => {
  console.log(`${i + 1}. Test ID: ${f.test_id}`);
  console.log(`   Category: ${f.category}`);
  console.log(`   Action: ${f.action}`);
  console.log(`   Error: ${f.error || 'N/A'}`);
  console.log(`   Skipped: ${f.details?.skipped || 'N/A'}`);
  console.log('');
});

// P0 Failures
console.log('='.repeat(60));
console.log(`\n🚨 P0 Failures: ${data.p0_failures.length}`);
if (data.p0_failures.length > 0) {
  console.log('\nCRITICAL ISSUES:');
  data.p0_failures.forEach((f, i) => {
    console.log(`${i + 1}. ${f.test_id}: ${f.error}`);
  });
} else {
  console.log('✅ NO P0 FAILURES - The bug is NOT reproduced!\n');
}

console.log('='.repeat(60) + '\n');

// Summary
const passRate = ((data.summary.passed / (data.summary.passed + data.summary.failed)) * 100).toFixed(2);
console.log('Summary:');
console.log(`  Pass Rate: ${passRate}%`);
console.log(`  P0 Failures: ${data.p0_failures.length}`);
console.log(`  Bug Reproduced: ${data.p0_failures.length > 0 ? 'YES ❌' : 'NO ✅'}`);
console.log('');

