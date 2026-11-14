import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BULUD_LINE_CHART_CONFIG } from './line-chart.config';
import { buludLineScale } from './line-chart.geometry';
import { BuludLineChart } from './line-chart';
import type { BuludLineSelection } from './line-chart.types';

describe('Native line chart', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  const series = [
    {
      name: 'Current Year',
      data: [100, 200, 110, 330, 220, 410, 500, 340, 190, 420, 250, 610],
    },
    {
      name: 'Previous Year',
      data: [20, 130, 210, 230, 100, 320, 400, 270, 140, 300, 110, 400],
    },
  ];
  async function fixture() {
    const f = TestBed.createComponent(BuludLineChart);
    f.componentRef.setInput('caption', 'Commission report');
    f.componentRef.setInput('series', series);
    f.componentRef.setInput('dashArray', [0, 6]);
    f.componentRef.setInput('xaxis', {
      categories: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
    });
    await f.whenStable();
    return f;
  }
  it('keeps both complete series and the dashed comparison line', async () => {
    const f = await fixture();
    const paths = f.nativeElement.querySelectorAll(
      'path.bulud-line-chart-line',
    );
    expect(paths.length).toBe(2);
    expect(paths[0].getAttribute('stroke-dasharray')).toBe('0');
    expect(paths[1].getAttribute('stroke-dasharray')).toBe('6');
    expect((paths[0].getAttribute('d').match(/[ML]/g) ?? []).length).toBe(12);
    expect(
      f.nativeElement.querySelector('svg').getAttribute('aria-label'),
    ).toBe('Commission report');
  });
  it('explores every series with the keyboard, announces exact values and dismisses', async () => {
    const f = await fixture();
    const received: (BuludLineSelection | null)[] = [];
    f.componentInstance.pointChange.subscribe((x) => received.push(x));
    const svg: SVGElement = f.nativeElement.querySelector('svg');
    for (const key of ['Home', 'ArrowRight', 'ArrowDown', 'End']) {
      svg.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await f.whenStable();
    }
    expect(received.at(-1)).toEqual({
      seriesIndex: 1,
      pointIndex: 11,
      name: 'Previous Year',
      label: 'Dec',
      value: 400,
    });
    expect(
      f.nativeElement.querySelector('[role=tooltip]').textContent,
    ).toContain('400');
    expect(
      f.nativeElement.querySelector('[aria-live=polite]').textContent,
    ).toContain('Previous Year: Dec: 400');
    svg.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role=tooltip]')).toBeNull();
    expect(received.at(-1)).toBeNull();
  });
  it('retains null gaps and uses literal text instead of injecting tooltip HTML', async () => {
    const f = await fixture();
    f.componentRef.setInput('series', [
      { name: '<img src=x onerror=alert(1)>', data: [1, null, 3] },
    ]);
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('path').getAttribute('d').match(/M/g)
        ?.length,
    ).toBe(2);
    f.nativeElement
      .querySelector('svg')
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
      );
    await f.whenStable();
    expect(f.nativeElement.querySelector('img')).toBeNull();
    expect(
      f.nativeElement.querySelector('[role=tooltip]').textContent,
    ).toContain('<img');
  });
  it('uses explicit grade bounds and custom tick labels without changing values', async () => {
    const f = await fixture();
    f.componentRef.setInput('series', [{ name: 'Grade', data: [0, 3, 1, 2] }]);
    f.componentRef.setInput('yaxis', {
      min: 0,
      max: 3,
      tickAmount: 3,
      labels: {
        formatter: (n: number) =>
          ['Basic', 'Bronze', 'Silver', 'Gold'][Math.round(n)],
      },
    });
    await f.whenStable();
    expect(
      [
        ...f.nativeElement.querySelectorAll('.bulud-line-chart-y-label tspan'),
      ].map((n) => (n as Element).textContent),
    ).toEqual(['Gold', 'Silver', 'Bronze', 'Basic']);
  });
  it('reacts to series, axis and y-only changes and measures updated labels', async () => {
    const f = await fixture();
    const before = f.nativeElement.querySelector('path').getAttribute('d');
    f.componentRef.setInput('yaxis', { min: 0, max: 1000, tickAmount: 4 });
    await f.whenStable();
    expect(f.nativeElement.querySelector('path').getAttribute('d')).not.toBe(
      before,
    );
    f.componentRef.setInput('series', [{ name: 'Updated', data: [5, 10] }]);
    await f.whenStable();
    expect(
      f.nativeElement.querySelectorAll('path.bulud-line-chart-line').length,
    ).toBe(1);
    expect(f.nativeElement.textContent).toContain('1,000');
  });
  it('retains empty, zero, negative and constant charts and rejects invalid numbers', async () => {
    expect(buludLineScale([{ data: [100, 120, 105, 160, 140] }])).toEqual([
      100, 110, 120, 130, 140, 150, 160,
    ]);
    expect(buludLineScale(series)).toEqual([0, 200, 400, 600, 800]);
    expect(
      buludLineScale([{ data: [1.23456, 1.23462, 1.23458, 1.23468, 1.2346] }]),
    ).toEqual([
      1.23456, 1.23458, 1.2346, 1.23462, 1.23464, 1.23466, 1.23468, 1.2347,
    ]);
    expect(buludLineScale([{ data: [1450, 1450] }])).toEqual([
      1449, 1449.5, 1450, 1450.5, 1451,
    ]);
    expect(buludLineScale([{ data: [-12, -5, -9, -20, -3] }])).toEqual([
      -20, -15, -10, -5, 0,
    ]);
    for (const data of [[], [0], [7, 7], [-7, -7]]) {
      const scale = buludLineScale([{ data }]);
      expect(scale).not.toBeNull();
      expect(scale!.at(-1)!).toBeGreaterThan(scale![0]);
    }
    expect(buludLineScale([{ data: [NaN] }])).toBeNull();
    expect(buludLineScale([{ data: [Infinity] }])).toBeNull();
    expect(
      buludLineScale([{ data: [-Number.MAX_VALUE, Number.MAX_VALUE] }]),
    ).toBeNull();
    expect(buludLineScale([{ data: [1] }], { min: 4, max: 3 })).toBeNull();
    expect(buludLineScale([{ data: [1] }], { tickAmount: 0 })).toBeNull();
  });
  it('keeps loading, error and disabled states named and noninteractive', async () => {
    const f = await fixture();
    f.componentRef.setInput('disabled', true);
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('svg').getAttribute('tabindex'),
    ).toBeNull();
    f.nativeElement
      .querySelector('svg')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role=tooltip]')).toBeNull();
    f.componentRef.setInput('loading', true);
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role=status]').textContent,
    ).toContain('Loading');
    f.componentRef.setInput('loading', false);
    f.componentRef.setInput('error', true);
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role=status]').textContent,
    ).toContain('Invalid');
  });
  it('resolves instance, component-default, global and CSS theme precedence', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_LINE_CHART_CONFIG,
          useValue: {
            theme: { accent: 'red', grid: 'gray' },
            defaults: {
              strokeWidth: 3,
              height: 300,
              theme: { accent: 'blue' },
            },
          },
        },
      ],
    });
    const f = await fixture();
    const host: HTMLElement = f.nativeElement;
    expect(host.style.getPropertyValue('--bulud-line-chart-accent')).toBe(
      'blue',
    );
    expect(host.style.getPropertyValue('--bulud-line-chart-grid')).toBe('gray');
    expect(
      f.nativeElement.querySelector('path').getAttribute('stroke-width'),
    ).toBe('3');
    expect(f.nativeElement.querySelector('svg').getAttribute('height')).toBe(
      '300',
    );
    f.componentRef.setInput('theme', { accent: 'green' });
    f.componentRef.setInput('strokeWidth', 4);
    await f.whenStable();
    expect(host.style.getPropertyValue('--bulud-line-chart-accent')).toBe(
      'green',
    );
    expect(
      f.nativeElement.querySelector('path').getAttribute('stroke-width'),
    ).toBe('4');
    host.style.setProperty('--bulud-line-chart-axis', 'rgb(12, 34, 56)');
    expect(
      getComputedStyle(
        f.nativeElement.querySelector('.bulud-line-chart-y-label'),
      ).fill,
    ).toBe('rgb(12, 34, 56)');
  });
  it('accepts arbitrary reactive locales and translated labels without a fixed language list', async () => {
    const f = await fixture();
    f.componentRef.setInput('series', [
      { name: 'Umsatz', data: [1234.5, 2345.6] },
    ]);
    f.nativeElement
      .querySelector('svg')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    for (const locale of [
      'fa-IR',
      'ar-EG',
      'tr-TR',
      'de-DE',
      'ja-JP',
      'en-US',
    ]) {
      f.componentRef.setInput('locale', locale);
      f.componentRef.setInput('keyboardLabel', `Help ${locale}`);
      await f.whenStable();
      expect(
        f.nativeElement.querySelector('[role=tooltip]').textContent,
      ).toContain(
        new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
          1234.5,
        ),
      );
      expect(f.nativeElement.querySelector('desc').textContent).toBe(
        `Help ${locale}`,
      );
    }
    f.componentRef.setInput('locale', 'invalid_locale');
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role=tooltip]').textContent,
    ).toContain('1,234.5');
    f.componentRef.setInput('loadingLabel', 'Chargement');
    f.componentRef.setInput('loading', true);
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role=status]').textContent,
    ).toContain('Chargement');
    f.componentRef.setInput('loading', false);
    f.componentRef.setInput('errorLabel', 'Erreur');
    f.componentRef.setInput('error', true);
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role=status]').textContent,
    ).toContain('Erreur');
  });
  it('resolves locale input before component default, global config and library default', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_LINE_CHART_CONFIG,
          useValue: { locale: 'de-DE', defaults: { locale: 'tr-TR' } },
        },
      ],
    });
    const f = await fixture();
    f.componentRef.setInput('series', [{ data: [1234.5, 2345.6] }]);
    f.nativeElement
      .querySelector('svg')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role=tooltip]').textContent,
    ).toContain('1.234,5');
    f.componentRef.setInput('locale', 'en-US');
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role=tooltip]').textContent,
    ).toContain('1,234.5');
  });
  it('disconnects its resize observer on destruction', async () => {
    const disconnect = spyOn(
      ResizeObserver.prototype,
      'disconnect',
    ).and.callThrough();
    const f = await fixture();
    f.destroy();
    expect(disconnect).toHaveBeenCalled();
  });
});
