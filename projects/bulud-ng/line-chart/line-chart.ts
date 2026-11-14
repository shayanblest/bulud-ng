import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { BULUD_LINE_CHART_CONFIG } from './line-chart.config';
import { buludLineScale, buludLineValue } from './line-chart.geometry';
import type {
  BuludLineChartTheme,
  BuludLineSelection,
  BuludLineSeries,
  BuludLineXAxis,
  BuludLineYAxis,
} from './line-chart.types';
let nextChartId = 0;
@Component({
  selector: 'bulud-line-chart',
  standalone: true,
  styleUrl: '../line-chart.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full', '[style]': 'styles()' },
  template: `
    <div
      #container
      class="relative block w-full"
      [style.height.px]="resolvedHeight()"
      [attr.aria-busy]="loading()"
    >
      @if (loading() || error() || invalid()) {
        <p
          role="status"
          class="m-0 flex h-full items-center justify-center text-[var(--bulud-line-chart-axis,var(--bulud-color-muted))]"
        >
          {{ loading() ? loadingLabel() : errorLabel() }}
        </p>
      } @else {
        <svg
          #plot
          style="direction: ltr"
          class="block w-full outline-none focus-visible:rounded-[4px] focus-visible:outline-2 focus-visible:outline-[var(--bulud-line-chart-focus,var(--bulud-color-focus))]"
          [attr.width]="width()"
          [attr.height]="resolvedHeight()"
          role="img"
          [attr.aria-label]="caption()"
          [attr.aria-describedby]="instructionsId"
          [attr.tabindex]="disabled() ? null : 0"
          (pointermove)="pointer($event)"
          (pointerleave)="leave()"
          (pointerdown)="pointer($event)"
          (keydown)="keydown($event)"
          (blur)="clear()"
        >
          <title>{{ caption() }}</title>
          <desc>{{ keyboardLabel() }}</desc>
          <defs>
            <clipPath [id]="clipId + '-marker'">
              <rect
                x="-3"
                y="0"
                [attr.width]="layout().plotWidth + 6"
                [attr.height]="layout().plotHeight"
              />
            </clipPath>
            <clipPath [id]="clipId">
              <rect
                x="-3"
                y="-3"
                [attr.width]="layout().plotWidth + 6"
                [attr.height]="layout().plotHeight + 6"
              />
            </clipPath>
          </defs>
          @if (yaxis()?.show !== false && yaxis()?.labels?.show !== false) {
            <g class="bulud-line-chart-yaxis">
              @for (tick of yLabels(); track $index) {
                <text
                  #ylabel
                  class="bulud-line-chart-y-label"
                  [attr.x]="
                    layout().left - 8 + (yaxis()?.labels?.offsetX ?? -5)
                  "
                  [attr.y]="
                    tick.y +
                    layout().top +
                    11 / 3 +
                    (yaxis()?.labels?.offsetY ?? 0)
                  "
                  text-anchor="end"
                  dominant-baseline="auto"
                  [attr.font-family]="yFont()"
                  [attr.font-size]="yaxis()?.labels?.style?.fontSize ?? '11px'"
                  [attr.font-weight]="yaxis()?.labels?.style?.fontWeight ?? 400"
                  [attr.fill]="axisColor('y', $index)"
                >
                  <tspan>{{ tick.visible ? tick.label : '' }}</tspan>
                  <title>{{ tick.label }}</title>
                </text>
              }
            </g>
          }
          <g
            [attr.transform]="
              'translate(' + layout().left + ', ' + layout().top + ')'
            "
          >
            @if (selection(); as point) {
              <line
                [attr.x1]="point.x - 0.5"
                [attr.x2]="point.x - 0.5"
                y1="0"
                [attr.y2]="layout().plotHeight"
                [attr.stroke]="crosshairColor"
                stroke-width="1"
                stroke-dasharray="3"
              />
            }
            <g
              class="bulud-line-chart-grid"
              fill="none"
              [attr.stroke]="gridColor"
              stroke-width="1"
              stroke-linecap="butt"
            >
              @for (tick of yLabels(); track $index) {
                <line
                  x1="0"
                  [attr.x2]="layout().plotWidth"
                  [attr.y1]="tick.y"
                  [attr.y2]="tick.y"
                />
              }
              @for (point of xPositions(); track $index) {
                <line
                  [attr.x1]="point"
                  [attr.x2]="point"
                  y1="0"
                  [attr.y2]="layout().plotHeight"
                />
              }
            </g>
            @if (xaxis()?.axisTicks?.show !== false) {
              <g
                [attr.stroke]="xaxis()?.axisTicks?.color ?? axisBorderColor"
                stroke-width="1"
                fill="none"
              >
                @for (point of xPositions(); track $index) {
                  <line
                    [attr.x1]="point"
                    [attr.x2]="point"
                    [attr.y1]="layout().plotHeight"
                    [attr.y2]="layout().plotHeight + 6"
                  />
                }
              </g>
            }
            @if (xaxis()?.axisBorder?.show !== false) {
              <line
                x1="0"
                [attr.x2]="layout().plotWidth"
                [attr.y1]="layout().plotHeight"
                [attr.y2]="layout().plotHeight"
                [attr.stroke]="xaxis()?.axisBorder?.color ?? axisBorderColor"
                stroke-width="1"
              />
            }
            @for (row of paths(); track $index) {
              <path
                class="bulud-line-chart-line"
                [attr.data-series-index]="$index"
                [attr.data-series-name]="row.name"
                [attr.d]="row.path"
                fill="none"
                [attr.stroke]="row.color"
                [attr.stroke-width]="resolvedStrokeWidth()"
                stroke-linecap="butt"
                [attr.stroke-dasharray]="row.dash"
                [attr.clip-path]="'url(#' + clipId + ')'"
              />
            }
            @if (count() === 1) {
              @for (row of paths(); track $index) {
                @if (row.points[0]; as point) {
                  <circle
                    [attr.cx]="point.x"
                    [attr.cy]="point.y"
                    r="1"
                    [attr.fill]="row.color"
                    [attr.stroke]="row.color"
                    stroke-width="2"
                    stroke-opacity="0.9"
                    [attr.clip-path]="'url(#' + clipId + '-marker)'"
                  />
                }
              }
            }
            @if (xaxis()?.labels?.show !== false) {
              <g class="bulud-line-chart-xaxis">
                @for (label of xLabels(); track $index) {
                  <text
                    #xlabel
                    [attr.x]="label.x + (xaxis()?.labels?.offsetX ?? 0)"
                    [attr.y]="
                      layout().plotHeight + 24 + (xaxis()?.labels?.offsetY ?? 0)
                    "
                    text-anchor="middle"
                    dominant-baseline="auto"
                    [attr.font-family]="xFont()"
                    [attr.font-size]="
                      xaxis()?.labels?.style?.fontSize ?? '12px'
                    "
                    [attr.font-weight]="
                      xaxis()?.labels?.style?.fontWeight ?? 400
                    "
                    [attr.fill]="axisColor('x', $index)"
                    [attr.visibility]="label.visible ? null : 'hidden'"
                  >
                    <tspan>{{ label.label }}</tspan>
                    <title>{{ label.label }}</title>
                  </text>
                }
              </g>
            }
            @if (selection(); as point) {
              @if (point.y > 0 && point.y < layout().plotHeight) {
                <circle
                  class="bulud-line-chart-marker"
                  [attr.cx]="point.x"
                  [attr.cy]="point.y"
                  r="9"
                  [attr.fill]="point.color"
                  [attr.stroke]="point.color"
                  stroke-width="2"
                  stroke-opacity="0.9"
                />
              }
            }
          </g>
        </svg>
        @if (selection(); as point) {
          <div
            role="tooltip"
            #tooltip
            class="bulud-line-chart-tooltip pointer-events-none absolute z-[12] flex flex-col overflow-hidden whitespace-nowrap text-left [direction:ltr] rounded-[var(--bulud-line-chart-tooltip-radius,5px)] bg-[var(--bulud-line-chart-tooltip-background,rgba(30,30,30,0.8))] text-[var(--bulud-line-chart-tooltip-foreground,white)] [box-shadow:var(--bulud-line-chart-tooltip-shadow,2px_2px_6px_-4px_#999)]"
            [style.left.px]="tooltipLeft()"
            [style.top.px]="tooltipTop()"
            [style.font-family]="tooltipFont"
            [style.font-size]="'12px'"
          >
            <div
              class="mb-[4px] border-x-0 border-t-0 border-b border-solid border-[var(--bulud-line-chart-tooltip-border,rgb(51,51,51))] bg-[var(--bulud-line-chart-tooltip-title-background,rgba(0,0,0,0.7))] p-[6px]"
            >
              {{ point.label }}
            </div>
            <div class="flex items-center justify-start px-[10px] pb-[4px]">
              <span
                class="relative mr-[4px] inline-block h-[16px] w-[16px] text-center align-middle text-[16px] leading-[16px] before:inline-block before:w-full before:text-center before:font-[Arial,Helvetica,sans-serif] before:text-[26px] before:leading-[14px] before:font-[900] before:antialiased before:content-['●']"
                [style.color]="point.color"
              ></span>
              <div class="pt-[6px] pb-[5px]">
                <span>{{ point.name }}: </span
                ><span class="ml-[5px] inline-block font-[600]">{{
                  formatValue(point.value)
                }}</span>
              </div>
            </div>
          </div>
        }
      }
      <p [id]="instructionsId" class="sr-only">{{ keyboardLabel() }}</p>
      <span class="sr-only" aria-live="polite">{{ selectionText() }}</span>
    </div>
  `,
})
export class BuludLineChart {
  private readonly config = inject(BULUD_LINE_CHART_CONFIG);
  readonly caption = input.required<string>();
  readonly series = input<readonly BuludLineSeries[]>([]);
  readonly xaxis = input<BuludLineXAxis>();
  readonly yaxis = input<BuludLineYAxis>();
  readonly height = input<number>();
  readonly strokeWidth = input<number>();
  readonly dashArray = input<number | readonly number[]>();
  readonly digits = input<number>();
  /** Reactive BCP 47 locale; no bundled translation table or fixed language list. */
  readonly locale = input<string>();
  readonly theme = input<BuludLineChartTheme>();
  readonly loading = input(false, { transform: booleanAttribute });
  readonly error = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loadingLabel = input('Loading chart…');
  readonly errorLabel = input('Invalid chart data');
  readonly keyboardLabel = input(
    'Arrow keys explore points and series. Home and End select the first and last point. Escape dismisses the tooltip.',
  );
  readonly pointChange = output<BuludLineSelection | null>();
  protected readonly clipId = `bulud-line-clip-${nextChartId++}`;
  protected readonly instructionsId = `${this.clipId}-help`;
  protected readonly gridColor =
    'var(--bulud-line-chart-grid, var(--bulud-color-border, #e0e0e0))';
  protected readonly axisBorderColor =
    'var(--bulud-line-chart-axis-border, #e0e0e0)';
  protected readonly crosshairColor =
    'var(--bulud-line-chart-crosshair, #b6b6b6)';
  protected readonly tooltipFont =
    'var(--bulud-line-chart-font-family, Helvetica, Arial, sans-serif)';
  protected readonly resolvedHeight = computed(
    () => this.height() ?? this.config.defaults?.height ?? 350,
  );
  protected readonly resolvedStrokeWidth = computed(
    () => this.strokeWidth() ?? this.config.defaults?.strokeWidth ?? 2,
  );
  protected readonly width = signal(640);
  private readonly measurements = signal({
    yWidth: 24,
    xEndWidth: 24,
    xHeight: 14,
    xWidths: [] as number[],
  });
  private readonly container = viewChild<ElementRef<HTMLElement>>('container');
  private readonly yElements =
    viewChildren<ElementRef<SVGTextElement>>('ylabel');
  private readonly xElements =
    viewChildren<ElementRef<SVGTextElement>>('xlabel');
  private readonly tooltip = viewChild<ElementRef<HTMLElement>>('tooltip');
  private readonly tooltipSize = signal({ width: 0, height: 0 });
  private readonly active = signal<{ row: number; index: number } | null>(null);
  private keyboardActive = false;
  protected readonly scale = computed(() =>
    buludLineScale(this.series(), this.yaxis()),
  );
  protected readonly invalid = computed(
    () =>
      this.scale() === null ||
      !Number.isFinite(this.resolvedHeight()) ||
      this.resolvedHeight() < 80 ||
      this.resolvedStrokeWidth() < 0,
  );
  private readonly numberFormat = computed(() => {
    const digits = this.digits() ?? this.config.defaults?.digits ?? 2;
    const options: Intl.NumberFormatOptions = {
      maximumFractionDigits: Number.isInteger(digits)
        ? Math.max(0, Math.min(8, digits))
        : 2,
    };
    const locale =
      this.locale() ??
      this.config.defaults?.locale ??
      this.config.locale ??
      'en-US';
    try {
      return new Intl.NumberFormat(locale, options);
    } catch {
      return new Intl.NumberFormat('en-US', options);
    }
  });
  protected readonly formatValue = (value: number): string =>
    this.numberFormat().format(value);
  protected readonly count = computed(() =>
    Math.max(0, ...this.series().map((row) => row.data.length)),
  );
  protected readonly xFont = computed(
    () => this.xaxis()?.labels?.style?.fontFamily ?? this.tooltipFont,
  );
  protected readonly yFont = computed(
    () => this.yaxis()?.labels?.style?.fontFamily ?? this.tooltipFont,
  );
  protected readonly styles = computed(() => {
    const result: Record<string, string> = {};
    for (const layer of [
      this.config.theme,
      this.config.defaults?.theme,
      this.theme(),
    ])
      for (const [key, value] of Object.entries(layer ?? {})) {
        if (value !== undefined)
          result[
            `--bulud-line-chart-${key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`
          ] = value;
      }
    return result;
  });
  protected readonly layout = computed(() => {
    const m = this.measurements(),
      labels = this.xaxis()?.labels?.show !== false;
    const left =
      this.yaxis()?.show === false || this.yaxis()?.labels?.show === false
        ? 10
        : m.yWidth + 25;
    const right = labels ? Math.max(0, m.xEndWidth / 2 + 1) : 0;
    return {
      left,
      top: 30,
      plotWidth: Math.max(1, this.width() - left - right),
      plotHeight: Math.max(
        1,
        this.resolvedHeight() - 45 - (labels ? m.xHeight + 8.652 : 0),
      ),
    };
  });
  protected readonly yLabels = computed(() => {
    const ticks = this.scale() ?? [],
      { plotHeight } = this.layout();
    const seen = new Set<string>();
    return [...ticks].reverse().map((value, index) => {
      const label = String(
        this.yaxis()?.labels?.formatter?.(value, { index }) ??
          this.formatValue(value),
      );
      const visible = !seen.has(label);
      seen.add(label);
      return {
        value,
        label,
        visible,
        y: (plotHeight * index) / Math.max(1, ticks.length - 1),
      };
    });
  });
  protected readonly xPositions = computed(() => {
    const count = this.count();
    return Array.from({ length: count }, (_, index) =>
      count === 1
        ? this.layout().plotWidth / 2
        : (this.layout().plotWidth * index) / (count - 1),
    );
  });
  private labelAt(index: number): string {
    const category = this.xaxis()?.categories?.[index];
    const point = this.series()[0]?.data[index];
    return String(
      category ??
        (typeof point === 'object' && point !== null ? point.x : index + 1),
    );
  }
  protected readonly xLabels = computed(() => {
    const widths = this.measurements().xWidths;
    let end = -Infinity;
    return this.xPositions().map((x, index) => {
      const label = String(
        this.xaxis()?.labels?.formatter?.(this.labelAt(index), undefined, {
          i: index,
        }) ?? this.labelAt(index),
      );
      const width = widths[index] ?? 0,
        visible = x - width / 2 >= end;
      if (visible) end = x + width / 2;
      return { x, label, visible };
    });
  });
  protected readonly paths = computed(() => {
    const ticks = this.scale(),
      { plotHeight } = this.layout(),
      xs = this.xPositions();
    if (!ticks?.length) return [];
    const low = ticks[0],
      range = ticks[ticks.length - 1] - low;
    const dash = this.dashArray() ?? this.config.defaults?.dashArray ?? 0;
    return this.series().map((row, rowIndex) => {
      let pen = false;
      const points = row.data.map((point, index) => {
        const value = buludLineValue(point);
        if (value === null) {
          pen = false;
          return null;
        }
        const x = xs[index] ?? 0,
          y = plotHeight - ((value - low) / range) * plotHeight;
        const command = `${pen ? 'L' : 'M'}${x} ${y}`;
        pen = true;
        return {
          x,
          y,
          value,
          label:
            typeof point === 'object' && point !== null
              ? String(point.x)
              : this.labelAt(index),
          command,
        };
      });
      return {
        name: row.name ?? '',
        color:
          row.color ??
          'var(--bulud-line-chart-accent, var(--bulud-color-primary, #2563eb))',
        dash: typeof dash === 'number' ? dash : (dash[rowIndex] ?? 0),
        path: points.map((p) => p?.command ?? '').join(''),
        points,
      };
    });
  });
  protected readonly selection = computed(() => {
    const active = this.active();
    if (
      !active ||
      this.disabled() ||
      this.loading() ||
      this.error() ||
      this.invalid()
    )
      return null;
    const row = this.paths()[active.row],
      point = row?.points[active.index];
    return point
      ? {
          ...point,
          name: row.name,
          color: row.color,
          seriesIndex: active.row,
          pointIndex: active.index,
        }
      : null;
  });
  protected readonly tooltipLeft = computed(() => {
    const p = this.selection();
    if (!p) return 0;
    const width = this.tooltipSize().width,
      grid = this.layout().plotWidth;
    let x = p.x + 11;
    if (x > grid / 2) x -= width + 16;
    if (x > grid - width - 10) x = grid - width;
    return Math.max(-20, x) + this.layout().left;
  });
  protected readonly tooltipTop = computed(() => {
    const p = this.selection();
    if (!p) return 0;
    const height = this.tooltipSize().height,
      grid = this.layout().plotHeight;
    const y = p.y + 3;
    return height / 2 + y > grid ? grid - height + this.layout().top : y;
  });
  protected readonly selectionText = computed(() => {
    const p = this.selection();
    return p ? `${p.name}: ${p.label}: ${this.formatValue(p.value)}` : '';
  });
  constructor() {
    afterRenderEffect(() => {
      this.selectionText();
      const element = this.tooltip()?.nativeElement;
      if (!element) return;
      const { width, height } = element.getBoundingClientRect();
      const previous = this.tooltipSize();
      if (previous.width !== width || previous.height !== height)
        this.tooltipSize.set({ width, height });
    });
    afterRenderEffect((onCleanup) => {
      const host = this.container()?.nativeElement;
      if (!host) return;
      this.width.set(host.getBoundingClientRect().width || 640);
      const Observer = host.ownerDocument.defaultView?.ResizeObserver;
      if (!Observer) return;
      const observer = new Observer((entries) => {
        const width = entries[0]?.contentRect.width;
        if (width > 0) this.width.set(width);
      });
      observer.observe(host);
      onCleanup(() => observer.disconnect());
    });
    afterRenderEffect(() => {
      this.yLabels();
      this.xLabels();
      this.xFont();
      this.yFont();
      const ys = this.yElements().map((e) => ({
        text: e.nativeElement.textContent ?? '',
        width: e.nativeElement.getBBox().width,
      }));
      const xs = this.xElements().map((e) => e.nativeElement.getBBox());
      if (!ys.length && !xs.length) return;
      // Reserve the same label gutter across every responsive frame.
      const y = ys.reduce((a, b) => (a.text.length >= b.text.length ? a : b), {
        text: '',
        width: 0,
      });
      const value = {
        yWidth: y.width,
        xEndWidth: xs.at(-1)?.width ?? 0,
        xHeight: Math.max(0, ...xs.map((b) => b.height)),
        xWidths: xs.map((b) => b.width),
      };
      const previous = this.measurements();
      if (JSON.stringify(previous) !== JSON.stringify(value))
        this.measurements.set(value);
    });
  }
  protected axisColor(axis: 'x' | 'y', index: number): string {
    const colors = (axis === 'x' ? this.xaxis() : this.yaxis())?.labels?.style
      ?.colors;
    return typeof colors === 'string'
      ? colors
      : (colors?.[index] ??
          'var(--bulud-line-chart-axis, var(--bulud-color-muted, #777777))');
  }
  private select(row: number, index: number): void {
    const next = this.paths()[row]?.points[index];
    if (!next) return;
    const old = this.active();
    if (old?.row === row && old.index === index) return;
    this.active.set({ row, index });
    const selected = this.selection();
    if (selected)
      this.pointChange.emit({
        seriesIndex: row,
        pointIndex: index,
        name: selected.name,
        label: selected.label,
        value: selected.value,
      });
  }
  protected pointer(event: PointerEvent): void {
    if (this.disabled()) return;
    const box = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = event.clientX - box.left - this.layout().left,
      y = event.clientY - box.top - this.layout().top;
    if (
      x < 0 ||
      y < 0 ||
      x > this.layout().plotWidth ||
      y > this.layout().plotHeight
    ) {
      this.leave();
      return;
    }
    this.keyboardActive = false;
    let best = Infinity,
      row = -1,
      index = -1;
    this.paths().forEach((series, r) =>
      series.points.forEach((point, i) => {
        if (point) {
          const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
          if (distance < best) {
            best = distance;
            row = r;
            index = i;
          }
        }
      }),
    );
    if (row >= 0) this.select(row, index);
  }
  protected keydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.clear();
      return;
    }
    if (
      ![
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    this.keyboardActive = true;
    const current = this.active() ?? { row: 0, index: -1 };
    let row = current.row,
      index = current.index;
    if (event.key === 'ArrowUp') row = Math.max(0, row - 1);
    else if (event.key === 'ArrowDown')
      row = Math.min(this.paths().length - 1, row + 1);
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End')
      index = (this.paths()[row]?.points.length ?? 0) - 1;
    else index += event.key === 'ArrowLeft' ? -1 : 1;
    const points = this.paths()[row]?.points ?? [];
    index = Math.max(0, Math.min(points.length - 1, index));
    const step = event.key === 'ArrowLeft' || event.key === 'End' ? -1 : 1;
    while (index >= 0 && index < points.length && !points[index]) index += step;
    if (index >= 0 && index < points.length) this.select(row, index);
  }
  protected leave(): void {
    if (!this.keyboardActive) this.clear();
  }
  protected clear(): void {
    this.keyboardActive = false;
    if (this.active()) {
      this.active.set(null);
      this.pointChange.emit(null);
    }
  }
}
