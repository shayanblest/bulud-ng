import {
  BuludNumberPipe,
  BuludRelativeTimePipe,
  BuludDurationPipe,
  BuludTruncatePipe,
  BuludFallbackPipe,
} from './display-pipes';
describe('Pure display pipes', () => {
  it('formats locale number/currency/percent and rejects invalid values/options', () => {
    const p = new BuludNumberPipe();
    expect(p.transform(1234, 'en-US')).toBe('1,234');
    expect(p.transform(0.42, 'en-US', { style: 'percent' })).toBe('42%');
    expect(
      p.transform(5, 'en-US', { style: 'currency', currency: 'USD' }),
    ).toBe('$5.00');
    expect(p.transform(NaN)).toBe('-');
    expect(p.transform(5, 'bad_locale')).toBe('-');
    expect(p.transform(0)).toBe('0');
  });
  it('uses an explicit clock and bounded formatter caches', () => {
    const p = new BuludRelativeTimePipe();
    expect(p.transform(0, 60, 'en', 'always')).toContain('1 minute ago');
    expect(p.transform(60, 0, 'en', 'always')).toContain('in 1 minute');
    expect(p.transform(NaN, 0)).toBe('-');
    expect(p.transform(0, Infinity)).toBe('-');
  });
  it('formats durations and Unicode prefixes predictably', () => {
    const p = new BuludDurationPipe();
    expect(p.transform(3661)).toBe('01:01:01');
    expect(p.transform(-1)).toBe('-');
    expect(p.transform(0.5)).toBe('-');
    const t = new BuludTruncatePipe();
    expect(t.transform('😀abc', 2)).toBe('😀a…');
    expect(t.transform('ab', 2)).toBe('ab');
    expect(t.transform('abc', 0)).toBe('…');
  });
  it('preserves zero and false in fallback', () => {
    const p = new BuludFallbackPipe();
    expect(p.transform(0)).toBe(0);
    expect(p.transform(false)).toBe(false);
    expect(p.transform(' ')).toBe('—');
    expect(p.transform(null, 'Empty')).toBe('Empty');
  });
});
