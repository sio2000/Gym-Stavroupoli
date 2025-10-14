/**
 * BACKFILL USER PROFILES SCRIPT
 * Ασφαλής script για δημιουργία profiles για υπάρχοντα auth users που δεν έχουν profile
 */

import { createClient } from '@supabase/supabase-js';
import { userProfileService } from '../src/services/UserProfileService';

// Configuration
const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
const MAX_CONCURRENT = 5;

interface BackfillStats {
  totalScanned: number;
  profilesCreated: number;
  profilesSkipped: number;
  profilesFailed: number;
  errors: Array<{ userId: string; error: string }>;
}

class UserProfileBackfill {
  private supabase: any;
  private stats: BackfillStats;

  constructor() {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.stats = {
      totalScanned: 0,
      profilesCreated: 0,
      profilesSkipped: 0,
      profilesFailed: 0,
      errors: []
    };
  }

  /**
   * Main backfill function
   */
  async backfillUserProfiles(dryRun: boolean = true): Promise<BackfillStats> {
    console.log('🚀 Starting User Profile Backfill');
    console.log(`📊 Mode: ${dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);
    console.log(`📦 Batch size: ${BATCH_SIZE}`);
    console.log(`⏱️  Delay between batches: ${DELAY_BETWEEN_BATCHES}ms`);
    console.log('');

    try {
      // Get all auth users missing profiles
      const missingUsers = await this.getMissingProfileUsers();
      console.log(`📋 Found ${missingUsers.length} users without profiles`);

      if (missingUsers.length === 0) {
        console.log('✅ No users need profile creation');
        return this.stats;
      }

      // Process in batches
      const batches = this.chunkArray(missingUsers, BATCH_SIZE);
      console.log(`📦 Processing ${batches.length} batches`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\n🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} users)`);

        await this.processBatch(batch, dryRun);

        // Delay between batches (except for last batch)
        if (i < batches.length - 1) {
          console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
          await this.sleep(DELAY_BETWEEN_BATCHES);
        }
      }

      // Print final statistics
      this.printFinalStats();

      return this.stats;

    } catch (error) {
      console.error('❌ Backfill failed:', error);
      throw error;
    }
  }

  /**
   * Get users that don't have profiles
   */
  private async getMissingProfileUsers(): Promise<any[]> {
    const { data, error } = await this.supabase.rpc('get_missing_profile_users');
    
    if (error) {
      // Fallback query if RPC doesn't exist
      const { data: authUsers, error: authError } = await this.supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .limit(1000);

      if (authError) {
        throw new Error(`Failed to get auth users: ${authError.message}`);
      }

      const { data: profiles, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('user_id');

      if (profileError) {
        throw new Error(`Failed to get profiles: ${profileError.message}`);
      }

      const profileUserIds = new Set(profiles.map((p: any) => p.user_id));
      return authUsers.filter((user: any) => !profileUserIds.has(user.id));
    }

    return data || [];
  }

  /**
   * Process a batch of users
   */
  private async processBatch(batch: any[], dryRun: boolean): Promise<void> {
    const promises = batch.map(user => this.processUser(user, dryRun));
    
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      const user = batch[index];
      
      if (result.status === 'fulfilled') {
        const { created, skipped, failed } = result.value;
        if (created) this.stats.profilesCreated++;
        if (skipped) this.stats.profilesSkipped++;
        if (failed) this.stats.profilesFailed++;
      } else {
        this.stats.profilesFailed++;
        this.stats.errors.push({
          userId: user.id,
          error: result.reason?.message || 'Unknown error'
        });
        console.error(`❌ Failed to process user ${user.email}:`, result.reason);
      }
      
      this.stats.totalScanned++;
    });
  }

  /**
   * Process a single user
   */
  private async processUser(user: any, dryRun: boolean): Promise<{ created: boolean; skipped: boolean; failed: boolean }> {
    try {
      console.log(`👤 Processing user: ${user.email} (${user.id})`);

      // Check if profile already exists (race condition check)
      const profileExists = await userProfileService.checkProfileExists(user.id);
      if (profileExists) {
        console.log(`⏭️  Profile already exists for ${user.email}`);
        return { created: false, skipped: true, failed: false };
      }

      if (dryRun) {
        console.log(`🔍 [DRY RUN] Would create profile for ${user.email}`);
        return { created: true, skipped: false, failed: false };
      }

      // Extract user data from auth metadata
      const userProfileData = userProfileService.extractUserDataFromAuth(user);
      userProfileData.email = user.email; // Ensure email is from auth table

      // Create profile using the bulletproof service
      const result = await userProfileService.ensureUserProfile(
        user.id,
        userProfileData,
        'backfill'
      );

      if (result.success) {
        console.log(`✅ Profile created for ${user.email}`);
        return { created: true, skipped: false, failed: false };
      } else {
        console.error(`❌ Failed to create profile for ${user.email}: ${result.error}`);
        return { created: false, skipped: false, failed: true };
      }

    } catch (error) {
      console.error(`❌ Error processing user ${user.email}:`, error);
      return { created: false, skipped: false, failed: true };
    }
  }

  /**
   * Print final statistics
   */
  private printFinalStats(): void {
    console.log('\n📊 BACKFILL COMPLETED - FINAL STATISTICS');
    console.log('==========================================');
    console.log(`📋 Total users scanned: ${this.stats.totalScanned}`);
    console.log(`✅ Profiles created: ${this.stats.profilesCreated}`);
    console.log(`⏭️  Profiles skipped: ${this.stats.profilesSkipped}`);
    console.log(`❌ Profiles failed: ${this.stats.profilesFailed}`);
    console.log(`📈 Success rate: ${this.calculateSuccessRate()}%`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. User ${error.userId}: ${error.error}`);
      });
    }
    
    console.log('\n🎉 Backfill completed!');
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(): number {
    if (this.stats.totalScanned === 0) return 100;
    const successful = this.stats.profilesCreated + this.stats.profilesSkipped;
    return Math.round((successful / this.stats.totalScanned) * 100);
  }

  /**
   * Utility function to chunk array
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--live');
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('User Profile Backfill Script');
    console.log('Usage: npm run backfill-profiles [--live]');
    console.log('');
    console.log('Options:');
    console.log('  --live    Execute the backfill (default is dry run)');
    console.log('  --help    Show this help message');
    return;
  }

  try {
    const backfill = new UserProfileBackfill();
    const stats = await backfill.backfillUserProfiles(dryRun);
    
    // Exit with error code if there were failures
    if (stats.profilesFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { UserProfileBackfill };
