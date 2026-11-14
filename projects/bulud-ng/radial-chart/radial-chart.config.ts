import { InjectionToken } from '@angular/core';
import type { BuludRadialChartConfig } from './radial-chart.types';
export const BULUD_RADIAL_CHART_CONFIG =
  new InjectionToken<BuludRadialChartConfig>('BULUD_RADIAL_CHART_CONFIG', {
    providedIn: 'root',
    factory: () => ({}),
  });
