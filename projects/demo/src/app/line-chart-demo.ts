import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  BuludLineChart,
  type BuludLineSeries,
  type BuludLineYAxis,
} from 'bulud-ng/line-chart';
@Component({
  selector: 'app-line-chart-demo',
  standalone: true,
  imports: [BuludLineChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section id="line-chart-demo" class="space-y-4 p-6">
    <h2 class="text-xl font-bold">Native line chart</h2>
    <label class="block"
      >Locale (any BCP 47 tag)<input
        class="border p-2"
        [value]="locale()"
        (input)="setLocale($event)"
    /></label>
    <label class="block"
      >State
      <select
        class="border p-2"
        [value]="state()"
        (change)="state.set($any($event.target).value)"
      >
        @for (item of states; track item) {
          <option [value]="item">{{ item }}</option>
        }
      </select></label
    >
    <button type="button" class="border p-2" (click)="rtl.set(!rtl())">
      Toggle chart direction
    </button>
    <button
      type="button"
      class="border p-2"
      (click)="customTheme.set(!customTheme())"
    >
      Toggle instance theme
    </button>
    <div [dir]="rtl() ? 'rtl' : 'ltr'" class="w-full max-w-4xl">
      <bulud-line-chart
        caption="Current and previous year"
        [series]="data()"
        [locale]="locale()"
        [xaxis]="{ categories: months }"
        [yaxis]="axis()"
        [dashArray]="[0, 6]"
        [loading]="state() === 'loading'"
        [error]="state() === 'error'"
        [disabled]="state() === 'disabled'"
        [theme]="
          customTheme()
            ? { accent: 'rgb(190, 40, 90)', grid: 'rgb(180, 180, 200)' }
            : undefined
        "
      />
    </div>
    <p>
      Arrow keys explore both series; Home/End select endpoints; Escape
      dismisses.
    </p>
  </section>`,
})
export class LineChartDemo {
  readonly states = [
    'default',
    'grade',
    'empty',
    'zero',
    'constant',
    'negative',
    'gaps',
    'fractional',
    'invalid',
    'loading',
    'error',
    'disabled',
  ];
  readonly state = signal('default');
  readonly locale = signal('en-US');
  setLocale(event: Event): void {
    this.locale.set((event.target as HTMLInputElement).value);
  }
  readonly rtl = signal(false);
  readonly customTheme = signal(false);
  readonly months = [
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
  ];
  readonly data = computed<readonly BuludLineSeries[]>(() => {
    const state = this.state();
    if (state === 'empty') return [];
    if (state === 'invalid') return [{ data: [NaN] }];
    if (state === 'fractional')
      return [{ name: 'Revenue', data: [1234.5, 2345.6] }];
    if (state === 'grade')
      return [
        { name: 'Current Year', data: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1] },
        { name: 'Previous Year', data: [1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2] },
      ];
    if (state === 'zero') return [{ name: 'Zero', data: [0] }];
    if (state === 'constant') return [{ name: 'Constant', data: [5, 5, 5] }];
    if (state === 'negative')
      return [{ name: 'Loss', data: [-10, -2, -4, -8] }];
    if (state === 'gaps')
      return [{ name: 'Missing months', data: [5, null, 8, 4, null, 9] }];
    return [
      {
        name: 'Current Year',
        data: [100, 200, 110, 330, 220, 410, 500, 340, 190, 420, 250, 610],
      },
      {
        name: 'Previous Year',
        data: [20, 130, 210, 230, 100, 320, 400, 270, 140, 300, 110, 400],
      },
    ];
  });
  readonly axis = computed<BuludLineYAxis | undefined>(() =>
    this.state() === 'grade'
      ? {
          min: 0,
          max: 3,
          tickAmount: 3,
          labels: {
            formatter: (n) =>
              ['Basic', 'Bronze', 'Silver', 'Gold'][Math.round(n)] ?? '',
          },
        }
      : undefined,
  );
}
