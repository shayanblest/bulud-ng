import {
  ChangeDetectionStrategy,
  Component,
  input,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  BULUD_CHART_ENGINE_CONFIG,
  BuludChartEngine,
  BuludChartHost,
} from './chart-engine';
import { BuludChart, BuludDonutChart } from 'bulud-ng/charts';
import { BULUD_RUNTIME_CONFIG } from 'bulud-ng/runtime';
@Component({
  selector: 'test-engine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<span>{{series().length}}</span>',
})
class TestEngine {
  readonly series = input<readonly unknown[]>([]);
  readonly chart = input<unknown>();
  readonly xaxis = input<unknown>();
  readonly yaxis = input<unknown>();
  readonly plotOptions = input<unknown>();
  readonly stroke = input<unknown>();
  readonly grid = input<unknown>();
  readonly tooltip = input<unknown>();
  readonly legend = input<unknown>();
  readonly colors = input<unknown>();
  readonly labels = input<unknown>();
  readonly dataLabels = input<unknown>();
  readonly fill = input<unknown>();
  readonly markers = input<unknown>();
  readonly title = input<unknown>();
  readonly subtitle = input<unknown>();
  readonly responsive = input<unknown>();
  readonly states = input<unknown>();
}
describe('Independent lazy chart engine contracts', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_CHART_ENGINE_CONFIG,
          useValue: { load: () => Promise.resolve(TestEngine) },
        },
      ],
    }),
  );
  it('keeps both native chart modes independent of the optional engine', async () => {
    const load = jasmine.createSpy('load');
    TestBed.overrideProvider(BULUD_CHART_ENGINE_CONFIG, { useValue: { load } });
    const a = TestBed.createComponent(BuludChart),
      b = TestBed.createComponent(BuludDonutChart);
    a.componentRef.setInput('line', [{ x: 'One', y: 1 }]);
    b.componentRef.setInput('segments', [{ label: 'One', value: 1 }]);
    await Promise.all([a.whenStable(), b.whenStable()]);
    expect(a.nativeElement.querySelector('svg')).not.toBeNull();
    expect(b.nativeElement.querySelector('svg')).not.toBeNull();
    expect(load).not.toHaveBeenCalled();
    a.destroy();
    b.destroy();
  });
  it('does not request an engine when no chart data is supplied', async () => {
    const load = jasmine.createSpy('load');
    TestBed.overrideProvider(BULUD_CHART_ENGINE_CONFIG, { useValue: { load } });
    const f = TestBed.createComponent(BuludChartHost);
    await f.whenStable();
    expect(load).not.toHaveBeenCalled();
    expect(f.nativeElement.children.length).toBe(0);
  });
  it('shares one lazy request and reacts to options without rebuilding engine components', async () => {
    const load = jasmine.createSpy('load').and.resolveTo(TestEngine);
    TestBed.overrideProvider(BULUD_CHART_ENGINE_CONFIG, { useValue: { load } });
    const a = TestBed.createComponent(BuludChartHost),
      b = TestBed.createComponent(BuludChartHost);
    a.componentRef.setInput('options', { series: [1] });
    b.componentRef.setInput('options', { series: [2, 3] });
    await Promise.all([a.whenStable(), b.whenStable()]);
    expect(load).toHaveBeenCalledTimes(1);
    const engine = a.debugElement.query(
      By.directive(TestEngine),
    ).componentInstance;
    a.componentRef.setInput('options', { series: [1, 2, 3] });
    await a.whenStable();
    expect(
      a.debugElement.query(By.directive(TestEngine)).componentInstance,
    ).toBe(engine);
    expect(engine.series()).toEqual([1, 2, 3]);
    a.componentRef.setInput('options', null);
    await a.whenStable();
    expect(a.debugElement.query(By.directive(TestEngine))).toBeNull();
    a.destroy();
    b.destroy();
  });
  it('shows loading then failure accessibly and handles destruction during pending loading', async () => {
    let reject!: (error: Error) => void;
    TestBed.overrideProvider(BULUD_CHART_ENGINE_CONFIG, {
      useValue: { load: () => new Promise((_, no) => (reject = no)) },
    });
    const f = TestBed.createComponent(BuludChartHost);
    f.componentRef.setInput('options', { series: [1] });
    f.componentRef.setInput('loadingLabel', 'Please wait');
    f.componentRef.setInput('errorLabel', 'Unavailable');
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role=status]').textContent).toBe(
      'Please wait',
    );
    reject(new Error('offline'));
    await Promise.resolve();
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role=status]').textContent).toBe(
      'Unavailable',
    );
    f.destroy();
  });
  it('reports missing project loader without importing an external chart dependency', () => {
    TestBed.overrideProvider(BULUD_CHART_ENGINE_CONFIG, { useValue: null });
    const engine = TestBed.inject(BuludChartEngine);
    engine.load();
    expect(engine.error()).toEqual(jasmine.any(Error));
  });
  it('retains finite candle ranges and four percent margin while reacting to precision', async () => {
    const f = TestBed.createComponent(BuludChart);
    f.componentRef.setInput('series', [
      { data: [{ x: '2025-06-15', y: [10, 20, 5, 15] }] },
    ]);
    f.componentRef.setInput('digits', 3);
    await f.whenStable();
    const host = f.debugElement.query(By.directive(BuludChartHost))
      .componentInstance as BuludChartHost;
    const options = host.options()!;
    const axis = options['yaxis'] as {
      min: number;
      max: number;
      labels: { formatter: (value: number) => string };
    };
    expect(axis.min).toBe(4.4);
    expect(axis.max).toBe(20.6);
    expect(axis.labels.formatter(1.2)).toBe('1.200');
    expect((options['chart'] as { type: string }).type).toBe('candlestick');
    f.componentRef.setInput('series', []);
    await f.whenStable();
    expect(host.options()).toBeNull();
  });
  it('rejects malformed or non-finite candle data before loading the engine', async () => {
    const load = jasmine.createSpy('load');
    TestBed.overrideProvider(BULUD_CHART_ENGINE_CONFIG, { useValue: { load } });
    const f = TestBed.createComponent(BuludChart);
    for (const y of [
      [1, 2, 3],
      [1, Infinity, 2, 3],
      [1, '2', 3, 4],
    ]) {
      f.componentRef.setInput('series', [{ data: [{ x: 'bad', y }] }]);
      await f.whenStable();
      expect(load).not.toHaveBeenCalled();
    }
  });
  it('keeps custom donut values, colors, rich tooltip and live translated center independent of the project', async () => {
    const language = signal('en');
    TestBed.overrideProvider(BULUD_RUNTIME_CONFIG, {
      useValue: {
        language,
        translate: () => (language() === 'en' ? 'Assets' : 'دارایی'),
      },
    });
    const f = TestBed.createComponent(BuludDonutChart);
    f.componentRef.setInput('labelKey', 'assets');
    f.componentRef.setInput('data', [
      { rank: 7, instrument_symbol: 'EURUSD' },
      { rank: 3, instrument_symbol: 'GBPUSD' },
    ]);
    f.componentRef.setInput('colorFn', (_: unknown, index: number) =>
      index ? 'blue' : 'red',
    );
    f.componentRef.setInput(
      'tooltipTemplateFn',
      (item: { instrument_symbol: string }) =>
        '<strong>' + item.instrument_symbol + '</strong>',
    );
    await f.whenStable();
    const host = f.debugElement.query(By.directive(BuludChartHost))
      .componentInstance as BuludChartHost;
    expect(host.options()!['series']).toEqual([7, 3]);
    expect(host.options()!['colors']).toEqual(['red', 'blue']);
    expect(
      (
        host.options()!['tooltip'] as {
          custom: (value: { seriesIndex: number }) => string;
        }
      ).custom({ seriesIndex: 1 }),
    ).toBe('<strong>GBPUSD</strong>');
    expect(f.nativeElement.textContent).toContain('Assets');
    language.set('fa');
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('دارایی');
  });
});
