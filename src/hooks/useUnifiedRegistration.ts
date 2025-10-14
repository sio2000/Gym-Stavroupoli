/**
 * UNIFIED REGISTRATION HOOK
 * Κεντρική λογική εγγραφής με feature flag και bulletproof profile creation
 */

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { userProfileService, UserProfileData } from '../services/UserProfileService';

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  language?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface RegistrationResult {
  success: boolean;
  user?: any;
  error?: string;
  requiresEmailConfirmation?: boolean;
}

interface UseUnifiedRegistrationReturn {
  register: (data: RegistrationData) => Promise<RegistrationResult>;
  isLoading: boolean;
  error: string | null;
}

// Feature flag - can be controlled via environment variable or config
const USE_BULLETPROOF_REGISTRATION = process.env.REACT_APP_USE_BULLETPROOF_REGISTRATION !== 'false';

export function useUnifiedRegistration(): UseUnifiedRegistrationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: RegistrationData): Promise<RegistrationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[UnifiedRegistration] Starting registration with bulletproof system:', USE_BULLETPROOF_REGISTRATION);
      console.log('[UnifiedRegistration] Registering user:', data.email);

      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone?.trim() || '',
            language: data.language || 'el'
          }
        }
      });

      if (authError) {
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      console.log('[UnifiedRegistration] Auth user created:', authData.user.email);

      // Step 2: Ensure user profile exists
      const userProfileData: UserProfileData = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        language: data.language,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone
      };

      let profileResult;
      
      if (USE_BULLETPROOF_REGISTRATION) {
        // Use bulletproof system
        console.log('[UnifiedRegistration] Using bulletproof profile creation');
        
        // Wait a bit for trigger to potentially create profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try the bulletproof ensure function
        profileResult = await userProfileService.ensureUserProfile(
          authData.user.id,
          userProfileData,
          'registration'
        );

        // If bulletproof system failed, try fallback
        if (!profileResult.success) {
          console.warn('[UnifiedRegistration] Bulletproof system failed, trying fallback:', profileResult.error);
          profileResult = await userProfileService.createUserProfileFallback(
            authData.user.id,
            userProfileData
          );
        }
      } else {
        // Use fallback system (original behavior)
        console.log('[UnifiedRegistration] Using fallback profile creation');
        
        // Wait for trigger
        const profileReady = await userProfileService.waitForProfile(authData.user.id);
        
        if (!profileReady) {
          console.log('[UnifiedRegistration] Trigger did not create profile, creating manually');
          profileResult = await userProfileService.createUserProfileFallback(
            authData.user.id,
            userProfileData
          );
        } else {
          console.log('[UnifiedRegistration] Profile created by trigger');
          profileResult = { success: true, wasCreated: false };
        }
      }

      // Step 3: Handle profile creation result
      if (!profileResult.success) {
        console.error('[UnifiedRegistration] Profile creation failed:', profileResult.error);
        
        // Log the failure but don't fail the entire registration
        // The user can still use the system, and we can retry later
        console.warn('[UnifiedRegistration] Continuing with registration despite profile failure');
        
        // TODO: Add to retry queue or alert system
      } else {
        console.log('[UnifiedRegistration] Profile creation successful');
      }

      // Step 4: Sign out user (they need to confirm email)
      await supabase.auth.signOut();

      console.log('[UnifiedRegistration] Registration completed successfully');

      return {
        success: true,
        user: authData.user,
        requiresEmailConfirmation: !authData.user.email_confirmed_at
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown registration error';
      console.error('[UnifiedRegistration] Registration failed:', errorMessage);
      
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    isLoading,
    error
  };
}
