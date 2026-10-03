import {
  BuludEnglishDigitsPipe,
  BuludPersianDigitsPipe,
} from './bulud-digit-pipes';

describe('Bulud digit pipes', () => {
  const toPersian = new BuludPersianDigitsPipe();
  const toEnglish = new BuludEnglishDigitsPipe();

  it('converts every English digit to Persian digits', () => {
    expect(toPersian.transform('0123456789')).toBe('۰۱۲۳۴۵۶۷۸۹');
  });

  it('converts every Persian digit to English digits', () => {
    expect(toEnglish.transform('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });

  it('preserves mixed text and converts only digits in the requested direction', () => {
    expect(toPersian.transform('Order 12 / شماره ۳۴')).toBe(
      'Order ۱۲ / شماره ۳۴',
    );
    expect(toEnglish.transform('Order 12 / شماره ۳۴')).toBe(
      'Order 12 / شماره 34',
    );
  });

  it('leaves already-converted digits and text without digits unchanged', () => {
    const englishText = 'Already 123';
    const persianText = 'قبلاً ۱۲۳';

    expect(toPersian.transform(persianText)).toBe(persianText);
    expect(toEnglish.transform(englishText)).toBe(englishText);
    expect(toPersian.transform('No digits here!')).toBe('No digits here!');
    expect(toEnglish.transform('بدون رقم!')).toBe('بدون رقم!');
  });

  it('returns an empty string for nullish values and preserves empty strings', () => {
    expect(toPersian.transform(null)).toBe('');
    expect(toPersian.transform(undefined)).toBe('');
    expect(toEnglish.transform(null)).toBe('');
    expect(toEnglish.transform(undefined)).toBe('');
    expect(toPersian.transform('')).toBe('');
  });

  it('converts numbers without mutating the input value', () => {
    const value = 1203;

    expect(toPersian.transform(value)).toBe('۱۲۰۳');
    expect(toEnglish.transform(value)).toBe('1203');
    expect(value).toBe(1203);
  });
});
