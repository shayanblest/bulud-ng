import {
  buludRemoveEmptyFields,
  buludShiftYears,
  buludSecondsUntil,
  buludTimeSlots,
  BuludUnixTimeConverterPipe,
} from './utilities';
describe('Foundation helpers', () => {
  it('omits only empty fields and does not mutate', () => {
    const input = {
      zero: 0,
      no: false,
      empty: '',
      nil: null,
      missing: undefined,
      list: [],
    };
    expect(buludRemoveEmptyFields(input)).toEqual({
      zero: 0,
      no: false,
      list: [],
    });
    expect(input.empty).toBe('');
  });
  it('clamps leap years in UTC without mutation and rejects nonfinite years', () => {
    const date = new Date('2024-02-29T12:34:56Z');
    expect(buludShiftYears(date, 1)?.toISOString()).toBe(
      '2025-02-28T12:34:56.000Z',
    );
    expect(date.getUTCDate()).toBe(29);
    expect(buludShiftYears(date, NaN)).toBeNull();
    expect(buludShiftYears(new Date(NaN), 1)).toBeNull();
  });
  it('uses explicit deadline units', () => {
    expect(buludSecondsUntil(100, 99000)).toBe(1);
    expect(buludSecondsUntil(99, 100000)).toBe(-1);
    expect(buludSecondsUntil(Infinity)).toBeNull();
  });
  it('creates bounded complete day slots including a short final slot', () => {
    expect(buludTimeSlots().length).toBe(48);
    expect(buludTimeSlots().at(-1)).toEqual({ start: '23:30', end: '24:00' });
    expect(buludTimeSlots(100).at(-1)?.end).toBe('24:00');
    for (const n of [0, -1, 0.5, 1441, Infinity])
      expect(() => buludTimeSlots(n)).toThrowError(RangeError);
  });
  it('formats periods with explicit timezone/units and handles invalid dates', () => {
    const pipe = new BuludUnixTimeConverterPipe();
    expect(pipe.transform(0, 'daily', 'en', 'UTC')).toMatch(
      /00:00:00|12:00:00/,
    );
    expect(pipe.transform(0, 'yearly', 'en', 'UTC')).toContain('1970');
    expect(pipe.transform(0, 'monthly', 'en', 'UTC')).toBe(
      pipe.transform(0, 'monthly', 'en', 'UTC', 'milliseconds'),
    );
    expect(pipe.transform(NaN)).toBe('-');
    expect(pipe.transform(0, 'daily', 'en', 'bad')).toBe('-');
  });
});
