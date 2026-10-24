import {
  addDays,
  calendarDate,
  daysInMonth,
  iso,
  parseDate,
  parts,
  shiftMonth,
} from './calendar';

describe('Date-only calendar conversion', () => {
  it('rejects invalid dates and parses leap days without local-time conversion', () => {
    expect(parseDate('2025-02-29')).toBeNull();
    expect(parseDate('2024-02-29')).not.toBeNull();
    expect(parseDate('2025-03-21T00:00:00Z')).toBeNull();
    expect(parseDate('0000-01-01')).toBeNull();
    expect(iso(parseDate('0099-03-21')!)).toBe('0099-03-21');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });
  it('round-trips Persian Nowruz and leap Esfand through Intl', () => {
    expect(parts(parseDate('2025-03-21')!, 'persian')).toEqual({
      year: 1404,
      month: 1,
      day: 1,
    });
    expect(iso(calendarDate(1404, 1, 1, 'persian')!)).toBe('2025-03-21');
    expect(iso(calendarDate(1403, 12, 30, 'persian')!)).toBe('2025-03-20');
    expect(calendarDate(1402, 12, 30, 'persian')).toBeNull();
    expect(daysInMonth(1403, 12, 'persian')).toBe(30);
    expect(daysInMonth(1404, 12, 'persian')).toBe(29);
  });
  it('clamps month and year navigation rather than overflowing the selected day', () => {
    expect(shiftMonth('2024-01-31', 1, 'gregory')).toBe('2024-02-29');
    expect(shiftMonth('2024-02-29', 12, 'gregory')).toBe('2025-02-28');
    expect(shiftMonth('2025-03-20', 1, 'persian')).toBe('2025-04-19');
    expect(daysInMonth(2024, 12, 'gregory')).toBe(31);
  });
});
