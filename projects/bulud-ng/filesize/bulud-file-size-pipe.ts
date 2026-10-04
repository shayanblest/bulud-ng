import { Pipe, PipeTransform } from '@angular/core';

export type BuludFileSizePipeValue = number | null | undefined;

export type BuludFileSizeBase = 'decimal' | 'binary';

export interface BuludFileSizeOptions {
  readonly base?: BuludFileSizeBase;
  readonly precision?: number;
}

const DEFAULT_PRECISION = 2;
const MAX_PRECISION = 3;
const DECIMAL_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
const BINARY_UNITS = [
  'B',
  'KiB',
  'MiB',
  'GiB',
  'TiB',
  'PiB',
  'EiB',
  'ZiB',
  'YiB',
];

/** Formats finite byte counts using explicit decimal or binary units. */
@Pipe({
  name: 'buludFileSize',
  standalone: true,
  pure: true,
})
export class BuludFileSizePipe implements PipeTransform {
  transform(
    bytes: BuludFileSizePipeValue,
    options?: BuludFileSizeOptions,
  ): string {
    if (bytes == null || !Number.isFinite(bytes)) {
      return '';
    }

    const base = options?.base === 'binary' ? 1024 : 1000;
    const units = options?.base === 'binary' ? BINARY_UNITS : DECIMAL_UNITS;
    const precision = normalizePrecision(options?.precision);
    const absoluteBytes = Math.abs(bytes);
    let unitIndex = 0;
    let scaledBytes = absoluteBytes;

    while (scaledBytes >= base && unitIndex < units.length - 1) {
      scaledBytes /= base;
      unitIndex += 1;
    }

    while (
      unitIndex < units.length - 1 &&
      roundsToUnitThreshold(scaledBytes, precision, base)
    ) {
      scaledBytes /= base;
      unitIndex += 1;
    }

    const sign = bytes < 0 ? '-' : '';
    return `${sign}${formatNumber(scaledBytes, precision)} ${units[unitIndex]}`;
  }
}

function roundsToUnitThreshold(
  value: number,
  precision: number,
  base: number,
): boolean {
  return Number(value.toFixed(precision)) >= base;
}

function normalizePrecision(value: number | undefined): number {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_PRECISION
    ? value
    : DEFAULT_PRECISION;
}

function formatNumber(value: number, precision: number): string {
  const formatted =
    value >= 1e21 ? value.toExponential(precision) : value.toFixed(precision);
  const [mantissa, exponent] = formatted.split('e');
  const [wholePart, fractionPart] = mantissa.split('.');
  const trimmedFraction = fractionPart?.replace(/0+$/u, '') ?? '';
  const trimmedMantissa =
    trimmedFraction === '' ? wholePart : `${wholePart}.${trimmedFraction}`;
  return exponent == null ? trimmedMantissa : `${trimmedMantissa}e${exponent}`;
}
