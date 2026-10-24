import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  BuludChart,
  BuludCandlePoint,
  BuludChartLabels,
} from 'bulud-ng/charts';
import { BuludCheckbox } from 'bulud-ng/checkbox';
import { BasePreferences } from './preferences';
const VALUES = [
  14680, 14780, 14600, 14710, 14655, 14450, 14430, 14445, 14240, 14250, 14420,
  14422, 14445, 14300, 14525, 14600, 14575, 14470, 14285, 14355, 14330, 14410,
  14395,
];
@Component({
  selector: 'base-charts',
  imports: [BuludChart, BuludCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="page-heading">
      <p class="eyebrow">ANGOUR CHARTS</p>
      <h1>{{ p.text('نمودارهای مشترک', 'Shared charts') }}</h1>
      <p class="lead">
        {{
          p.text(
            'نمودار خطی و کندلی با رنگ‌های تم انگور',
            'Line and candlestick charts with Angour theme colors'
          )
        }}
      </p>
    </div>
    <section class="surface">
      <div
        class="periods"
        role="group"
        [attr.aria-label]="p.text('بازه زمانی', 'Time period')"
      >
        @for (item of periods; track item.count) {
          <button
            type="button"
            [attr.aria-pressed]="count() === item.count"
            (click)="count.set(item.count)"
          >
            {{ p.language() === 'fa' ? item.fa : item.en }}
          </button>
        }
      </div>
      <div class="toolbar states">
        <bulud-checkbox [(checked)]="loading">{{
          p.text('بارگذاری', 'Loading')
        }}</bulud-checkbox
        ><bulud-checkbox [(checked)]="empty">{{
          p.text('خالی', 'Empty')
        }}</bulud-checkbox
        ><bulud-checkbox [(checked)]="invalid">{{
          p.text('داده نامعتبر', 'Invalid data')
        }}</bulud-checkbox
        ><bulud-checkbox [(checked)]="disabled">{{
          p.text('غیرفعال', 'Disabled')
        }}</bulud-checkbox
        ><bulud-checkbox [(checked)]="override">{{
          p.text('رنگ سفارشی', 'Custom theme')
        }}</bulud-checkbox>
      </div>
      <bulud-chart
        [caption]="p.text('روند نمونه', 'Example trend')"
        [line]="line()"
        [candles]="candles()"
        [labels]="labels()"
        [loading]="loading()"
        [disabled]="disabled()"
        [theme]="
          override()
            ? {
                accent: 'rgb(126, 34, 206)',
                positive: 'rgb(126, 34, 206)',
                negative: 'rgb(190, 18, 60)',
              }
            : undefined
        "
      >
        <div class="statistics">
          <p>
            {{ p.text('تغییرات ماه گذشته', 'Previous month')
            }}<strong class="negative" dir="ltr">↓ −2.26%</strong>
          </p>
          <p>
            {{ p.text('تغییرات سال گذشته', 'Previous year')
            }}<strong class="positive" dir="ltr">↑ +3.35%</strong>
          </p>
        </div>
      </bulud-chart>
    </section>`,
  styles: `
    :host {
      display: block;
    }
    .surface {
      max-width: 760px;
    }
    .periods {
      display: flex;
      background: var(--bulud-color-border);
      padding: 4px;
      border-radius: 8px;
      gap: 4px;
    }
    .periods button {
      flex: 1;
      border: 0;
      background: transparent;
      color: var(--bulud-color-on-surface);
      padding: 8px;
      border-radius: 6px;
      font: inherit;
      cursor: pointer;
    }
    .periods button[aria-pressed='true'] {
      background: var(--bulud-color-surface);
    }
    .periods button:focus-visible {
      outline: 2px solid var(--bulud-color-primary);
    }
    .states {
      margin-block: 20px;
    }
    .statistics {
      display: flex;
      justify-content: space-around;
      text-align: center;
      gap: 16px;
    }
    .statistics strong {
      display: block;
      margin-block-start: 8px;
    }
    .positive {
      color: var(--bulud-color-success, #288c32);
    }
    .negative {
      color: var(--bulud-color-danger-text, #a11729);
    }
  `,
})
export class BaseCharts {
  readonly p = inject(BasePreferences);
  readonly periods = [
    { count: 23, fa: 'ماهانه', en: 'Monthly' },
    { count: 12, fa: 'هفتگی', en: 'Weekly' },
    { count: 6, fa: 'روزانه', en: 'Daily' },
  ];
  readonly count = signal(23);
  readonly loading = signal(false);
  readonly empty = signal(false);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly override = signal(false);
  readonly candles = computed<readonly BuludCandlePoint[]>(() =>
    this.empty()
      ? []
      : VALUES.slice(-this.count()).map((close, i) => ({
          x: `${i + 1}/10`,
          open: i % 2 ? close + 90 : close - 60,
          high: close + 120,
          low: this.invalid() ? close + 130 : close - 120,
          close,
        })),
  );
  readonly line = computed(() =>
    this.candles().map((c) => ({ x: c.x, y: this.invalid() ? NaN : c.close })),
  );
  readonly labels = computed<Partial<BuludChartLabels>>(() =>
    this.p.language() === 'en'
      ? {}
      : {
          line: 'خطی',
          candlestick: 'کندلی',
          type: 'نوع نمودار',
          empty: 'داده‌ای وجود ندارد',
          loading: 'در حال بارگذاری…',
          error: 'داده نمودار نامعتبر است',
          table: 'مشاهده داده‌های نمودار',
          date: 'تاریخ',
          value: 'مقدار',
          open: 'باز شدن',
          high: 'بیشترین',
          low: 'کمترین',
          close: 'بسته شدن',
        },
  );
}
