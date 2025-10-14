/**
 * USER PROFILE SERVICE TESTS
 * Unit tests για την UserProfileService
 */

import { userProfileService, UserProfileData } from '../services/UserProfileService';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

describe('UserProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureUserProfile', () => {
    it('should create profile successfully on first attempt', async () => {
      const mockProfile = {
        id: 'profile-id',
        user_id: 'user-id',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: mockProfile,
        error: null
      });

      const userData: UserProfileData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890'
      };

      const result = await userProfileService.ensureUserProfile('user-id', userData);

      expect(result.success).toBe(true);
      expect(result.profile).toEqual(mockProfile);
      expect(result.wasCreated).toBe(true);
      expect(result.retryCount).toBe(0);
    });

    it('should handle database function error', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const userData: UserProfileData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await userProfileService.ensureUserProfile('user-id', userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database function error');
    });

    it('should handle error response from database function', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: { error: true, message: 'Profile creation failed' },
        error: null
      });

      const userData: UserProfileData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await userProfileService.ensureUserProfile('user-id', userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Profile creation failed');
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockProfile = {
        id: 'profile-id',
        user_id: 'user-id',
        email: 'test@example.com'
      };

      // First two calls fail, third succeeds
      (supabase.rpc as jest.Mock)
        .mockResolvedValueOnce({
          data: { error: true, message: 'Temporary error' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { error: true, message: 'Temporary error' },
          error: null
        })
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null
        });

      const userData: UserProfileData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await userProfileService.ensureUserProfile('user-id', userData);

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(2);
      expect(supabase.rpc).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      // All calls fail
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: { error: true, message: 'Persistent error' },
        error: null
      });

      const userData: UserProfileData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await userProfileService.ensureUserProfile('user-id', userData);

      expect(result.success).toBe(false);
      expect(result.retryCount).toBe(3);
      expect(supabase.rpc).toHaveBeenCalledTimes(3);
    });
  });

  describe('createUserProfileFallback', () => {
    it('should create profile using direct insertion when ensure fails', async () => {
      const mockProfile = {
        id: 'profile-id',
        user_id: 'user-id',
        email: 'test@example.com'
      };

      // Ensure function fails
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: { error: true, message: 'Ensure function failed' },
        error: null
      });

      // Direct insertion succeeds
      const mockInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        }))
      }));

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      });

      const userData: UserProfileData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await userProfileService.createUserProfileFallback('user-id', userData);

      expect(result.success).toBe(true);
      expect(result.profile).toEqual(mockProfile);
      expect(result.wasCreated).toBe(true);
    });

    it('should handle fallback insertion error', async () => {
      // Ensure function fails
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: { error: true, message: 'Ensure function failed' },
        error: null
      });

      // Direct insertion also fails
      const mockInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Insertion failed' }
          })
        }))
      }));

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      });

      const userData: UserProfileData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await userProfileService.createUserProfileFallback('user-id', userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insertion failed');
    });
  });

  describe('checkProfileExists', () => {
    it('should return true when profile exists', async () => {
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'profile-id' },
            error: null
          })
        }))
      }));

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const result = await userProfileService.checkProfileExists('user-id');

      expect(result).toBe(true);
    });

    it('should return false when profile does not exist', async () => {
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } // No rows returned
          })
        }))
      }));

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const result = await userProfileService.checkProfileExists('user-id');

      expect(result).toBe(false);
    });

    it('should return false on other errors', async () => {
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        }))
      }));

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const result = await userProfileService.checkProfileExists('user-id');

      expect(result).toBe(false);
    });
  });

  describe('getProfileStats', () => {
    it('should return profile statistics', async () => {
      const mockStats = {
        totalAuthUsers: 100,
        totalProfiles: 95,
        missingProfiles: 5,
        recentFailures: 2,
        successRate: 95,
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: mockStats,
        error: null
      });

      const result = await userProfileService.getProfileStats();

      expect(result).toEqual(mockStats);
    });

    it('should return null on error', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await userProfileService.getProfileStats();

      expect(result).toBe(null);
    });
  });

  describe('extractUserDataFromAuth', () => {
    it('should extract user data from auth user metadata', () => {
      const authUser = {
        email: 'test@example.com',
        user_metadata: {
          first_name: 'John',
          last_name: 'Doe',
          phone: '1234567890',
          language: 'en'
        }
      };

      const result = userProfileService.extractUserDataFromAuth(authUser);

      expect(result).toEqual({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
        language: 'en'
      });
    });

    it('should handle missing metadata', () => {
      const authUser = {
        email: 'test@example.com',
        user_metadata: {}
      };

      const result = userProfileService.extractUserDataFromAuth(authUser);

      expect(result).toEqual({
        email: 'test@example.com',
        firstName: '',
        lastName: '',
        phone: null,
        language: 'el'
      });
    });

    it('should handle null metadata', () => {
      const authUser = {
        email: 'test@example.com',
        user_metadata: null
      };

      const result = userProfileService.extractUserDataFromAuth(authUser);

      expect(result).toEqual({
        email: 'test@example.com',
        firstName: '',
        lastName: '',
        phone: null,
        language: 'el'
      });
    });
  });

  describe('waitForProfile', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return true when profile exists immediately', async () => {
      jest.spyOn(userProfileService, 'checkProfileExists').mockResolvedValue(true);

      const promise = userProfileService.waitForProfile('user-id');
      const result = await promise;

      expect(result).toBe(true);
      expect(userProfileService.checkProfileExists).toHaveBeenCalledTimes(1);
    });

    it('should return true when profile is created within timeout', async () => {
      jest.spyOn(userProfileService, 'checkProfileExists')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const promise = userProfileService.waitForProfile('user-id', 5000, 1000);
      
      // Fast-forward time to simulate waiting
      jest.advanceTimersByTime(3000);
      
      const result = await promise;

      expect(result).toBe(true);
      expect(userProfileService.checkProfileExists).toHaveBeenCalledTimes(3);
    });

    it('should return false when timeout is reached', async () => {
      jest.spyOn(userProfileService, 'checkProfileExists').mockResolvedValue(false);

      const promise = userProfileService.waitForProfile('user-id', 2000, 500);
      
      // Fast-forward past timeout
      jest.advanceTimersByTime(3000);
      
      const result = await promise;

      expect(result).toBe(false);
    });
  });
});
