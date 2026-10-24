import { Pipe, PipeTransform } from '@angular/core';
/** Native locale formatting without locale-data bundles. Pass immutable options. */
@Pipe({ name: 'buludNumber', pure: true })
export class BuludNumberPipe implements PipeTransform {
  private readonly cache = new Map<string, Intl.NumberFormat>();
  transform(
    value: number | null | undefined,
    locale = 'en-US',
    options: Readonly<Intl.NumberFormatOptions> = {},
  ): string {
    if (value == null || !Number.isFinite(value)) return '-';
    try {
      const key = JSON.stringify([
        locale,
        Object.entries(options).sort(([a], [b]) => a.localeCompare(b)),
      ]);
      let formatter = this.cache.get(key);
      if (!formatter) {
        formatter = new Intl.NumberFormat(locale, options);
        if (this.cache.size >= 32) this.cache.clear();
        this.cache.set(key, formatter);
      }
      return formatter.format(value);
    } catch {
      return '-';
    }
  }
}
/** Explicit `nowSeconds` makes the pure pipe deterministic; no hidden interval or change-detection polling. */
@Pipe({ name: 'buludRelativeTime', pure: true })
export class BuludRelativeTimePipe implements PipeTransform {
  private readonly cache = new Map<string, Intl.RelativeTimeFormat>();
  transform(
    valueSeconds: number | null | undefined,
    nowSeconds: number,
    locale = 'en',
    numeric: 'auto' | 'always' = 'auto',
  ): string {
    if (
      valueSeconds == null ||
      !Number.isFinite(valueSeconds) ||
      !Number.isFinite(nowSeconds)
    )
      return '-';
    const delta = valueSeconds - nowSeconds;
    if (!Number.isFinite(delta)) return '-';
    const [unit, divisor] = (
      [
        ['year', 31536000],
        ['month', 2592000],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
        ['second', 1],
      ] as const
    ).find(([, seconds]) => Math.abs(delta) >= seconds) ?? ['second', 1];
    try {
      const key = JSON.stringify([locale, numeric]);
      let formatter = this.cache.get(key);
      if (!formatter) {
        formatter = new Intl.RelativeTimeFormat(locale, { numeric });
        if (this.cache.size >= 32) this.cache.clear();
        this.cache.set(key, formatter);
      }
      return formatter.format(Math.trunc(delta / divisor), unit);
    } catch {
      return '-';
    }
  }
}
@Pipe({ name: 'buludDuration', pure: true })
export class BuludDurationPipe implements PipeTransform {
  transform(seconds: number | null | undefined): string {
    if (seconds == null || !Number.isSafeInteger(seconds) || seconds < 0)
      return '-';
    return [
      Math.floor(seconds / 3600),
      Math.floor(seconds / 60) % 60,
      seconds % 60,
    ]
      .map((n) => String(n).padStart(2, '0'))
      .join(':');
  }
}
/** Code-point-safe prefix truncation (does not split surrogate pairs). */
@Pipe({ name: 'buludTruncate', pure: true })
export class BuludTruncatePipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    limit = 80,
    suffix = '…',
  ): string {
    if (!value) return '';
    if (!Number.isInteger(limit) || limit < 0 || limit > 100000) return value;
    let result = '',
      count = 0;
    for (const point of value) {
      if (count === limit) return result + suffix;
      result += point;
      count++;
    }
    return result;
  }
}
/** Empty text means null/undefined/blank string, not 0 or false. */
@Pipe({ name: 'buludFallback', pure: true })
export class BuludFallbackPipe implements PipeTransform {
  transform<T>(value: T | null | undefined): T | string;
  transform<T, F>(value: T | null | undefined, fallback: F): T | F;
  transform<T>(
    value: T | null | undefined,
    fallback: unknown = '—',
  ): T | unknown {
    return value == null || (typeof value === 'string' && !value.trim())
      ? fallback
      : value;
  }
}
