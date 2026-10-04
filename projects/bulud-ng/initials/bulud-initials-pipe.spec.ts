import { BuludInitialsPipe } from './bulud-initials-pipe';

describe('BuludInitialsPipe', () => {
  const initials = new BuludInitialsPipe();

  it('returns the first grapheme for a single-word Latin name', () => {
    expect(initials.transform('Alice')).toBe('A');
  });

  it('returns the first grapheme of every word in a multi-word Latin name', () => {
    expect(initials.transform('Ada Lovelace')).toBe('AL');
    expect(initials.transform('Ada Byron King')).toBe('ABK');
  });

  it('supports two-word and multi-word Persian names', () => {
    expect(initials.transform('مریم احمدی')).toBe('ما');
    expect(initials.transform('علی رضا محمدی')).toBe('عرم');
  });

  it('trims and collapses whitespace between words', () => {
    expect(initials.transform('  Ada   Lovelace  ')).toBe('AL');
    expect(initials.transform('\tAda\nLovelace\r\n')).toBe('AL');
    expect(initials.transform('Ada\u0085Lovelace')).toBe('AL');
    expect(initials.transform('\u0085Ada\u0085Lovelace\u0085')).toBe('AL');
    expect(initials.transform('\uFEFFAda Lovelace')).toBe('AL');
    expect(initials.transform('Ada\uFEFFLovelace')).toBe('AL');
    expect(initials.transform('Ada Lovelace\uFEFF')).toBe('AL');
  });

  it('returns an empty string for empty, whitespace-only, and nullish values', () => {
    expect(initials.transform('')).toBe('');
    expect(initials.transform(' \t\n ')).toBe('');
    expect(initials.transform('\u0085\u2000\u2028')).toBe('');
    expect(initials.transform('\uFEFF')).toBe('');
    expect(initials.transform(null)).toBe('');
    expect(initials.transform(undefined)).toBe('');
  });

  it('keeps combining marks with their base character', () => {
    expect(initials.transform('e\u0301clair')).toBe('e\u0301');
  });

  it('keeps emoji grapheme clusters together', () => {
    expect(initials.transform('👩‍💻 Smith')).toBe('👩‍💻S');
    expect(initials.transform('🇮🇷 Iran')).toBe('🇮🇷I');
    expect(initials.transform('1️⃣ Choice')).toBe('1️⃣C');
  });

  it('keeps Unicode Hangul syllable graphemes together', () => {
    expect(initials.transform('\u1100\u1161 Name')).toBe('\u1100\u1161N');
  });

  it('preserves punctuation, hyphens, and symbol-prefixed labels', () => {
    expect(initials.transform('Jean-Luc Picard')).toBe('JP');
    expect(initials.transform("O'Connor Mary-Jane")).toBe('OM');
    expect(initials.transform('★ Alpha')).toBe('★A');
  });
});
