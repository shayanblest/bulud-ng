import {
  buludCalendarParts,
  buludParseIsoDate,
  type BuludCalendar,
} from './datepicker-public-types';

export function localDateIso(date: Date | null | undefined): string | null {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  return `${date.getFullYear().toString().padStart(4, '0')}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function timestampIso(value: unknown): string | null {
  return typeof value === 'number' && Number.isFinite(value) && value !== 0
    ? localDateIso(new Date(value * 1000))
    : null;
}

export function isoTimestamp(value: string): number {
  const date = buludParseIsoDate(value);
  if (!date) throw new RangeError('Invalid ISO date');
  return (
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
    1000
  );
}

export function isoLocalDate(value: string, end = false): Date {
  const date = buludParseIsoDate(value);
  if (!date) throw new RangeError('Invalid ISO date');
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    end ? 23 : 0,
    end ? 59 : 0,
    end ? 59 : 0,
  );
}

export function displayDate(
  value: string | null,
  calendar: BuludCalendar,
): string {
  const date = buludParseIsoDate(value);
  if (!date) return '';
  const { year, month, day } = buludCalendarParts(date, calendar);
  return `${year}/${month}/${day}`;
}
