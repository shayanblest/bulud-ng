import {
  DestroyRef,
  DOCUMENT,
  inject,
  Injectable,
  Pipe,
  PipeTransform,
  signal,
} from '@angular/core';

export function buludFileExtension(value: string | null | undefined): string {
  const name = (value ?? '').split(/[?#]/)[0].split(/[\\/]/).pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}
@Pipe({ name: 'buludFileExtension' })
export class BuludFileExtensionPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return buludFileExtension(value);
  }
}
@Pipe({ name: 'buludIsImage' })
export class BuludIsImagePipe implements PipeTransform {
  transform(value: string | null | undefined): boolean {
    return (
      !!value &&
      (/^data:image\/(?:png|jpe?g|gif|webp|bmp|tiff);base64,/i.test(value) ||
        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'avif'].includes(
          buludFileExtension(value),
        ))
    );
  }
}
@Pipe({ name: 'buludMaskEmail' })
export class BuludMaskEmailPipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    visibleStart = 3,
    visibleEnd = 3,
  ): string {
    const text = value?.trim();
    if (!text) return '-';
    const start =
        Number.isInteger(visibleStart) && visibleStart >= 0 ? visibleStart : 3,
      end = Number.isInteger(visibleEnd) && visibleEnd >= 0 ? visibleEnd : 3;
    return text.length <= start + end
      ? '***'
      : text.slice(0, start) + '...' + (end ? text.slice(-end) : '');
  }
}
@Pipe({ name: 'buludPascalCase' })
export class BuludPascalCasePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return (value ?? '')
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}
@Pipe({ name: 'buludCardNumber' })
export class BuludCardNumberPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return (value ?? '').replace(/\s/g, '').replace(/(.{4})(?=.)/g, '$1 ');
  }
}
/** Explicit units avoid guessing whether a timestamp is seconds or milliseconds. */
export function buludUnixTimestamp(
  value: string | Date | null | undefined,
): number | null {
  if (value == null || value === '') return null;
  const time = (value instanceof Date ? value : new Date(value)).getTime();
  return Number.isFinite(time) ? Math.floor(time / 1000) : null;
}
@Pipe({ name: 'buludTimestamp' })
export class BuludTimestampPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): number | null {
    return buludUnixTimestamp(value);
  }
}
@Pipe({ name: 'buludDateTime' })
export class BuludDateTimePipe implements PipeTransform {
  private readonly formatters = new Map<string, Intl.DateTimeFormat>();
  transform(
    value: number | string | Date | null | undefined,
    showTime = true,
    language: 'fa' | 'en' = 'en',
    timeZone?: string,
    unit: 'seconds' | 'milliseconds' = 'seconds',
  ): string {
    if (value == null || value === '') return '-';
    const date =
      value instanceof Date
        ? value
        : typeof value === 'number'
          ? new Date(value * (unit === 'seconds' ? 1000 : 1))
          : new Date(value);
    if (!Number.isFinite(date.getTime())) return '-';
    const key = JSON.stringify([showTime, language, timeZone]);
    try {
      let fmt = this.formatters.get(key);
      if (!fmt) {
        fmt = new Intl.DateTimeFormat(
          language === 'fa'
            ? 'fa-IR-u-ca-persian-nu-latn'
            : 'en-GB-u-ca-gregory-nu-latn',
          {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            ...(showTime
              ? {
                  hour: '2-digit',
                  minute: '2-digit',
                  hourCycle: 'h23' as const,
                }
              : {}),
            ...(timeZone ? { timeZone } : {}),
          },
        );
        if (this.formatters.size >= 16) this.formatters.clear();
        this.formatters.set(key, fmt);
      }
      return fmt.format(date);
    } catch {
      return '-';
    }
  }
}
export type BuludDatePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';
/** Rolling range in the supplied date's local timezone. Calendar month/year endpoints clamp at month end. */
export function buludDateRange(
  period: BuludDatePeriod,
  now = new Date(),
): { from: number; to: number } {
  if (!Number.isFinite(now.getTime())) throw new RangeError('Invalid date');
  const from = new Date(now);
  if (period === 'all') from.setTime(0);
  else if (period === 'daily' || period === 'weekly')
    from.setDate(from.getDate() - (period === 'daily' ? 1 : 7));
  else {
    const day = from.getDate();
    from.setDate(1);
    if (period === 'monthly') from.setMonth(from.getMonth() - 1);
    else from.setFullYear(from.getFullYear() - 1);
    const last = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
    from.setDate(Math.min(day, last));
  }
  return {
    from: Math.floor(from.getTime() / 1000),
    to: Math.floor(now.getTime() / 1000),
  };
}
@Injectable({ providedIn: 'root' })
export class BuludDateService {
  toUnix = buludUnixTimestamp;
  range = buludDateRange;
  fromUnix(seconds: number): Date | null {
    const date = new Date(seconds * 1000);
    return Number.isFinite(seconds) && Number.isFinite(date.getTime())
      ? date
      : null;
  }
}
/** null on the server. Browser online status describes connectivity, not API reachability. */
@Injectable({ providedIn: 'root' })
export class BuludConnectionService {
  private readonly state = signal<boolean | null>(null);
  readonly online = this.state.asReadonly();
  constructor() {
    const win = inject(DOCUMENT).defaultView;
    if (!win) return;
    const update = () => this.state.set(win.navigator.onLine);
    update();
    win.addEventListener('online', update);
    win.addEventListener('offline', update);
    inject(DestroyRef).onDestroy(() => {
      win.removeEventListener('online', update);
      win.removeEventListener('offline', update);
    });
  }
}
@Injectable({ providedIn: 'root' })
export class BuludPasswordService {
  private readonly crypto =
    inject(DOCUMENT).defaultView?.crypto ?? globalThis.crypto;
  generate(length = 16): string {
    if (!Number.isInteger(length) || length < 12 || length > 128)
      throw new RangeError('Password length must be 12–128');
    if (!this.crypto?.getRandomValues)
      throw new Error('Cryptographic randomness unavailable');
    const groups = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      '!@#$%&*',
    ];
    const chars = groups.join('');
    const random = (max: number): number => {
      const bytes = new Uint32Array(1),
        limit = 4294967296 - (4294967296 % max);
      do {
        this.crypto.getRandomValues(bytes);
      } while (bytes[0] >= limit);
      return bytes[0] % max;
    };
    const result = groups.map((g) => g[random(g.length)]);
    while (result.length < length) result.push(chars[random(chars.length)]);
    for (let i = result.length - 1; i > 0; i--) {
      const j = random(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result.join('');
  }
}

/** Shallow immutable cleanup; preserves false, zero and nonempty arrays/objects. */
export function buludRemoveEmptyFields<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, v]) => v !== null && v !== undefined && v !== '',
    ),
  ) as Partial<T>;
}
/** Shift UTC years without mutating the date; February 29 clamps to February 28. */
export function buludShiftYears(value: Date, years: number): Date | null {
  if (!Number.isFinite(value.getTime()) || !Number.isSafeInteger(years))
    return null;
  const result = new Date(value.getTime()),
    day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  const end = new Date(result.getTime());
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  result.setUTCDate(Math.min(day, end.getUTCDate()));
  return Number.isFinite(result.getTime()) ? result : null;
}
/** Deadline uses Unix seconds; now uses milliseconds. Negative means expired. */
export function buludSecondsUntil(
  deadlineSeconds: number,
  nowMs = Date.now(),
): number | null {
  const remaining = Math.ceil(deadlineSeconds - nowMs / 1000);
  return Number.isFinite(deadlineSeconds) &&
    Number.isFinite(nowMs) &&
    Number.isFinite(remaining)
    ? remaining
    : null;
}
export interface BuludTimeSlot {
  readonly start: string;
  readonly end: string;
}
/** Bounded allocation, inclusive 00:00 start and exclusive 24:00 end. */
export function buludTimeSlots(stepMinutes = 30): readonly BuludTimeSlot[] {
  if (!Number.isInteger(stepMinutes) || stepMinutes < 1 || stepMinutes > 1440)
    throw new RangeError('Time step must be an integer from 1 to 1440');
  const format = (n: number) =>
    String(Math.floor(n / 60)).padStart(2, '0') +
    ':' +
    String(n % 60).padStart(2, '0');
  return Array.from({ length: Math.ceil(1440 / stepMinutes) }, (_, i) => ({
    start: format(i * stepMinutes),
    end: format(Math.min(1440, (i + 1) * stepMinutes)),
  }));
}
/** Period-aware timestamp formatting with explicit units and timezone. */
@Pipe({ name: 'buludUnixTimeConverter' })
export class BuludUnixTimeConverterPipe implements PipeTransform {
  private readonly dateTime = new BuludDateTimePipe();
  private readonly times = new Map<string, Intl.DateTimeFormat>();
  transform(
    value: number | null | undefined,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    language: 'fa' | 'en' = 'en',
    timeZone?: string,
    unit: 'seconds' | 'milliseconds' = 'seconds',
  ): string {
    if (value == null || !Number.isFinite(value)) return '-';
    if (period !== 'daily')
      return this.dateTime.transform(
        value,
        period === 'yearly',
        language,
        timeZone,
        unit,
      );
    try {
      const key = JSON.stringify([language, timeZone]);
      let formatter = this.times.get(key);
      if (!formatter) {
        formatter = new Intl.DateTimeFormat(
          language === 'fa' ? 'fa-IR' : 'en-US',
          { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone },
        );
        if (this.times.size >= 32) this.times.clear();
        this.times.set(key, formatter);
      }
      return formatter.format(
        new Date(value * (unit === 'seconds' ? 1000 : 1)),
      );
    } catch {
      return '-';
    }
  }
}
