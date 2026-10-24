import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
export interface BuludLinePoint {
  readonly x: string;
  readonly y: number;
}
export interface BuludCandlePoint {
  readonly x: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}
export type BuludChartType = 'line' | 'candlestick';
export interface BuludChartLabels {
  readonly line: string;
  readonly candlestick: string;
  readonly type: string;
  readonly empty: string;
  readonly loading: string;
  readonly error: string;
  readonly table: string;
  readonly date: string;
  readonly value: string;
  readonly open: string;
  readonly high: string;
  readonly low: string;
  readonly close: string;
}
const LABELS: BuludChartLabels = {
  line: 'Line',
  candlestick: 'Candlestick',
  type: 'Chart type',
  empty: 'No chart data',
  loading: 'Loading chart…',
  error:
    'Invalid chart data (finite values and valid OHLC bounds required, up to 2,000 points)',
  table: 'View chart data',
  date: 'Date',
  value: 'Value',
  open: 'Open',
  high: 'High',
  low: 'Low',
  close: 'Close',
};
/** Pure chart geometry. A constant-valued domain gets real padding, and invalid points are never silently dropped. */
export function buludChartDomain(
  values: readonly number[],
): readonly [number, number] | null {
  if (!values.length || values.some((n) => !Number.isFinite(n))) return null;
  let min = Infinity,
    max = -Infinity;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  const margin = Math.max((max - min) * 0.04, Math.abs(max) * 0.001, 0.01);
  const low = min - margin,
    high = max + margin;
  return Number.isFinite(low) &&
    Number.isFinite(high) &&
    Number.isFinite(high - low) &&
    high > low
    ? [low, high]
    : null;
}
@Component({
  selector: 'bulud-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './charts.scss',
  host: { '[style]': 'styles()' },
  template: `<figure [attr.aria-busy]="loading()">
    <figcaption>{{ caption() }}</figcaption>
    <div class="types" role="group" [attr.aria-label]="text().type">
      <button
        type="button"
        [disabled]="disabled() || loading()"
        [attr.aria-pressed]="type() === 'line'"
        [attr.aria-label]="text().line"
        (click)="type.set('line')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m3 17 6-6 4 3 8-9" />
        </svg></button
      ><button
        type="button"
        [disabled]="disabled() || loading()"
        [attr.aria-pressed]="type() === 'candlestick'"
        [attr.aria-label]="text().candlestick"
        (click)="type.set('candlestick')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M7 2v5m0 9v6m10-20v8m0 8v4M4 7h6v9H4Zm10 3h6v8h-6Z" />
        </svg>
      </button>
    </div>
    @if (loading() || error() || invalid() || !points().length) {
      <p role="status">
        {{
          loading()
            ? text().loading
            : error() || invalid()
              ? text().error
              : text().empty
        }}
      </p>
    } @else {
      <svg
        class="plot"
        viewBox="0 0 640 360"
        role="img"
        [attr.aria-label]="caption()"
        dir="ltr"
      >
        <title>{{ caption() }}</title>
        <desc>{{ text().table }}</desc>
        @for (tick of ticks(); track $index) {
          <line
            class="grid"
            x1="80"
            x2="620"
            [attr.y1]="tick.y"
            [attr.y2]="tick.y"
          />
          <text class="axis" x="66" [attr.y]="tick.y + 4" text-anchor="end">
            {{ tick.label }}
          </text>
        }
        @for (point of points(); track $index) {
          <line
            class="grid"
            [attr.x1]="point.x"
            [attr.x2]="point.x"
            y1="14"
            y2="314"
          />
        }
        @if (type() === 'line') {
          <polyline class="line" [attr.points]="linePath()" />
          @for (point of points(); track $index) {
            <circle
              class="marker"
              [attr.cx]="point.x"
              [attr.cy]="point.y"
              r="4"
            >
              <title>{{ point.label }}: {{ point.value }}</title>
            </circle>
          }
        } @else {
          @for (candle of candleShapes(); track $index) {
            <g class="candle" [class.up]="candle.up">
              <title>
                {{ candle.label }} — {{ text().open }}: {{ candle.open }},
                {{ text().high }}: {{ candle.high }}, {{ text().low }}:
                {{ candle.low }}, {{ text().close }}: {{ candle.close }}
              </title>
              <line
                [attr.x1]="candle.x"
                [attr.x2]="candle.x"
                [attr.y1]="candle.top"
                [attr.y2]="candle.bottom"
              />
              <rect
                [attr.x]="candle.x - candle.width / 2"
                [attr.y]="candle.bodyTop"
                [attr.width]="candle.width"
                [attr.height]="candle.height"
              />
            </g>
          }
        }
        @for (label of xLabels(); track $index) {
          <text
            class="axis"
            [attr.x]="label.x"
            y="342"
            [attr.text-anchor]="label.anchor"
          >
            {{ label.label }}
          </text>
        }
      </svg>
      <details (toggle)="toggleTable($event)">
        <summary>{{ text().table }}</summary>
        @if (showTable()) {
          <div
            class="table-scroll"
            tabindex="0"
            role="region"
            [attr.aria-label]="text().table"
          >
            <table>
              <caption>
                {{
                  caption()
                }}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{{ text().date }}</th>
                  @if (type() === 'line') {
                    <th scope="col">{{ text().value }}</th>
                  } @else {
                    <th scope="col">{{ text().open }}</th>
                    <th scope="col">{{ text().high }}</th>
                    <th scope="col">{{ text().low }}</th>
                    <th scope="col">{{ text().close }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @if (type() === 'line') {
                  @for (p of line(); track $index) {
                    <tr>
                      <th scope="row">{{ p.x }}</th>
                      <td>{{ p.y }}</td>
                    </tr>
                  }
                } @else {
                  @for (p of candles(); track $index) {
                    <tr>
                      <th scope="row">{{ p.x }}</th>
                      <td>{{ p.open }}</td>
                      <td>{{ p.high }}</td>
                      <td>{{ p.low }}</td>
                      <td>{{ p.close }}</td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      </details>
    }
    <ng-content />
  </figure>`,
})
export class BuludChart {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly caption = input.required<string>();
  readonly line = input<readonly BuludLinePoint[]>([]);
  readonly candles = input<readonly BuludCandlePoint[]>([]);
  readonly type = model<BuludChartType>('line');
  readonly labels = input<Partial<BuludChartLabels>>({});
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  readonly loading = input(false, { transform: booleanAttribute });
  readonly error = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly digits = input(2);
  protected readonly styles = computed(() =>
    buludSharedUiStyles('charts', this.config, this.theme()),
  );
  protected readonly text = computed(() => ({ ...LABELS, ...this.labels() }));
  protected readonly showTable = signal(false);
  private readonly values = computed(() =>
    this.type() === 'line'
      ? this.line().map((p) => p.y)
      : this.candles().flatMap((p) => [p.low, p.high, p.open, p.close]),
  );
  private readonly domain = computed(() => buludChartDomain(this.values()));
  protected readonly invalid = computed(() => {
    const count =
      this.type() === 'line' ? this.line().length : this.candles().length;
    return (
      count > 2000 ||
      (count > 0 && !this.domain()) ||
      (this.type() === 'candlestick' &&
        this.candles().some(
          (c) =>
            c.low > Math.min(c.open, c.close) ||
            c.high < Math.max(c.open, c.close),
        ))
    );
  });
  private readonly format = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        maximumFractionDigits: Number.isInteger(this.digits())
          ? Math.max(0, Math.min(8, this.digits()))
          : 2,
      }),
  );
  private y(value: number): number {
    const d = this.domain();
    return d ? 314 - ((value - d[0]) / (d[1] - d[0])) * 300 : 314;
  }
  private x(index: number, count: number): number {
    return count === 1 ? 350 : 80 + (index / (count - 1)) * 540;
  }
  protected readonly points = computed(() => {
    if (this.invalid()) return [];
    const data =
      this.type() === 'line'
        ? this.line().map((p) => ({ label: p.x, value: p.y }))
        : this.candles().map((p) => ({ label: p.x, value: p.close }));
    return data.map((p, i) => ({
      ...p,
      x: this.x(i, data.length),
      y: this.y(p.value),
    }));
  });
  protected readonly linePath = computed(() =>
    this.points()
      .map((p) => `${p.x},${p.y}`)
      .join(' '),
  );
  protected readonly ticks = computed(() => {
    const d = this.domain();
    return !d
      ? []
      : Array.from({ length: 7 }, (_, i) => {
          const v = d[0] + ((d[1] - d[0]) * i) / 6;
          return { y: this.y(v), label: this.format().format(v) };
        });
  });
  protected readonly xLabels = computed(() => {
    const points = this.points();
    return [
      ...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]),
    ]
      .filter((i) => i >= 0 && points[i])
      .map((i, index, array) => ({
        x: points[i].x,
        label: points[i].label,
        anchor:
          index === 0 ? 'start' : index === array.length - 1 ? 'end' : 'middle',
      }));
  });
  protected readonly candleShapes = computed(() =>
    this.invalid()
      ? []
      : this.candles().map((c, i, all) => ({
          ...c,
          label: c.x,
          x: this.x(i, all.length),
          top: this.y(c.high),
          bottom: this.y(c.low),
          bodyTop: Math.min(this.y(c.open), this.y(c.close)),
          height: Math.max(1, Math.abs(this.y(c.open) - this.y(c.close))),
          width: Math.max(
            1,
            Math.min(20, (540 / Math.max(1, all.length)) * 0.7),
          ),
          up: c.close >= c.open,
        })),
  );
  protected toggleTable(event: Event): void {
    this.showTable.set((event.target as HTMLDetailsElement).open);
  }
}
