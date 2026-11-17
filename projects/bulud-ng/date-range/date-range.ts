import { Injectable } from '@angular/core';
export interface BuludUnixDateRange {
  readonly from: number;
  readonly to: number;
}
/** Rolling local calendar range with native Date rollover, preserving existing
 * financial-report boundaries. All endpoints are Unix seconds. */
@Injectable({ providedIn: 'root' })
export class BuludDateRangeService {
  getDateRange(period: string, now = new Date()): BuludUnixDateRange {
    const from = new Date(now);
    switch (period) {
      case 'daily':
        from.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        from.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        from.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        from.setFullYear(now.getFullYear() - 1);
        break;
      default:
        from.setTime(0);
    }
    return {
      from: Math.floor(from.getTime() / 1000),
      to: Math.floor(now.getTime() / 1000),
    };
  }
}
