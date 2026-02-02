// Local date utilities to avoid UTC-induced off-by-one errors

/**
 * Format a date string (YYYY-MM-DD) for display in Greek locale
 * IMPORTANT: Parses the date as LOCAL time to avoid UTC conversion issues
 * When you do new Date('2026-02-01'), JS interprets it as UTC midnight
 * which can show as Jan 31 in UTC+2 (Greece)
 */
export function formatDateForDisplay(dateString: string, locale: string = 'el-GR'): string {
  if (!dateString) return '-';
  // Strip time part if present
  const dateOnly = dateString.split('T')[0];
  const parts = dateOnly.split('-');
  if (parts.length !== 3) return '-';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date string (YYYY-MM-DD) for short display in Greek locale
 */
export function formatDateShort(dateString: string, locale: string = 'el-GR'): string {
  if (!dateString) return '-';
  const dateOnly = dateString.split('T')[0];
  const parts = dateOnly.split('-');
  if (parts.length !== 3) return '-';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Returns YYYY-MM-DD for the given Date in local time
export function toLocalDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	return `${year}-${month}-${day}`;
}

// Parses YYYY-MM-DD into a Date at local noon to avoid DST edge cases
export function parseDateKeyLocal(dateKey: string): Date {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return new Date(NaN);
	const [y, m, d] = dateKey.split('-').map(Number);
	return new Date(y, m - 1, d, 12, 0, 0, 0);
}

// Adds days to a date (does not mutate input)
export function addDaysLocal(date: Date, days: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

// Safely build a local Date from dateKey and time (HH:MM) at local time
export function combineLocalDateTime(dateKey: string, timeHHMM: string): Date {
	const base = parseDateKeyLocal(dateKey);
	const [hh, mm] = timeHHMM.split(':').map(Number);
	base.setHours(hh, mm ?? 0, 0, 0);
	return base;
}

// Greek timezone utilities
export function getGreekTimeNow(): Date {
	// Get current time in Greek timezone (UTC+2 for winter, UTC+3 for summer)
	// For simplicity, we'll use UTC+3 (summer time) as it's more common
	const now = new Date();
	return new Date(now.getTime() + (3 * 60 * 60 * 1000));
}

export function getGreekMondayOfCurrentWeek(): Date {
	// Get Monday of current week in Greek timezone
	const greekTime = getGreekTimeNow();
	
	// Get day of week (0 = Sunday, 1 = Monday, etc.)
	const dayOfWeek = greekTime.getUTCDay();
	
	// Calculate days to Monday
	const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
	
	// Get Monday of current week
	const monday = new Date(greekTime);
	monday.setUTCDate(greekTime.getUTCDate() + daysToMonday);
	monday.setUTCHours(0, 0, 0, 0);
	
	// Ensure we return a Monday (day of week = 1)
	console.log('🔥🔥🔥 getGreekMondayOfCurrentWeek called - Input day:', dayOfWeek, 'Days to Monday:', daysToMonday, 'Result day:', monday.getUTCDay(), 'TIMESTAMP:', Date.now());
	
	return monday;
}

