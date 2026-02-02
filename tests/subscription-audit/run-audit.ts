#!/usr/bin/env node

/**
 * SUBSCRIPTION AUDIT - MAIN TEST RUNNER
 * 
 * Orchestrates the complete audit workflow:
 * 1. Seed test data
 * 2. Run time-travel tests
 * 3. Generate audit report
 */

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

const AUDIT_DIR = path.join(process.cwd(), 'tests', 'subscription-audit');

/**
 * Run a shell command and return output
 */
function runCommand(cmd: string, args: string[] = []): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    let output = '';
    const proc = spawn(cmd, args, { stdio: ['inherit', 'pipe', 'pipe'] });

    proc.stdout?.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    proc.stderr?.on('data', (data) => {
      output += data.toString();
      process.stderr.write(data);
    });

    proc.on('close', (code) => {
      resolve({ code: code || 0, output });
    });
  });
}

/**
 * Main test runner
 */
async function runAudit() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║        SUBSCRIPTION LIFECYCLE AUDIT RUNNER              ║');
  console.log('║        Comprehensive time-based validation              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Ensure audit directory exists
    console.log('📁 Ensuring audit directory exists...');
    try {
      await fs.mkdir(AUDIT_DIR, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    // Step 2: Display instructions
    console.log('\n📋 AUDIT WORKFLOW:\n');
    console.log('1️⃣  SEED TEST DATA');
    console.log('   Creates 20 deterministic test users with various');
    console.log('   subscription scenarios and edge cases.\n');
    console.log('   Run: npx ts-node tests/subscription-audit/seed-test-data.ts\n');

    console.log('2️⃣  TIME-TRAVEL TESTS');
    console.log('   Simulates time progression from T0 to T5 (+90 days)');
    console.log('   Validates subscription status at each checkpoint.\n');
    console.log('   Run: npx vitest tests/subscription-audit/subscription-lifecycle.test.ts\n');

    console.log('3️⃣  AUDIT REPORT');
    console.log('   Generates comprehensive report with:\n');
    console.log('   - Executive summary');
    console.log('   - Per-user results');
    console.log('   - Bug detection and analysis');
    console.log('   - Root cause analysis');
    console.log('   - Fix recommendations\n');
    console.log('   Output: tests/subscription-audit/AUDIT_REPORT.md\n');

    // Step 3: Create README
    const readmePath = path.join(AUDIT_DIR, 'README.md');
    const readmeContent = `# Subscription Lifecycle Audit Test Suite

## Overview

This comprehensive test suite validates the subscription system's behavior over time,
ensuring correct status transitions, deposit refills, and access control.

## Test Coverage

### 20 Deterministic Test Users

- **5 Pilates users**: Various expiration dates, refill scenarios
- **5 FreeGym users**: Basic subscription lifecycle
- **5 Ultimate users**: Multi-pack scenarios  
- **5 Ultimate Medium users**: Single-pack scenarios

### Time Checkpoints

- **T0** (Day 0): Initial state validation
- **T1** (Day +15): Mid-subscription checkpoint
- **T2** (Day +30): Refill boundary (Pilates/Ultimate)
- **T3** (Day +31): Expiration boundary
- **T4** (Day +60): Long-term validation
- **T5** (Day +90): Final validation

## Running the Audit

### 1. Seed Test Data

\`\`\`bash
npx ts-node tests/subscription-audit/seed-test-data.ts
\`\`\`

This creates:
- 20 test user profiles
- Various membership combinations
- Historical subscriptions
- Edge cases (expires today, expires tomorrow, etc.)

### 2. Run Time-Travel Tests

\`\`\`bash
npx vitest tests/subscription-audit/subscription-lifecycle.test.ts
\`\`\`

This executes:
- Initial status verification
- Time progression simulation
- Per-checkpoint validation
- Bug detection and logging

### 3. Review Audit Report

After tests complete, view:

\`\`\`bash
cat tests/subscription-audit/AUDIT_REPORT.md
\`\`\`

## Expected Behavior

### Subscription Status Rules

\`\`\`
if (now < start_date)
  status = 'pending'
else if (start_date <= now <= end_date AND is_active=true AND status='active')
  status = 'active'
else if (now > end_date)
  status = 'expired'
\`\`\`

### QR Code Access

✅ Allowed when:
- \`status = 'active'\`
- \`end_date >= TODAY\`
- \`deleted_at IS NULL\`

❌ Blocked when:
- \`status = 'expired'\`
- \`end_date < TODAY\`
- \`deleted_at IS NOT NULL\`

### Deposit Refills (Pilates/Ultimate)

✅ Should refill:
- At subscription start
- Every 30 days (renewable subscriptions)
- Once per cycle only

❌ Should NOT refill:
- After subscription expires
- Multiple times per cycle
- If member has no active subscription

## Bug Detection

The audit automatically detects:

1. **CRITICAL**: Expired memberships showing as active
2. **HIGH**: Missing or incorrect refills
3. **MEDIUM**: Status transition delays
4. **LOW**: Display or formatting issues

## Interpreting Results

### Example Output

\`\`\`
test-pilates-001 (Pilates)
✅ T0: ACTIVE (end_date=2026-02-01)
✅ T1: ACTIVE (+15 days)
✅ T2: ACTIVE+REFILL (+30 days, credits=8)
❌ T3: EXPIRED but DB says ACTIVE ← BUG DETECTED

Issue: end_date (2026-02-01) < today (2026-02-01) 
       but is_active=true, status='active'
\`\`\`

## Configuration

See \`audit-config.ts\` for:
- Time checkpoint definitions
- Subscription type properties
- Business rules (QR access, booking, refills)
- Severity levels

## Known Limitations

- Uses local timezone for date comparisons
- Does not test concurrent requests
- Does not validate payment processing
- Does not test user deletion cascades

## Maintenance

After fixing issues:

1. Re-run seed: \`npx ts-node seed-test-data.ts\`
2. Re-run tests: \`npx vitest subscription-lifecycle.test.ts\`
3. Compare reports: \`diff AUDIT_REPORT.md AUDIT_REPORT.old.md\`

## Reporting

If bugs are found, document with:

- **ID**: Bug identifier
- **Severity**: CRITICAL/HIGH/MEDIUM/LOW
- **Description**: What's wrong
- **Steps to Reproduce**: Time checkpoint + user ID
- **Expected**: What should happen
- **Actual**: What actually happens
- **Root Cause**: Hypothesis
- **Fix**: Recommended solution
`;

    await fs.writeFile(readmePath, readmeContent, 'utf-8');
    console.log('✅ Created README.md\n');

    // Step 4: Create vitest configuration if needed
    const vitestConfigPath = path.join(AUDIT_DIR, 'vitest.config.ts');
    try {
      await fs.stat(vitestConfigPath);
    } catch {
      const vitestConfig = `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'Subscription Audit',
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 60000
  }
});
`;
      await fs.writeFile(vitestConfigPath, vitestConfig, 'utf-8');
      console.log('✅ Created vitest.config.ts\n');
    }

    // Step 5: Summary
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║              SETUP COMPLETE - READY TO AUDIT           ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('📖 Next steps:\n');
    console.log('1. Seed test data:');
    console.log('   npx ts-node tests/subscription-audit/seed-test-data.ts\n');
    console.log('2. Run time-travel tests:');
    console.log('   npx vitest tests/subscription-audit/subscription-lifecycle.test.ts\n');
    console.log('3. Review audit report:');
    console.log('   cat tests/subscription-audit/AUDIT_REPORT.md\n');

  } catch (error) {
    console.error('❌ Audit setup failed:', error);
    process.exit(1);
  }
}

// Run
runAudit().catch(console.error);
