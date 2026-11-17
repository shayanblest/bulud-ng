import { BuludDropdown } from 'bulud-ng/dropdown';
import { BuludSwitch } from 'bulud-ng/switch';
import { migrationDemoText } from './migration-demo-translations';
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
  imports: [BuludDropdown, BuludSwitch, BuludLineChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section
    id="line-chart-demo"
    class="bulud-app bulud-migration-demo"
    data-bulud-preset="angour"
    [attr.data-theme]="dark() ? 'dark' : 'light'"
    [attr.dir]="rtl() ? 'rtl' : 'ltr'"
    [attr.lang]="locale() || 'en'"
    [style.--demo-accent]="accent()"
    [style.--bulud-color-primary]="accent()"
  >
    <h2 class="text-xl font-bold">{{ t('Native line chart') }}</h2>
    <div class="demo-toolbar">
      <bulud-switch
        appearance="theme"
        [checked]="dark()"
        (checkedChange)="dark.set($event)"
        aria-label="Chart dark theme"
        >{{ t('Cycle widget theme') }}</bulud-switch
      ><label
        >{{ t('Project accent') }}
        <input
          type="color"
          aria-label="Chart accent"
          [value]="accent() ?? '#0c2340'"
          (input)="
            accent.set($any($event.target).value); customTheme.set(true)
          "
      /></label>
    </div>
    <label class="block"
      >Locale (any BCP 47 tag)<input
        class="demo-action"
        [value]="locale()"
        (input)="setLocale($event)"
    /></label>
    <div class="demo-field block">
      State
      <bulud-dropdown
        class="demo-control"
        aria-label="Chart state"
        [options]="states"
        [value]="state()"
        (valueChange)="state.set(stringValue($event, state()))"
        [searchable]="false"
        [clearable]="false"
      />
    </div>
    <button type="button" class="demo-action" (click)="rtl.set(!rtl())">
      Toggle chart direction
    </button>
    <button
      type="button"
      class="demo-action"
      (click)="customTheme.set(!customTheme())"
    >
      Toggle instance theme
    </button>
    <div [dir]="rtl() ? 'rtl' : 'ltr'" class="w-full min-w-0">
      <bulud-line-chart
        [caption]="t('Current and previous year')"
        [series]="data()"
        [locale]="locale()"
        [xaxis]="{ categories: localizedMonths() }"
        [yaxis]="axis()"
        [dashArray]="[0, 6]"
        [loading]="state() === 'loading'"
        [error]="state() === 'error'"
        [disabled]="state() === 'disabled'"
        [theme]="
          customTheme()
            ? {
                accent: accent() ?? 'var(--bulud-color-primary)',
                grid: 'var(--bulud-color-border)',
              }
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
  protected readonly numberValue = (
    value: unknown,
    fallback: number,
  ): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  protected readonly stringValue = (
    value: unknown,
    fallback: string,
  ): string => (typeof value === 'string' ? value : fallback);
  readonly dark = signal(false);
  readonly accent = signal<string | null>(null);
  protected readonly t = (key: string) =>
    migrationDemoText(this.locale() || 'en', key);
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
  protected readonly localizedMonths = computed(() => {
    try {
      const format = new Intl.DateTimeFormat(this.locale() || 'en', {
        month: 'short',
        calendar: 'gregory',
        timeZone: 'UTC',
      });
      return Array.from({ length: 12 }, (_, index) =>
        format.format(new Date(Date.UTC(2025, index, 1))),
      );
    } catch {
      return this.months;
    }
  });
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
