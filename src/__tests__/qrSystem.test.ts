import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateQRToken, validateQRToken, generateQRCode, validateQRCode } from '../utils/qrSystem';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn()
          }))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn()
        }))
      }))
    }))
  }))
};

// Mock the supabase import
vi.mock('../config/supabase', () => ({
  supabase: mockSupabase
}));

describe('QR System', () => {
  const mockUserId = '2bf5fc31-2b64-4778-aecf-06d90abfd80d';
  const mockCategory = 'free_gym';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateQRToken', () => {
    it('should generate unique tokens with timestamp', () => {
      const token1 = generateQRToken('', mockUserId, mockCategory);
      const token2 = generateQRToken('', mockUserId, mockCategory);
      
      expect(token1).toContain(mockUserId);
      expect(token1).toContain(mockCategory);
      expect(token1).not.toBe(token2);
      expect(token1.split('-')).toHaveLength(3);
    });

    it('should handle missing category', () => {
      const token = generateQRToken('', mockUserId);
      expect(token).toContain(mockUserId);
      expect(token).toContain('default');
    });
  });

  describe('validateQRToken', () => {
    it('should validate tokens that start with userId', () => {
      const token = generateQRToken('', mockUserId, mockCategory);
      expect(validateQRToken(token, '', mockUserId, mockCategory)).toBe(true);
    });

    it('should reject tokens that do not start with userId', () => {
      const token = 'different-user-id-category-123456';
      expect(validateQRToken(token, '', mockUserId, mockCategory)).toBe(false);
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code for free_gym', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });

      // Mock no existing QR code
      mockSupabase.from().select().eq().eq().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful insert
      const mockQRCode = {
        id: 'qr-id-123',
        user_id: mockUserId,
        category: 'free_gym',
        status: 'active',
        qr_token: `${mockUserId}-free_gym-1234567890`,
        issued_at: new Date().toISOString(),
        expires_at: null,
        last_scanned_at: null,
        scan_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockQRCode,
        error: null
      });

      const result = await generateQRCode(mockUserId, 'free_gym');
      
      expect(result.qrCode).toEqual(mockQRCode);
      expect(result.qrData).toContain(mockUserId);
      expect(result.qrData).toContain('free_gym');
    });

    it('should generate QR code for pilates', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });

      // Mock no existing QR code
      mockSupabase.from().select().eq().eq().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful insert
      const mockQRCode = {
        id: 'qr-id-456',
        user_id: mockUserId,
        category: 'pilates',
        status: 'active',
        qr_token: `${mockUserId}-pilates-1234567890`,
        issued_at: new Date().toISOString(),
        expires_at: null,
        last_scanned_at: null,
        scan_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockQRCode,
        error: null
      });

      const result = await generateQRCode(mockUserId, 'pilates');
      
      expect(result.qrCode).toEqual(mockQRCode);
      expect(result.qrData).toContain(mockUserId);
      expect(result.qrData).toContain('pilates');
    });

    it('should generate QR code for personal training', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });

      // Mock no existing QR code
      mockSupabase.from().select().eq().eq().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful insert
      const mockQRCode = {
        id: 'qr-id-789',
        user_id: mockUserId,
        category: 'personal',
        status: 'active',
        qr_token: `${mockUserId}-personal-1234567890`,
        issued_at: new Date().toISOString(),
        expires_at: null,
        last_scanned_at: null,
        scan_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockQRCode,
        error: null
      });

      const result = await generateQRCode(mockUserId, 'personal');
      
      expect(result.qrCode).toEqual(mockQRCode);
      expect(result.qrData).toContain(mockUserId);
      expect(result.qrData).toContain('personal');
    });

    it('should return existing QR code if one exists', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });

      // Mock existing QR code
      const existingQRCode = {
        id: 'existing-qr-id',
        user_id: mockUserId,
        category: 'free_gym',
        status: 'active',
        qr_token: `${mockUserId}-free_gym-1234567890`,
        issued_at: new Date().toISOString(),
        expires_at: null,
        last_scanned_at: null,
        scan_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.from().select().eq().eq().eq().maybeSingle.mockResolvedValue({
        data: existingQRCode,
        error: null
      });

      const result = await generateQRCode(mockUserId, 'free_gym');
      
      expect(result.qrCode).toEqual(existingQRCode);
      expect(result.qrData).toContain(mockUserId);
    });

    it('should throw error for unauthenticated user', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      await expect(generateQRCode(mockUserId, 'free_gym')).rejects.toThrow('User not authenticated');
    });

    it('should throw error for user ID mismatch', async () => {
      // Mock authenticated user with different ID
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'different-user-id' } },
        error: null
      });

      await expect(generateQRCode(mockUserId, 'free_gym')).rejects.toThrow('User ID mismatch');
    });
  });

  describe('validateQRCode', () => {
    it('should validate QR code successfully', async () => {
      const qrData = `${mockUserId}-free_gym-1234567890`;
      
      // Mock feature flag enabled
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { is_enabled: true },
        error: null
      });

      // Mock QR code found
      const mockQRCode = {
        id: 'qr-id-123',
        user_id: mockUserId,
        category: 'free_gym',
        status: 'active',
        qr_token: qrData,
        issued_at: new Date().toISOString(),
        expires_at: null,
        last_scanned_at: null,
        scan_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.from().select().eq().eq().maybeSingle.mockResolvedValue({
        data: mockQRCode,
        error: null
      });

      // Mock update scan info
      mockSupabase.from().update().eq.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock log scan attempt
      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await validateQRCode(qrData, 'entrance');
      
      expect(result.result).toBe('approved');
      expect(result.user_id).toBe(mockUserId);
      expect(result.category).toBe('free_gym');
    });

    it('should reject QR code with invalid format', async () => {
      const qrData = 'invalid-format';
      
      const result = await validateQRCode(qrData, 'entrance');
      
      expect(result.result).toBe('rejected');
      expect(result.reason).toBe('invalid_format');
    });

    it('should reject QR code when system is disabled', async () => {
      const qrData = `${mockUserId}-free_gym-1234567890`;
      
      // Mock feature flag disabled
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { is_enabled: false },
        error: null
      });

      const result = await validateQRCode(qrData, 'entrance');
      
      expect(result.result).toBe('rejected');
      expect(result.reason).toBe('system_disabled');
    });

    it('should reject expired QR code', async () => {
      const qrData = `${mockUserId}-free_gym-1234567890`;
      
      // Mock feature flag enabled
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { is_enabled: true },
        error: null
      });

      // Mock expired QR code
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 25); // 25 hours ago

      const mockQRCode = {
        id: 'qr-id-123',
        user_id: mockUserId,
        category: 'free_gym',
        status: 'active',
        qr_token: qrData,
        issued_at: new Date().toISOString(),
        expires_at: expiredDate.toISOString(),
        last_scanned_at: null,
        scan_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.from().select().eq().eq().maybeSingle.mockResolvedValue({
        data: mockQRCode,
        error: null
      });

      // Mock update to expired status
      mockSupabase.from().update().eq.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await validateQRCode(qrData, 'entrance');
      
      expect(result.result).toBe('rejected');
      expect(result.reason).toBe('expired');
    });
  });
});