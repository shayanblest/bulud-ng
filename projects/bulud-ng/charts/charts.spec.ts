import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludChart, buludChartDomain } from './charts';
describe('Chart geometry and accessibility', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('pads negative, zero and constant domains and rejects nonfinite/overflow values', () => {
    for (const v of [0, -12, 12]) {
      const d = buludChartDomain([v, v]);
      expect(d![0]).toBeLessThan(v);
      expect(d![1]).toBeGreaterThan(v);
    }
    for (const v of [
      [],
      [NaN],
      [Infinity],
      [-Number.MAX_VALUE, Number.MAX_VALUE],
    ])
      expect(buludChartDomain(v)).toBeNull();
  });
  it('reacts to data and type, gives SVG a name, and rejects malformed candles', async () => {
    const f = TestBed.createComponent(BuludChart);
    f.componentRef.setInput('caption', 'Trend');
    f.componentRef.setInput('line', [
      { x: 'A', y: 2 },
      { x: 'B', y: 3 },
    ]);
    f.componentRef.setInput('candles', [
      { x: 'A', open: 2, close: 3, low: 1, high: 4 },
    ]);
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('svg.plot').getAttribute('aria-label'),
    ).toBe('Trend');
    expect(f.nativeElement.querySelector('polyline')).not.toBeNull();
    f.nativeElement.querySelectorAll('button')[1].click();
    await f.whenStable();
    expect(f.componentInstance.type()).toBe('candlestick');
    expect(f.nativeElement.querySelector('g.candle.up')).not.toBeNull();
    f.componentRef.setInput('candles', [
      { x: 'A', open: 2, close: 3, low: 4, high: 1 },
    ]);
    await f.whenStable();
    expect(f.nativeElement.querySelector('svg.plot')).toBeNull();
    expect(
      f.nativeElement.querySelector('[role=status]').textContent,
    ).toContain('Invalid');
  });
  it('renders empty/loading/disabled states and enforces the point budget', async () => {
    const f = TestBed.createComponent(BuludChart);
    f.componentRef.setInput('caption', 'Trend');
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('No chart data');
    f.componentRef.setInput('loading', true);
    await f.whenStable();
    expect(f.nativeElement.querySelector('button').disabled).toBeTrue();
    expect(f.nativeElement.textContent).toContain('Loading chart');
    f.componentRef.setInput('loading', false);
    f.componentRef.setInput(
      'line',
      Array.from({ length: 2001 }, () => ({ x: 'A', y: 2 })),
    );
    await f.whenStable();
    expect(f.nativeElement.querySelector('svg.plot')).toBeNull();
  });
});
