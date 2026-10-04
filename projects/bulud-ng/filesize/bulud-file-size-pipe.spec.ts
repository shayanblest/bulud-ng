import { BuludFileSizePipe } from './bulud-file-size-pipe';

describe('BuludFileSizePipe', () => {
  const fileSize = new BuludFileSizePipe();

  it('formats zero and values below the first unit threshold', () => {
    expect(fileSize.transform(0)).toBe('0 B');
    expect(fileSize.transform(999)).toBe('999 B');
    expect(fileSize.transform(999500)).toBe('999.5 kB');
  });

  it('uses decimal units by default at exact and adjacent thresholds', () => {
    expect(fileSize.transform(1000)).toBe('1 kB');
    expect(fileSize.transform(999999)).toBe('1 MB');
    expect(fileSize.transform(999500, { precision: 0 })).toBe('1 MB');
    expect(fileSize.transform(1_000_000)).toBe('1 MB');
    expect(fileSize.transform(1_500_000)).toBe('1.5 MB');
  });

  it('uses explicit binary units when requested', () => {
    const binary = { base: 'binary' as const };

    expect(fileSize.transform(1023, binary)).toBe('1023 B');
    expect(fileSize.transform(1024, binary)).toBe('1 KiB');
    expect(fileSize.transform(1536, binary)).toBe('1.5 KiB');
    expect(fileSize.transform(1_048_576, binary)).toBe('1 MiB');
    expect(fileSize.transform(1_048_572, { ...binary, precision: 2 })).toBe(
      '1 MiB',
    );
    expect(fileSize.transform(1_048_064, { ...binary, precision: 0 })).toBe(
      '1 MiB',
    );
  });

  it('uses maximum fraction digits with a default precision of two', () => {
    expect(fileSize.transform(1234)).toBe('1.23 kB');
    expect(fileSize.transform(1234, { precision: 0 })).toBe('1 kB');
    expect(fileSize.transform(1234, { precision: 3 })).toBe('1.234 kB');
    expect(fileSize.transform(1234, { precision: 4 })).toBe('1.23 kB');
    expect(fileSize.transform(1234, { precision: 1.5 })).toBe('1.23 kB');
  });

  it('preserves negative values and does not mutate the input', () => {
    const value = -1536;

    expect(fileSize.transform(value)).toBe('-1.54 kB');
    expect(value).toBe(-1536);
    expect(fileSize.transform(-0.001)).toBe('0 B');
    expect(fileSize.transform(-0.0004, { precision: 3 })).toBe('0 B');
    expect(fileSize.transform(-0.01)).toBe('-0.01 B');
  });

  it('returns an empty string for nullish and invalid numeric values', () => {
    expect(fileSize.transform(null)).toBe('');
    expect(fileSize.transform(undefined)).toBe('');
    expect(fileSize.transform(Number.NaN)).toBe('');
    expect(fileSize.transform(Number.POSITIVE_INFINITY)).toBe('');
    expect(fileSize.transform(Number.NEGATIVE_INFINITY)).toBe('');
  });

  it('caps values at the largest supported unit', () => {
    expect(fileSize.transform(1e27)).toBe('1000 YB');
    expect(fileSize.transform(Number.MAX_VALUE, { base: 'binary' })).toBe(
      '1.49e+284 YiB',
    );
  });

  it('uses a stable locale-independent decimal separator', () => {
    expect(fileSize.transform(1_234_567)).toBe('1.23 MB');
    expect(fileSize.transform(1_234_567, { precision: 3 })).toBe('1.235 MB');
  });
});
