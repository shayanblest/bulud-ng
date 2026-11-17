import { afterRenderEffect, ElementRef, signal } from '@angular/core';
import { BuludRuntime } from 'bulud-ng/runtime';
import { BuludChartHost } from 'bulud-ng/chart-engine';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
export interface BuludDonutSegment {
  readonly label: string;
  readonly value: number;
}
@Component({
  selector: 'bulud-donut-chart',
  imports: [BuludChartHost],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style]': 'styles()' },
  styleUrl: './donut.css',
  template: `@if (data() !== undefined) {
      <div class="donut2-chart-wrapper">
        <bulud-chart-host [options]="engineOptions()" />
        @if (centerHtml()) {
          <div class="donut-center-html" [innerHTML]="centerHtml()"></div>
        }
      </div>
    } @else {
      <figure [attr.aria-busy]="loading()">
        <figcaption>{{ caption() }}</figcaption>
        @if (loading() || invalid() || !total()) {
          <p role="status">
            {{
              loading()
                ? loadingLabel()
                : invalid()
                  ? errorLabel()
                  : emptyLabel()
            }}
          </p>
        } @else {
          <svg
            viewBox="0 0 120 120"
            role="img"
            [attr.aria-label]="caption()"
            class="ring"
          >
            <circle class="track" cx="60" cy="60" r="45" pathLength="100" />
            @for (slice of slices(); track $index) {
              <circle
                class="slice"
                cx="60"
                cy="60"
                r="45"
                pathLength="100"
                [attr.stroke-dasharray]="
                  slice.percent + ' ' + (100 - slice.percent)
                "
                [attr.stroke-dashoffset]="-slice.offset"
              >
                <title>{{ slice.label }}: {{ slice.value }}</title>
              </circle>
            }
            <text x="60" y="63" text-anchor="middle">{{ total() }}</text>
          </svg>
          <ul>
            @for (slice of slices(); track $index) {
              <li>
                <span class="swatch" aria-hidden="true"></span
                ><span>{{ slice.label }}</span
                ><strong>{{ slice.value }}</strong>
              </li>
            }
          </ul>
        }
        <ng-content />
      </figure>
    }`,
})
export class BuludDonutChart<T extends object = object> {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly caption = input('');
  readonly segments = input<readonly BuludDonutSegment[]>([]);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly emptyLabel = input('No chart data');
  readonly loadingLabel = input('Loading chart…');
  readonly errorLabel = input('Invalid chart data');
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly invalid = computed(
    () =>
      this.segments().length > 64 ||
      this.segments().some((s) => !Number.isFinite(s.value) || s.value < 0) ||
      !Number.isFinite(this.total()),
  );
  protected readonly total = computed(() =>
    this.segments().reduce((sum, s) => sum + s.value, 0),
  );
  protected readonly slices = computed(() => {
    if (this.invalid() || !this.total()) return [];
    let offset = 0;
    return this.segments().map((s) => {
      const percent = (s.value / this.total()) * 100;
      const slice = { ...s, percent, offset };
      offset += percent;
      return slice;
    });
  });
  protected readonly styles = computed(() =>
    buludSharedUiStyles('donut', this.config, this.theme()),
  );
  private readonly runtime = inject(BuludRuntime);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly data = input<readonly T[]>();
  readonly labelKey = input('');
  readonly valueKey = input('rank');
  readonly labelField = input('instrument_symbol');
  readonly tooltipTemplateFn = input<(item: T) => string>();
  readonly colorFn = input<(item: T, index: number) => string>();
  readonly customCenterKey = input<string>();
  readonly disableCenterLabelOnHover = input(false);
  private readonly primary = signal('12,35,64');
  protected readonly centerHtml = computed(() =>
    this.runtime
      .text(this.customCenterKey() || this.labelKey(), '')
      .replace(/\\n/g, '<br>')
      .replace(/\n/g, '<br>'),
  );
  constructor() {
    afterRenderEffect(() => {
      if (this.data() === undefined) return;
      this.runtime.appearanceRevision();
      const styles = getComputedStyle(this.element.nativeElement);
      this.primary.set(
        styles.getPropertyValue('--bulud-color-primary-rgb').trim() ||
          styles.getPropertyValue('--primary-rgb').trim() ||
          '12,35,64',
      );
    });
  }
  protected readonly engineOptions = computed<
    Readonly<Record<string, unknown>>
  >(() => {
    const data = this.data() ?? [],
      get = (item: T, key: string) => (item as Record<string, unknown>)[key],
      label = this.runtime.text(this.customCenterKey() || this.labelKey(), '');
    return {
      series: data.length
        ? data.map((item) => get(item, this.valueKey()) ?? 1)
        : [100],
      labels: data.length
        ? data.map((item) => get(item, this.labelField()) ?? '')
        : [''],
      colors: data.length
        ? data.map(
            (item, index) =>
              this.colorFn()?.(item, index) ??
              'rgba(' +
                this.primary() +
                ', ' +
                [1, 0.75, 0.5, 0.25][index % 4] +
                ')',
          )
        : ['rgba(' + this.primary() + ', 0.25)'],
      chart: { type: 'donut', animations: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 0, lineCap: 'round' },
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: '85%',
            labels: this.disableCenterLabelOnHover()
              ? {
                  show: true,
                  name: { show: false },
                  value: { show: false },
                  total: {
                    show: true,
                    label,
                    fontSize: '18px',
                    color: 'var(--dark)',
                    fontFamily: 'inherit',
                    formatter: () => '',
                  },
                }
              : {
                  show: true,
                  name: { show: true },
                  value: { show: true },
                  total: { show: false },
                },
          },
        },
      },
      tooltip: {
        enabled: !!data.length,
        custom: ({ seriesIndex }: { seriesIndex: number }) => {
          const item = data[seriesIndex];
          return !item
            ? ''
            : (this.tooltipTemplateFn()?.(item) ??
                '<div style="padding:var(--bulud-spacing-3,12px);text-align:center">' +
                  (get(item, this.labelField()) ?? '') +
                  '</div>');
        },
      },
    };
  });
}
