/**
 * DATE UTILITIES - TIMEZONE-AWARE HELPERS
 * 
 * CRITICAL: All subscription date logic MUST use UTC
 * Never use browser local time (new Date())
 * 
 * This module provides timezone-safe date operations for membership validation
 * Gym operates in Greece (UTC+2 summer, UTC+3 winter)
 * Database stores all dates in UTC
 * Frontend must always use UTC for consistency
 */

/**
 * Get current date in UTC (YYYY-MM-DD format)
 * SAFE: Always returns UTC, never browser local time
 */
export const getCurrentDateUTC = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // Returns YYYY-MM-DD in UTC
};

/**
 * Get current date in UTC as Date object
 */
export const getCurrentDateUTCObject = (): Date => {
  const now = new Date();
  const utcDateStr = now.toISOString().split('T')[0];
  return new Date(utcDateStr + 'T00:00:00Z');
};

/**
 * Convert any date to UTC date string (YYYY-MM-DD)
 */
export const getDateStringUTC = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Check if membership is currently active
 * 
 * RULE: Active = start_date <= today AND today <= end_date
 * This means:
 * - If end_date = 2026-01-31, membership is active through the entire 31st
 * - Expires at 2026-02-01 00:00:00 UTC
 */
export const isMembershipActive = (
  startDate: string,
  endDate: string,
  currentDate?: string
): boolean => {
  const checkDate = currentDate || getCurrentDateUTC();
  
  // YYYY-MM-DD string comparison works correctly:
  // "2026-01-31" <= "2026-01-31" <= "2026-01-31" = TRUE (active)
  // "2026-01-31" <= "2026-02-01" = FALSE (expired)
  return startDate <= checkDate && checkDate <= endDate;
};

/**
 * Check if membership is expired
 * 
 * Expired = today > end_date
 * Examples:
 * - end_date="2026-01-31", today="2026-01-31" → FALSE (not expired, still active today)
 * - end_date="2026-01-31", today="2026-02-01" → TRUE (expired)
 */
export const isMembershipExpired = (
  endDate: string,
  currentDate?: string
): boolean => {
  const checkDate = currentDate || getCurrentDateUTC();
  // "2026-01-31" < "2026-02-01" = TRUE = EXPIRED
  return endDate < checkDate;
};

/**
 * Check if membership has started yet
 * 
 * Has started = today >= start_date
 */
export const hasMembershipStarted = (
  startDate: string,
  currentDate?: string
): boolean => {
  const checkDate = currentDate || getCurrentDateUTC();
  return checkDate >= startDate;
};

/**
 * Calculate remaining days until expiry
 * 
 * Returns:
 * - Positive number: days remaining
 * - 0: expires today
 * - Negative: already expired
 */
export const getRemainingDays = (
  endDate: string,
  currentDate?: string
): number => {
  const checkDate = currentDate || getCurrentDateUTC();
  const current = new Date(checkDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  const diffMs = end.getTime() - current.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Get day of week for a date (0=Sunday, 6=Saturday)
 */
export const getDayOfWeek = (dateStr: string): number => {
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.getUTCDay();
};

/**
 * Check if a date is a Sunday
 */
export const isSunday = (dateStr: string): boolean => {
  return getDayOfWeek(dateStr) === 0;
};

/**
 * Add days to a date string and return new date string
 */
export const addDaysToDateString = (dateStr: string, days: number): string => {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Get the next Sunday from a given date
 */
export const getNextSunday = (fromDate?: string): string => {
  const date = fromDate ? new Date(fromDate + 'T00:00:00Z') : new Date();
  const dayOfWeek = date.getUTCDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7 || 7; // 0 (Sunday) → 7 days
  date.setUTCDate(date.getUTCDate() + daysUntilSunday);
  return date.toISOString().split('T')[0];
};

/**
 * Format date string for human display
 * Input: YYYY-MM-DD (UTC)
 * Output: Localized string (e.g., "31 Ιανουαρίου 2026" in Greek)
 */
export const formatDateForDisplay = (dateStr: string, locale: string = 'el-GR'): string => {
  try {
    const date = new Date(dateStr + 'T00:00:00Z');
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

/**
 * Validate date string format (YYYY-MM-DD)
 */
export const isValidDateFormat = (dateStr: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
};

/**
 * Parse date string and validate it's a real date
 */
export const isValidDate = (dateStr: string): boolean => {
  if (!isValidDateFormat(dateStr)) return false;
  try {
    const date = new Date(dateStr + 'T00:00:00Z');
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

/**
 * Get membership expiry warning message
 * Returns null if no warning needed
 */
export const getExpiryWarning = (endDate: string, currentDate?: string): string | null => {
  const daysRemaining = getRemainingDays(endDate, currentDate);
  
  if (daysRemaining < 0) {
    return '❌ Expired';
  }
  if (daysRemaining === 0) {
    return '⚠️ Expires today!';
  }
  if (daysRemaining === 1) {
    return '⚠️ Expires tomorrow';
  }
  if (daysRemaining <= 7) {
    return `⚠️ Expires in ${daysRemaining} days`;
  }
  if (daysRemaining <= 30) {
    return `ℹ️ Expires in ${daysRemaining} days`;
  }
  
  return null;
};

/**
 * For testing: Mock the current date
 * WARNING: This is for testing only, never use in production
 */
let mockCurrentDate: Date | null = null;

export const setMockCurrentDate = (date: Date | null): void => {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️ setMockCurrentDate should only be used in tests');
  }
  mockCurrentDate = date;
};

/**
 * For testing: Get mock current date if set
 */
export const getMockCurrentDate = (): Date | null => {
  return mockCurrentDate;
};

/**
 * For testing: Reset mock date
 */
export const resetMockCurrentDate = (): void => {
  mockCurrentDate = null;
};

/**
 * Time range validation for Supabase queries
 * Returns object with formatted dates for use in .gte(), .lte() filters
 */
export const getDateRangeFilters = (
  checkDate?: string
): {
  currentDate: string;
  tomorrowDate: string;
  yesterdayDate: string;
} => {
  const current = checkDate || getCurrentDateUTC();
  
  return {
    currentDate: current,
    tomorrowDate: addDaysToDateString(current, 1),
    yesterdayDate: addDaysToDateString(current, -1),
  };
};
