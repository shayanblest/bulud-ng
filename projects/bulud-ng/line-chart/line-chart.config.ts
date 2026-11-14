import { InjectionToken } from '@angular/core';
import type { BuludLineChartConfig } from './line-chart.types';
/** Instance input → component defaults → global theme → imported CSS palette. */
export const BULUD_LINE_CHART_CONFIG = new InjectionToken<BuludLineChartConfig>(
  'BULUD_LINE_CHART_CONFIG',
  { providedIn: 'root', factory: () => ({}) },
);
