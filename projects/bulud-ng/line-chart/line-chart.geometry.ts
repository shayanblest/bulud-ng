import type {
  BuludLineSeries,
  BuludLineValue,
  BuludLineYAxis,
} from './line-chart.types';
export function buludLineValue(point: BuludLineValue): number | null {
  return typeof point === 'object' && point !== null ? point.y : point;
}
/** Bounded finite domains, explicit bounds/tick counts and nonfinite rejection. */
export function buludLineScale(
  series: readonly BuludLineSeries[],
  axis?: BuludLineYAxis,
): readonly number[] | null {
  let low = Infinity,
    high = -Infinity,
    count = 0;
  for (const row of series)
    for (const point of row.data) {
      const value = buludLineValue(point);
      if (value === null) continue;
      if (!Number.isFinite(value)) return null;
      low = Math.min(low, value);
      high = Math.max(high, value);
      count++;
    }
  if (!count) {
    low = 0;
    high = 6;
  }
  const explicitLow = axis?.min !== undefined,
    explicitHigh = axis?.max !== undefined;
  if (axis?.min !== undefined)
    low = typeof axis.min === 'function' ? axis.min(low) : axis.min;
  if (axis?.max !== undefined)
    high = typeof axis.max === 'function' ? axis.max(high) : axis.max;
  if (!Number.isFinite(low) || !Number.isFinite(high) || high < low)
    return null;
  if (low === high) {
    if (low === 0) high = 2;
    else {
      const padding = 1;
      low -= padding;
      high += padding;
    }
  }
  if (axis?.tickAmount !== undefined) {
    const ticks = axis.tickAmount;
    if (!Number.isInteger(ticks) || ticks < 1 || ticks > 100) return null;
    const range = high - low;
    return Array.from(
      { length: ticks + 1 },
      (_, i) => low + (range * i) / ticks,
    );
  }
  const initialRange = high - low;
  if (!explicitLow && low > 0 && low / initialRange < 0.15) low = 0;
  if (!explicitHigh && high < 0 && -high / initialRange < 0.15) high = 0;
  const range = high - low;
  if (!Number.isFinite(range)) return null;
  const raw = range / 6,
    power = 10 ** Math.floor(Math.log10(raw));
  const magnitude = raw / power;
  const nice =
    magnitude <= 1 ? 1 : magnitude <= 2 ? 2 : magnitude <= 5 ? 5 : 10;
  let step = nice * power;
  if (low === 0 && high === 2) step = 0.5;
  const start = explicitLow ? low : Math.floor(low / step + 1e-10) * step;
  const stop = explicitHigh ? high : Math.ceil(high / step - 1e-10) * step;
  const ticks = Math.max(1, Math.round((stop - start) / step));
  if (!Number.isFinite(ticks) || ticks > 100) return null;
  const result: number[] = [];
  let value = start - step;
  // Accumulate the interval before rounding each displayed boundary. Keep the
  // final fractional interval when floating point arithmetic reaches it late.
  do {
    value += step;
    result.push(Number(value.toPrecision(7)));
  } while (stop - value > step * 1e-11 && result.length <= 100);
  return result.length > 100 || result.at(-1)! <= result[0] ? null : result;
}
