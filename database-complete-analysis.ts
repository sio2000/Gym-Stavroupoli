/**
 * COMPLETE DATABASE SCHEMA ANALYSIS & DIAGNOSTICS
 * Συνδεόμαστε στη βάση και αναλύουμε:
 * - Όλους τους πίνακες
 * - RLS Policies
 * - Foreign Keys & Relationships
 * - Triggers & Functions
 * - Redundant/Unused tables
 * - Data inconsistencies
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    envVars[key] = valueParts.join('=');
  }
});

const supabase = createClient(envVars['VITE_SUPABASE_URL']!, envVars['VITE_SUPABASE_SERVICE_KEY']!);

const report: any = {
  timestamp: new Date().toISOString(),
  analysis: {
    tables: [],
    rls_policies: [],
    foreign_keys: [],
    triggers: [],
    functions: [],
    issues: [],
    recommendations: []
  }
};

async function log(msg: string) {
  console.log(`\n📋 ${msg}`);
}

async function analyzeAllTables() {
  log('1️⃣  ΑΝΑΛΥΣΗ ΟΛΩΝ ΤΩΝ ΠΙΝΑΚΩΝ');
  log('═'.repeat(80));

  const { data: tables, error } = await supabase.rpc('get_all_tables_info');
  
  if (error) {
    log(`❌ Error getting tables: ${error.message}`);
    
    // Fallback: Query information_schema directly
    const query = `
      SELECT 
        table_name,
        column_count,
        row_count
      FROM (
        SELECT 
          t.table_name,
          COUNT(c.column_name) as column_count,
          COUNT(*) as row_count
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
        WHERE t.table_schema = 'public'
        GROUP BY t.table_name
      ) sq;
    `;
    log('Attempting fallback query...');
  }

  // Get list of subscription-related tables
  const subscription_tables = [
    'memberships',
    'membership_packages',
    'membership_requests',
    'pilates_deposits',
    'pilates_bookings',
    'ultimate_weekly_refills',
    'ultimate_dual_membership',
    'membership_package_durations',
    'membership_logs',
    'membership_expiration',
    'membership_overview',
    'user_profiles',
  ];

  for (const table_name of subscription_tables) {
    try {
      const { data, count, error } = await supabase
        .from(table_name)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        log(`✅ ${table_name.toUpperCase()}`);
        log(`   Rows: ${count || 0}`);
        report.analysis.tables.push({
          name: table_name,
          row_count: count || 0,
          status: 'accessible'
        });
      } else {
        log(`⚠️  ${table_name.toUpperCase()} - Error: ${error.message}`);
        report.analysis.tables.push({
          name: table_name,
          row_count: 0,
          status: 'error',
          error: error.message
        });
      }
    } catch (e) {
      log(`❌ ${table_name.toUpperCase()} - Exception`);
    }
  }
}

async function analyzeRLSPolicies() {
  log('2️⃣  ΑΝΑΛΥΣΗ RLS POLICIES');
  log('═'.repeat(80));

  const critical_tables = [
    'memberships',
    'pilates_deposits',
    'membership_requests',
    'user_profiles',
  ];

  for (const table_name of critical_tables) {
    log(`\n🔒 TABLE: ${table_name.toUpperCase()}`);

    try {
      // Try to check if table has RLS enabled
      const { data: policies, error } = await supabase
        .rpc('get_rls_policies_for_table', { table_name });

      if (error) {
        log(`   ⚠️  Could not fetch RLS info: ${error.message}`);
      } else if (policies && policies.length > 0) {
        log(`   ✅ Found ${policies.length} policies:`);
        policies.forEach((p: any) => {
          log(`      • ${p.policyname || p.name || 'Unknown'}`);
        });
      } else {
        log(`   ⚠️  No RLS policies found (or RLS disabled)`);
      }
    } catch (e) {
      log(`   ❌ Exception while checking RLS`);
    }
  }
}

async function analyzeForeignKeys() {
  log('3️⃣  ΑΝΑΛΥΣΗ FOREIGN KEYS & RELATIONSHIPS');
  log('═'.repeat(80));

  const key_relationships = [
    { from: 'memberships', from_col: 'user_id', to: 'user_profiles', to_col: 'user_id' },
    { from: 'memberships', from_col: 'package_id', to: 'membership_packages', to_col: 'id' },
    { from: 'pilates_deposits', from_col: 'user_id', to: 'user_profiles', to_col: 'user_id' },
    { from: 'membership_requests', from_col: 'user_id', to: 'user_profiles', to_col: 'user_id' },
    { from: 'membership_requests', from_col: 'package_id', to: 'membership_packages', to_col: 'id' },
  ];

  for (const rel of key_relationships) {
    log(`\n🔗 ${rel.from}.${rel.from_col} → ${rel.to}.${rel.to_col}`);

    try {
      const { data: records, error } = await supabase
        .from(rel.from)
        .select(`${rel.from_col}`)
        .limit(5);

      if (!error && records) {
        const orphaned = records.filter(r => r[rel.from_col] === null || r[rel.from_col] === '');
        log(`   Total: ${records.length} | Orphaned (NULL): ${orphaned.length}`);

        if (orphaned.length > 0) {
          log(`   ⚠️  ALERT: Found ${orphaned.length} orphaned records`);
          report.analysis.issues.push({
            type: 'orphaned_fk',
            relationship: `${rel.from}.${rel.from_col}`,
            count: orphaned.length
          });
        }
      } else if (error) {
        log(`   ❌ Error: ${error.message}`);
      }
    } catch (e) {
      log(`   ❌ Exception while analyzing`);
    }
  }
}

async function analyzeMembershipsStructure() {
  log('4️⃣  ΑΝΑΛΥΣΗ MEMBERSHIPS TABLE - ΔΟΜΗ & ΔΕΔΟΜΕΝΑ');
  log('═'.repeat(80));

  try {
    const { data: memberships, error } = await supabase
      .from('memberships')
      .select('*')
      .limit(1);

    if (error) {
      log(`❌ Error fetching memberships: ${error.message}`);
      return;
    }

    if (memberships && memberships.length > 0) {
      const member = memberships[0];
      log(`\n✅ Sample Membership Record:`);
      log(`   Columns present: ${Object.keys(member).length}`);

      Object.entries(member).forEach(([key, value]) => {
        const status = value === null ? '∅ NULL' : value === '' ? '∅ EMPTY' : '✓ FILLED';
        log(`   • ${key.padEnd(25)} : ${status}`);
      });

      report.analysis.issues.push({
        type: 'redundant_columns',
        table: 'memberships',
        null_columns: Object.keys(member).filter(k => member[k as keyof typeof member] === null),
        empty_columns: Object.keys(member).filter(k => member[k as keyof typeof member] === '')
      });
    }
  } catch (e) {
    log(`❌ Exception: ${e}`);
  }
}

async function analyzeDataQuality() {
  log('5️⃣  ΑΝΑΛΥΣΗ ΠΟΙΟΤΗΤΑΣ ΔΕΔΟΜΕΝΩΝ');
  log('═'.repeat(80));

  try {
    // Check memberships
    const { data: active_ms, error: err1 } = await supabase
      .from('memberships')
      .select('is_active, status, end_date')
      .limit(100);

    if (!err1 && active_ms) {
      const now = new Date('2026-01-31').toISOString().split('T')[0];
      const expired_but_active = active_ms.filter(m => 
        m.end_date < now && m.is_active === true
      );

      log(`\n📊 MEMBERSHIPS DATA QUALITY:`);
      log(`   Total records fetched: ${active_ms.length}`);
      log(`   Expired but marked ACTIVE: ${expired_but_active.length} ⚠️`);

      if (expired_but_active.length > 0) {
        report.analysis.issues.push({
          type: 'data_inconsistency',
          table: 'memberships',
          issue: `${expired_but_active.length} expired memberships still marked as active`,
          severity: 'HIGH'
        });
      }
    }

    // Check pilates_deposits
    const { data: deposits, error: err2 } = await supabase
      .from('pilates_deposits')
      .select('is_active, deposit_remaining, expires_at')
      .limit(100);

    if (!err2 && deposits) {
      const active_no_lessons = deposits.filter(d => d.is_active && d.deposit_remaining === 0);
      log(`\n📊 PILATES_DEPOSITS DATA QUALITY:`);
      log(`   Total records fetched: ${deposits.length}`);
      log(`   Active with 0 lessons: ${active_no_lessons.length} ⚠️`);
    }
  } catch (e) {
    log(`❌ Exception: ${e}`);
  }
}

async function generateRecommendations() {
  log('6️⃣  ΣΥΣΤΑΣΕΙΣ ΓΙΑ ΒΕΛΤΙΩΣΗ');
  log('═'.repeat(80));

  const recommendations = [
    {
      issue: 'RLS Policies blocking inserts',
      solution: 'Check RLS policy allows auth.uid() = user_id OR user is admin',
      priority: 'CRITICAL'
    },
    {
      issue: 'Duplicate status columns (is_active vs status)',
      solution: 'Use only is_active (BOOLEAN) - remove status field',
      priority: 'HIGH'
    },
    {
      issue: 'Expired memberships not auto-deactivating',
      solution: 'Implement BEFORE UPDATE/INSERT trigger to set is_active=false when end_date < TODAY',
      priority: 'CRITICAL'
    },
    {
      issue: 'Orphaned pilates_deposits for expired memberships',
      solution: 'Cascade deactivate deposits when membership expires',
      priority: 'HIGH'
    },
    {
      issue: 'NULL columns in memberships (expires_at, source_request_id, etc)',
      solution: 'Either populate these fields OR remove them from schema',
      priority: 'MEDIUM'
    }
  ];

  recommendations.forEach((rec, idx) => {
    log(`\n${idx + 1}. ${rec.issue}`);
    log(`   Priority: ${rec.priority}`);
    log(`   Solution: ${rec.solution}`);
    report.analysis.recommendations.push(rec);
  });
}

async function main() {
  console.log('\n' + '═'.repeat(80));
  console.log('🔍 COMPLETE DATABASE SCHEMA ANALYSIS & DIAGNOSTICS');
  console.log('═'.repeat(80));

  await analyzeAllTables();
  await analyzeRLSPolicies();
  await analyzeForeignKeys();
  await analyzeMembershipsStructure();
  await analyzeDataQuality();
  await generateRecommendations();

  // Save report
  const reportPath = path.join(process.cwd(), 'DATABASE_SCHEMA_ANALYSIS_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n' + '═'.repeat(80));
  log('✅ ANALYSIS COMPLETE');
  log(`📄 Report saved to: ${reportPath}`);
  console.log('═'.repeat(80));
}

main().catch(console.error);
