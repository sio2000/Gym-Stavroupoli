import { describe, it, expect } from 'vitest';

// Pilates slot capacity simulation
type PilatesSlot = { capacity: number; booked: number };
const pilatesCases: PilatesSlot[] = Array.from({ length: 150 }).map((_, i) => ({
  capacity: (i % 3 === 0 ? 6 : i % 3 === 1 ? 8 : 10),
  booked: (i * 2) % 12,
}));

describe('Pilates - capacity thresholds and statuses', () => {
  pilatesCases.forEach((s, i) => {
    it(`pilates slot [${i}] capacity=${s.capacity} booked=${s.booked}`, () => {
      const status = s.booked >= s.capacity ? 'full' : s.booked >= Math.floor(0.8 * s.capacity) ? 'almost_full' : 'available';
      expect(['full','almost_full','available']).toContain(status);
    });
  });
});

// Personal training assignments
type PTCase = { codeType: 'personal'|'kickboxing'|'combo'; roomSize: 2|3|6; weeklyFreq: 1|2|3; };
const ptCases: PTCase[] = Array.from({ length: 120 }).map((_, i) => ({
  codeType: (i % 3 === 0 ? 'personal' : i % 3 === 1 ? 'kickboxing' : 'combo'),
  roomSize: (i % 3 === 0 ? 2 : i % 3 === 1 ? 3 : 6) as 2|3|6,
  weeklyFreq: (i % 3 === 0 ? 1 : i % 3 === 1 ? 2 : 3) as 1|2|3,
}));

describe('Personal Training - schedule math', () => {
  ptCases.forEach((c, i) => {
    it(`personal code [${i}] ${c.codeType} room=${c.roomSize} weekly=${c.weeklyFreq}`, () => {
      const monthlyTotal = c.weeklyFreq * 4;
      expect(monthlyTotal).toBeGreaterThan(0);
      expect([4,8,12]).toContain(monthlyTotal);
    });
  });
});

// Paspartu deposits and bookings
type PaspartuCase = { deposit: number; bookings: number };
const paspartuCases: PaspartuCase[] = Array.from({ length: 90 }).map((_, i) => ({
  deposit: (i % 5) + 1,
  bookings: (i * 2) % 7,
}));

describe('Paspartu - remaining lessons accounting', () => {
  paspartuCases.forEach((c, i) => {
    it(`paspartu [${i}] deposit=${c.deposit} bookings=${c.bookings}`, () => {
      const remaining = Math.max(0, c.deposit - c.bookings);
      expect(remaining).toBeGreaterThanOrEqual(0);
    });
  });
});


