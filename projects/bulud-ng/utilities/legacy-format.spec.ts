import {
  BuludCardNumberPipe,
  BuludFileExtensionPipe,
  BuludIsImagePipe,
  BuludDateTimePipe,
  BuludTimestampPipe,
  BuludUnixTimeConverterPipe,
} from './utilities';

describe('Opt-in legacy utility formats without changing published defaults', () => {
  it('preserves legacy card grouping, masks and existing whitespace', () => {
    const p = new BuludCardNumberPipe();
    expect(p.transform('123456789', 'legacy')).toBe('1 2345 6789');
    expect(p.transform('************1234', 'legacy')).toBe('************1234');
    expect(p.transform('1234 5678', 'legacy')).toBe('1234 5678');
    expect(p.transform('123456789')).toBe('1234 5678 9');
  });
  it('preserves extension case, no-dot names and query suffixes only when requested', () => {
    const p = new BuludFileExtensionPipe();
    expect(p.transform('invoice.PDF', 'legacy')).toBe('PDF');
    expect(p.transform('image.png?token=abc', 'legacy')).toBe('png?token=abc');
    expect(p.transform('README', 'legacy')).toBe('README');
    expect(p.transform(null, 'legacy')).toBe('');
    expect(p.transform('invoice.PDF')).toBe('pdf');
  });
  it('keeps the original image type/data-URL recognition in compatibility mode', () => {
    const p = new BuludIsImagePipe();
    for (const input of ['a.jpg', 'a.TIFF', 'data:image/bmp+xml;base64,abcd'])
      expect(p.transform(input, 'legacy')).toBeTrue();
    for (const input of [
      'a.avif',
      'a.png?token=abc',
      'DATA:IMAGE/PNG;BASE64,abcd',
    ])
      expect(p.transform(input, 'legacy')).toBeFalse();
    expect(p.transform('a.avif')).toBeTrue();
  });
  it('keeps invalid timestamp exceptions opt-in while the default returns null', () => {
    const p = new BuludTimestampPipe();
    expect(p.transform('1970-01-01T00:00:00Z', 'legacy')).toBe(0);
    expect(p.transform(null, 'legacy')).toBe(0);
    expect(() => p.transform('invalid', 'legacy')).toThrowError(
      'Invalid date format',
    );
    expect(p.transform('invalid')).toBeNull();
  });
  it('preserves Gregorian output, local time and automatic seconds/milliseconds detection', () => {
    const p = new BuludDateTimePipe();
    const date = new Date(2024, 2, 20, 12, 5);
    for (const input of [date, date.getTime(), date.getTime() / 1000]) {
      expect(p.transform(input, true, 'en', undefined, 'auto', 'legacy')).toBe(
        '2024-03-20 12:05',
      );
      expect(p.transform(input, false, 'en', undefined, 'auto', 'legacy')).toBe(
        '2024-03-20',
      );
    }
    expect(p.transform(0, false, 'en', undefined, 'auto', 'legacy')).toBe('-');
    expect(
      p.transform('invalid', true, 'en', undefined, 'auto', 'legacy'),
    ).toBe('-');
  });
  it('preserves unpadded Persian date and time-before-date, while other project languages use Gregorian', () => {
    const p = new BuludDateTimePipe(),
      date = new Date(2024, 2, 20, 12, 5);
    expect(p.transform(date, true, 'fa', undefined, 'auto', 'legacy')).toBe(
      '12:05 - 1403/1/1',
    );
    expect(p.transform(date, false, 'fa', undefined, 'auto', 'legacy')).toBe(
      '1403/1/1',
    );
    for (const language of ['ar', 'tr', 'de-DE', 'en'])
      expect(
        p.transform(date, false, language, undefined, 'auto', 'legacy'),
      ).toBe('2024-03-20');
    expect(p.transform(date, false, 'en')).not.toBe('2024-03-20');
  });
  it('preserves existing chart period strings and the Local suffix', () => {
    const p = new BuludUnixTimeConverterPipe(),
      seconds = 1700000000,
      date = new Date(seconds * 1000);
    for (const period of ['weekly', 'monthly'] as const)
      expect(
        p.transform(seconds, period, 'en', undefined, 'seconds', 'legacy'),
      ).toBe(date.toDateString());
    expect(
      p.transform(seconds, 'daily', 'en', undefined, 'seconds', 'legacy'),
    ).toBe(date.toLocaleTimeString() + ' (Local)');
    expect(
      p.transform(seconds, 'yearly', 'en', undefined, 'seconds', 'legacy'),
    ).toBe(date.toLocaleString());
  });
});
