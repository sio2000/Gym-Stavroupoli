import { describe, it, expect } from 'vitest';
import { isInstallmentsEligible } from '@/utils/installmentsEligibility';

describe('Installments Eligibility', () => {
  describe('Ultimate Package', () => {
    it('should be eligible for installments with any duration', () => {
      expect(isInstallmentsEligible('Ultimate', 'ultimate_1year')).toBe(true);
      expect(isInstallmentsEligible('Ultimate', 'any_duration')).toBe(true);
    });
  });

  describe('Free Gym Package', () => {
    it('should be eligible for 6 months (semester)', () => {
      expect(isInstallmentsEligible('Free Gym', 'semester')).toBe(true);
    });

    it('should be eligible for 1 year', () => {
      expect(isInstallmentsEligible('Free Gym', 'year')).toBe(true);
    });

    it('should NOT be eligible for other durations', () => {
      expect(isInstallmentsEligible('Free Gym', 'month')).toBe(false);
      expect(isInstallmentsEligible('Free Gym', 'lesson')).toBe(false);
      expect(isInstallmentsEligible('Free Gym', '3 Μήνες')).toBe(false);
    });
  });

  describe('Pilates Package', () => {
    it('should be eligible for 25 lessons (6 months)', () => {
      expect(isInstallmentsEligible('Pilates', 'pilates_6months')).toBe(true);
    });

    it('should be eligible for 50 lessons (1 year)', () => {
      expect(isInstallmentsEligible('Pilates', 'pilates_1year')).toBe(true);
    });

    it('should NOT be eligible for other durations', () => {
      expect(isInstallmentsEligible('Pilates', 'pilates_trial')).toBe(false);
      expect(isInstallmentsEligible('Pilates', 'pilates_1month')).toBe(false);
      expect(isInstallmentsEligible('Pilates', 'pilates_2months')).toBe(false);
      expect(isInstallmentsEligible('Pilates', 'pilates_3months')).toBe(false);
    });
  });

  describe('Other Packages', () => {
    it('should NOT be eligible for Personal Training', () => {
      expect(isInstallmentsEligible('Personal Training', 'any_duration')).toBe(false);
    });

    it('should NOT be eligible for unknown packages', () => {
      expect(isInstallmentsEligible('Unknown Package', 'any_duration')).toBe(false);
    });
  });
});
