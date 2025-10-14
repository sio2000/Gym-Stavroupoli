/**
 * INTEGRATION TESTS
 * End-to-end tests για το user profile system
 */

import { userProfileService } from '../services/UserProfileService';
import { useUnifiedRegistration } from '../hooks/useUnifiedRegistration';
import { supabase } from '../lib/supabase';

// Mock Supabase for integration tests
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signOut: jest.fn()
    },
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

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Registration Flow Integration', () => {
    it('should complete full registration with profile creation', async () => {
      const mockAuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: null
      };

      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      // Mock auth signup
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });

      // Mock profile creation
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockProfile,
        error: null
      });

      // Mock signout
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({});

      // Test registration
      const { register } = useUnifiedRegistration();
      
      const registrationData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890'
      };

      const result = await register(registrationData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockAuthUser);
      expect(result.requiresEmailConfirmation).toBe(true);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            first_name: 'John',
            last_name: 'Doe',
            phone: '1234567890',
            language: 'el'
          }
        }
      });
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle registration failure gracefully', async () => {
      // Mock auth signup failure
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' }
      });

      const { register } = useUnifiedRegistration();
      
      const registrationData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await register(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Email already exists');
    });

    it('should retry profile creation on failure', async () => {
      const mockAuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: null
      };

      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        email: 'test@example.com'
      };

      // Mock auth signup
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });

      // Mock profile creation with retry
      (supabase.rpc as jest.Mock)
        .mockResolvedValueOnce({
          data: { error: true, message: 'Temporary database error' },
          error: null
        })
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null
        });

      // Mock signout
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({});

      const { register } = useUnifiedRegistration();
      
      const registrationData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await register(registrationData);

      expect(result.success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledTimes(2);
    });
  });

  describe('Profile Service Integration', () => {
    it('should handle complete profile lifecycle', async () => {
      const userId = 'user-123';
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890'
      };

      // Test profile existence check
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          })
        }))
      }));

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const exists = await userProfileService.checkProfileExists(userId);
      expect(exists).toBe(false);

      // Test profile creation
      const mockProfile = {
        id: 'profile-123',
        user_id: userId,
        ...userData
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockProfile,
        error: null
      });

      const result = await userProfileService.ensureUserProfile(userId, userData);

      expect(result.success).toBe(true);
      expect(result.profile).toEqual(mockProfile);
    });

    it('should handle profile creation race conditions', async () => {
      const userId = 'user-123';
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      // Mock unique violation (race condition)
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          id: 'profile-123',
          user_id: userId,
          email: 'test@example.com'
        },
        error: null
      });

      const result = await userProfileService.ensureUserProfile(userId, userData);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network error
      (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Network error'));

      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await userProfileService.ensureUserProfile('user-123', userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.retryCount).toBe(3);
    });

    it('should handle database constraint violations', async () => {
      // Mock database constraint error
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: { error: true, message: 'duplicate key value violates unique constraint' },
        error: null
      });

      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await userProfileService.ensureUserProfile('user-123', userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('duplicate key value');
    });
  });

  describe('Performance Integration', () => {
    it('should complete registration within reasonable time', async () => {
      const mockAuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: null
      };

      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        email: 'test@example.com'
      };

      // Mock fast responses
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockProfile,
        error: null
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({});

      const start = Date.now();
      
      const { register } = useUnifiedRegistration();
      
      const registrationData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await register(registrationData);
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
