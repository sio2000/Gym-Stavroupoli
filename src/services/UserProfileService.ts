/**
 * BULLETPROOF USER PROFILE SERVICE
 * Ολοκληρωμένη υπηρεσία για εγγυημένη δημιουργία user profiles
 */

import { supabase } from '../lib/supabase';

export interface UserProfileData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  language?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface EnsureProfileResult {
  success: boolean;
  profile?: any;
  error?: string;
  wasCreated?: boolean;
  retryCount?: number;
}

export interface ProfileStats {
  totalAuthUsers: number;
  totalProfiles: number;
  missingProfiles: number;
  recentFailures: number;
  successRate: number;
  lastUpdated: string;
}

class UserProfileService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000; // 1 second base delay

  /**
   * Ensure user profile exists with comprehensive error handling and retry logic
   */
  async ensureUserProfile(
    userId: string,
    userData: UserProfileData,
    origin: 'registration' | 'manual' | 'backfill' | 'trigger' = 'registration'
  ): Promise<EnsureProfileResult> {
    console.log(`[UserProfileService] Ensuring profile for user ${userId}, origin: ${origin}`);

    let retryCount = 0;
    let lastError: string | undefined;

    while (retryCount < this.MAX_RETRIES) {
      try {
        // Call the database function
        const { data, error } = await supabase.rpc('ensure_user_profile', {
          p_user_id: userId,
          p_email: userData.email,
          p_first_name: userData.firstName,
          p_last_name: userData.lastName,
          p_phone: userData.phone || null,
          p_language: userData.language || 'el',
          p_origin: origin
        });

        if (error) {
          throw new Error(`Database function error: ${error.message}`);
        }

        // Check if result has error flag
        if (data && typeof data === 'object' && 'error' in data && data.error === true) {
          throw new Error(data.message || 'Unknown database error');
        }

        // Success
        console.log(`[UserProfileService] Profile ensured for user ${userId}, retry: ${retryCount}`);
        return {
          success: true,
          profile: data,
          wasCreated: retryCount === 0, // Assume created on first attempt, could be enhanced
          retryCount
        };

      } catch (error) {
        retryCount++;
        lastError = error instanceof Error ? error.message : String(error);
        
        console.warn(`[UserProfileService] Attempt ${retryCount} failed for user ${userId}:`, lastError);

        if (retryCount < this.MAX_RETRIES) {
          // Exponential backoff
          const delay = this.RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
          console.log(`[UserProfileService] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    console.error(`[UserProfileService] All retries failed for user ${userId}:`, lastError);
    return {
      success: false,
      error: lastError,
      retryCount
    };
  }

  /**
   * Create user profile with fallback to manual insertion
   */
  async createUserProfileFallback(
    userId: string,
    userData: UserProfileData
  ): Promise<EnsureProfileResult> {
    console.log(`[UserProfileService] Fallback profile creation for user ${userId}`);

    try {
      // Try the ensure function first
      const result = await this.ensureUserProfile(userId, userData, 'manual');
      if (result.success) {
        return result;
      }

      // Fallback to direct insertion
      console.log(`[UserProfileService] Attempting direct insertion for user ${userId}`);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          email: userData.email,
          first_name: userData.firstName || 'Χρήστης',
          last_name: userData.lastName || 'User',
          phone: userData.phone || null,
          language: userData.language || 'el',
          role: 'user',
          date_of_birth: userData.dateOfBirth || null,
          address: userData.address || null,
          emergency_contact_name: userData.emergencyContactName || null,
          emergency_contact_phone: userData.emergencyContactPhone || null
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`[UserProfileService] Direct insertion successful for user ${userId}`);
      return {
        success: true,
        profile: data,
        wasCreated: true
      };

    } catch (error) {
      console.error(`[UserProfileService] Fallback creation failed for user ${userId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check if user profile exists
   */
  async checkProfileExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error(`[UserProfileService] Error checking profile existence for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get profile statistics for monitoring
   */
  async getProfileStats(): Promise<ProfileStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_profile_stats');

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[UserProfileService] Error getting profile stats:', error);
      return null;
    }
  }

  /**
   * Get audit logs for a user
   */
  async getAuditLogs(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('user_profile_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`[UserProfileService] Error getting audit logs for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Wait for profile to be created (with timeout)
   */
  async waitForProfile(
    userId: string,
    timeoutMs: number = 10000,
    intervalMs: number = 500
  ): Promise<boolean> {
    const start = Date.now();
    
    while (Date.now() - start < timeoutMs) {
      const exists = await this.checkProfileExists(userId);
      if (exists) {
        return true;
      }
      await this.sleep(intervalMs);
    }
    
    return false;
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract user data from auth user metadata
   */
  extractUserDataFromAuth(authUser: any): UserProfileData {
    const metadata = authUser.user_metadata || {};
    
    return {
      email: authUser.email || '',
      firstName: metadata.first_name || '',
      lastName: metadata.last_name || '',
      phone: metadata.phone || null,
      language: metadata.language || 'el'
    };
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();
export default userProfileService;
