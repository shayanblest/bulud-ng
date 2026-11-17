import { BuludDateRangeService } from './date-range';
describe('BuludDateRangeService Unix report boundaries', () => {
  it('preserves native month/year rollover rather than clamping month-end dates', () => {
    const service = new BuludDateRangeService(),
      now = new Date(2024, 2, 31, 12, 30),
      month = new Date(now);
    month.setMonth(now.getMonth() - 1);
    expect(service.getDateRange('monthly', now)).toEqual({
      from: Math.floor(month.getTime() / 1000),
      to: Math.floor(now.getTime() / 1000),
    });
    const leap = new Date(2024, 1, 29, 13),
      year = new Date(leap);
    year.setFullYear(leap.getFullYear() - 1);
    expect(service.getDateRange('yearly', leap).from).toBe(
      Math.floor(year.getTime() / 1000),
    );
  });
  it('keeps local day/week arithmetic and unknown-period epoch fallback', () => {
    const service = new BuludDateRangeService(),
      now = new Date(2024, 3, 12, 8, 45);
    for (const [period, days] of [
      ['daily', 1],
      ['weekly', 7],
    ] as const) {
      const from = new Date(now);
      from.setDate(now.getDate() - days);
      expect(service.getDateRange(period, now).from).toBe(
        Math.floor(from.getTime() / 1000),
      );
    }
    expect(service.getDateRange('all', now).from).toBe(0);
    expect(service.getDateRange('unknown', now).from).toBe(0);
  });
});
