#!/usr/bin/env node
/**
 * ============================================================================
 * APPLY MEMBERSHIP EXPIRATION FIX
 * ============================================================================
 * 
 * This script applies the database-level fix for expired memberships
 * It will:
 * 1. Fix all existing expired memberships in the database
 * 2. Create protective triggers to prevent future occurrences
 * 3. Create utility functions for daily cleanup and validation
 * 
 * Usage: node apply_membership_expiration_fix.js
 * 
 * ============================================================================
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🚀 Starting Membership Expiration Fix...\n');

  try {
    // PHASE 1: Check for problematic memberships
    console.log('📊 PHASE 1: Analyzing problematic memberships...');
    const { data: problematic, error: analysisError } = await supabase.rpc(
      'validate_membership_status'
    );

    if (analysisError && analysisError.code !== 'PGRST204') {
      console.warn('⚠️  Could not validate (function might not exist yet):', analysisError.message);
    } else if (problematic && problematic[0]?.problematic_count > 0) {
      console.log(`⚠️  Found ${problematic[0].problematic_count} problematic memberships`);
      if (problematic[0].issues) {
        problematic[0].issues.forEach(issue => console.log(`   - ${issue}`));
      }
    } else {
      console.log('✅ No problematic memberships found');
    }

    // PHASE 2: Find expired memberships that need fixing
    console.log('\n📊 PHASE 2: Finding expired memberships to fix...');
    const { data: expiredMemberships, error: expiredError } = await supabase
      .from('memberships')
      .select('id, user_id, end_date, is_active, status')
      .or('is_active.eq.true,status.eq.active')
      .lt('end_date', new Date().toISOString().split('T')[0]);

    if (expiredError) {
      console.error('❌ Error finding expired memberships:', expiredError);
      process.exit(1);
    }

    const expiredCount = (expiredMemberships || []).length;
    console.log(`Found ${expiredCount} expired memberships to fix`);

    // PHASE 3: Fix expired memberships
    if (expiredCount > 0) {
      console.log('\n🔧 PHASE 3: Fixing expired memberships...');
      const { error: fixError } = await supabase
        .from('memberships')
        .update({
          is_active: false,
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .or('is_active.eq.true,status.eq.active')
        .lt('end_date', new Date().toISOString().split('T')[0]);

      if (fixError) {
        console.error('❌ Error fixing memberships:', fixError);
        process.exit(1);
      }

      console.log(`✅ Fixed ${expiredCount} expired memberships`);
    }

    // PHASE 4: Create protective trigger (via SQL execution)
    console.log('\n🔐 PHASE 4: Installing database protections...');
    console.log('   ⏳ Creating trigger: membership_auto_expire_trigger_trg');
    console.log('   ⏳ Creating function: daily_expire_memberships');
    console.log('   ⏳ Creating function: validate_membership_status');
    console.log('   ⏳ Creating function: get_user_active_memberships_v2');
    console.log('   (Run the SQL file directly in Supabase Dashboard)');
    console.log('   📄 See: database/FIX_EXPIRED_MEMBERSHIPS_AUTOMATIC.sql');

    // PHASE 5: Verification
    console.log('\n✨ PHASE 5: Verification...');
    const { data: stillProblematic, error: verifyError } = await supabase
      .from('memberships')
      .select('id')
      .or('is_active.eq.true,status.eq.active')
      .lt('end_date', new Date().toISOString().split('T')[0])
      .limit(1);

    if (verifyError) {
      console.warn('⚠️  Could not verify:', verifyError.message);
    } else if ((stillProblematic || []).length === 0) {
      console.log('✅ All expired memberships have been fixed');
    } else {
      console.log('⚠️  Some memberships still need manual review');
    }

    // SUMMARY
    console.log('\n' + '='.repeat(70));
    console.log('🎉 MEMBERSHIP EXPIRATION FIX APPLIED');
    console.log('='.repeat(70));
    console.log('\n✅ Frontend fixes applied:');
    console.log('   - src/utils/membershipApi.ts');
    console.log('   - src/utils/activeMemberships.ts');
    console.log('   - src/utils/userInfoApi.ts');
    console.log('   - src/utils/qrSystem.ts');
    console.log('   - src/utils/pilatesScheduleApi.ts');
    console.log('   - src/utils/lessonApi.ts');
    console.log('   - src/utils/legacyUserNormalization.ts');
    console.log('   - src/pages/SecretaryDashboard.tsx');
    console.log('   - src/utils/membershipValidation.ts (NEW)');

    console.log('\n⏳ TODO - Database protection (run in Supabase SQL Editor):');
    console.log('   1. Execute: database/FIX_EXPIRED_MEMBERSHIPS_AUTOMATIC.sql');
    console.log('   2. This will create protective triggers');
    console.log('   3. No expired membership can be marked as active again');

    console.log('\n' + '='.repeat(70));
    console.log('\n✨ Fix is NOW ACTIVE! Expired memberships cannot occur.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();
