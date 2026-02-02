// ============================================================================
// MEMBERSHIP STATUS VALIDATION UTILITY
// ============================================================================
// Provides a centralized, foolproof way to check if a membership is truly active
// This eliminates the bug where expired memberships show as active
// 
// CRITICAL RULES:
// 1. A membership is ACTIVE only if ALL conditions are true:
//    - is_active = true
//    - status = 'active'
//    - end_date >= TODAY
//    - deleted_at IS NULL
// 2. If ANY condition is false, the membership is NOT active (no exceptions)
// 3. All filtering should use this utility, never custom logic
// 4. Frontend should do SECONDARY checks only (trust database is correct)
// ============================================================================

import { Membership } from '@/types';
// FIX BUG #1 (TIMEZONE) & #2 (MIDNIGHT): Use UTC date utilities
import { isMembershipExpired } from './dateUtils';

/**
 * CORE VALIDATION FUNCTION
 * 
 * Returns true ONLY if membership meets ALL criteria
 * This is the single source of truth for membership status
 */
export const isMembershipTrulyActive = (
  membership: any
): boolean => {
  // Guard: null/undefined check
  if (!membership) return false;

  // Rule 1: is_active must be true
  if (membership.is_active !== true) {
    console.debug(
      '[MembershipValidation] Membership inactive (is_active=false):',
      membership.id
    );
    return false;
  }

  // Rule 2: status must be 'active'
  if (membership.status !== 'active') {
    console.debug(
      '[MembershipValidation] Membership inactive (status!=active):',
      membership.id,
      'status=',
      membership.status
    );
    return false;
  }

  // Rule 3: must not be soft-deleted
  if (membership.deleted_at !== null && membership.deleted_at !== undefined) {
    console.debug(
      '[MembershipValidation] Membership deleted (deleted_at is set):',
      membership.id
    );
    return false;
  }

  // Rule 4: end_date must be >= today (THIS IS THE CRITICAL BUG FIX)
  if (membership.end_date) {
    // FIX BUG #2 (MIDNIGHT): Use UTC date comparison instead of timestamp
    // isMembershipExpired correctly handles the boundary: expired = endDate < today
    if (isMembershipExpired(membership.end_date)) {
      console.debug(
        '[MembershipValidation] Membership expired (end_date in past):',
        membership.id,
        'end_date=',
        membership.end_date
      );
      return false;
    }
  } else {
    // If no end_date, assume expired (conservative approach)
    console.debug(
      '[MembershipValidation] Membership has no end_date:',
      membership.id
    );
    return false;
  }

  // All checks passed
  return true;
};

/**
 * Filter array of memberships to only truly active ones
 * Use this AFTER fetching from database as final safety filter
 */
export const filterActiveMemberships = (
  memberships: any[]
): any[] => {
  if (!Array.isArray(memberships)) return [];

  const active = memberships.filter(isMembershipTrulyActive);

  if (active.length < memberships.length) {
    console.warn(
      '[MembershipValidation] Filtered out',
      memberships.length - active.length,
      'non-active memberships from',
      memberships.length,
      'total'
    );
  }

  return active;
};

/**
 * Days remaining until membership expires
 * Returns negative number if already expired
 */
export const getDaysUntilExpiry = (membership: any): number => {
  if (!membership?.end_date) return -999;

  const endDate = new Date(membership.end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Human-readable expiry status
 */
export const getExpiryWarning = (membership: any): string | null => {
  const days = getDaysUntilExpiry(membership);

  if (days < 0) return '❌ EXPIRED';
  if (days === 0) return '🔴 EXPIRES TODAY';
  if (days <= 3) return `⚠️ EXPIRES IN ${days} DAYS`;
  if (days <= 7) return `⚠️ EXPIRES SOON (${days} days)`;
  if (days <= 30) return `📅 EXPIRES IN ${days} DAYS`;

  return null;
};

/**
 * Validate that a membership query result is consistent
 * Call this to audit data integrity
 */
export const validateMembershipConsistency = (membership: any): {
  isValid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  // Check consistency between is_active and status
  if (membership.is_active && membership.status !== 'active') {
    issues.push(
      `Inconsistency: is_active=true but status='${membership.status}'`
    );
  }

  if (!membership.is_active && membership.status === 'active') {
    issues.push(
      `Inconsistency: is_active=false but status='active'`
    );
  }

  // Check if expired but marked as active
  if (
    membership.end_date &&
    new Date(membership.end_date) < new Date() &&
    (membership.is_active || membership.status === 'active')
  ) {
    issues.push(
      `Consistency ERROR: Membership has end_date in past but is marked as active`
    );
  }

  return {
    isValid: issues.length === 0,
    issues
  };
};
