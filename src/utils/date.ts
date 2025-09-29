// Local date utilities to avoid UTC-induced off-by-one errors

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

