import { InjectionToken, Provider } from '@angular/core';
import type { BuludDatepickerTheme } from 'bulud-ng';

export type BuludCalendar = 'gregory' | 'persian';
export type BuludDatepickerMode = 'single' | 'range';
/** Gregorian ISO dates, including when the displayed calendar is Persian. */
export type BuludDatepickerValue =
  string | readonly [string, string | null] | null;
export interface BuludDatepickerConfig {
  readonly calendar?: BuludCalendar;
  readonly mode?: BuludDatepickerMode;
  /** 0 = Sunday, 6 = Saturday. Defaults to Saturday for Persian, Sunday otherwise. */
  readonly firstDayOfWeek?: number;
  readonly theme?: Partial<BuludDatepickerTheme>;
}
export const BULUD_DATEPICKER_CONFIG =
  new InjectionToken<BuludDatepickerConfig>('BULUD_DATEPICKER_CONFIG', {
    factory: () => ({}),
  });
/** Register component defaults; individual inputs and instance styles take precedence. */
export function provideBuludDatepicker(
  config: BuludDatepickerConfig,
): Provider {
  return { provide: BULUD_DATEPICKER_CONFIG, useValue: config };
}
