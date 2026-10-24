export type Calendar = 'gregory' | 'persian';
export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}
const DAY = 86_400_000;
let persianFormatter: Intl.DateTimeFormat | undefined;

/** Date-only values are interpreted at UTC noon; no local timezone conversions. */
export function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const date = new Date(value + 'T12:00:00.000Z');
  return Number.isFinite(date.getTime()) &&
    iso(date) === value &&
    value >= '0001-01-01'
    ? date
    : null;
}
export function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
export function addDays(value: string, days: number): string {
  return iso(new Date(parseDate(value)!.getTime() + days * DAY));
}
export function parts(date: Date, calendar: Calendar): CalendarDate {
  if (calendar === 'gregory')
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  persianFormatter ??= new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const values = Object.fromEntries(
    persianFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(values['year']),
    month: Number(values['month']),
    day: Number(values['day']),
  };
}
function utcDate(year: number, month: number, day: number): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(12, 0, 0, 0);
  return date;
}
/** Intl supplies the calendar rules, including Persian leap years; binary search converts back. */
export function calendarDate(
  year: number,
  month: number,
  day: number,
  calendar: Calendar,
): Date | null {
  if (
    !Number.isInteger(year) ||
    year < 1 ||
    year > 10000 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  )
    return null;
  if (calendar === 'gregory') {
    const date = utcDate(year, month, day);
    return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
      ? date
      : null;
  }
  const target = year * 10000 + month * 100 + day;
  let low = Math.floor(utcDate(year + 621, 1, 1).getTime() / DAY);
  let high = Math.floor(utcDate(year + 622, 12, 31).getTime() / DAY);
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const date = new Date(middle * DAY + DAY / 2);
    const p = parts(date, calendar);
    const actual = p.year * 10000 + p.month * 100 + p.day;
    if (actual === target) return date;
    if (actual < target) low = middle + 1;
    else high = middle - 1;
  }
  return null;
}
export function daysInMonth(
  year: number,
  month: number,
  calendar: Calendar,
): number {
  if (calendar === 'gregory') return utcDate(year, month + 1, 0).getUTCDate();
  if (month <= 6) return 31;
  if (month < 12) return 30;
  return calendarDate(year, 12, 30, calendar) ? 30 : 29;
}
export function shiftMonth(
  value: string,
  amount: number,
  calendar: Calendar,
): string | null {
  const date = parseDate(value);
  if (!date) return null;
  const p = parts(date, calendar);
  const absoluteMonth = p.month - 1 + amount;
  const year = p.year + Math.floor(absoluteMonth / 12);
  const month = (((absoluteMonth % 12) + 12) % 12) + 1;
  const result = calendarDate(
    year,
    month,
    Math.min(p.day, daysInMonth(year, month, calendar)),
    calendar,
  );
  return result && parseDate(iso(result)) ? iso(result) : null;
}
