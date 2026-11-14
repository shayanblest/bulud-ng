import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { BULUD_RADIAL_CHART_CONFIG } from './radial-chart.config';
import type { BuludRadialChartTheme } from './radial-chart.types';
let nextRadialId = 0;
@Component({
  selector: 'bulud-radial-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../radial-chart.css',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block w-full', '[style]': 'styles()' },
  template: `@if (loading() || error() || invalid() || value() === null) {
      <div
        class="flex items-center justify-center"
        [style.height.px]="layout().height"
        [attr.aria-busy]="loading()"
      >
        <p role="status">
          {{
            loading()
              ? loadingLabel()
              : error() || invalid()
                ? errorLabel()
                : emptyLabel()
          }}
        </p>
      </div>
    } @else {
      <svg
        class="block"
        style="direction:ltr"
        role="group"
        [attr.aria-label]="label() + ': ' + formatted()"
        [attr.width]="width()"
        [attr.height]="layout().height"
      >
        <defs>
          <filter
            [id]="filterId + '-hover'"
            filterUnits="userSpaceOnUse"
            width="200%"
            height="200%"
            x="-50%"
            y="-50%"
          >
            <feColorMatrix
              type="matrix"
              in="SourceGraphic"
              values="2 0 0 0 0 0 2 0 0 0 0 0 2 0 0 0 0 0 1 0"
            />
          </filter>
          <filter
            [id]="filterId + '-selected'"
            filterUnits="userSpaceOnUse"
            width="200%"
            height="200%"
            x="-50%"
            y="-50%"
          >
            <feColorMatrix
              type="matrix"
              in="SourceGraphic"
              values="0.3 0 0 0 0 0 0.3 0 0 0 0 0 0.3 0 0 0 0 0 1 0"
            />
          </filter>
        </defs>
        <title>{{ label() }}</title>
        <desc>{{ formatted() }}</desc>
        <g
          [attr.transform]="'translate(' + layout().offsetX + ', 0)'"
          fill="none"
          stroke-linecap="round"
        >
          <path
            class="bulud-radial-track"
            [attr.d]="arc(359.99)"
            [attr.stroke-width]="layout().stroke * 0.97"
            stroke="var(--bulud-radial-track,color-mix(in srgb,var(--bulud-radial-accent,var(--bulud-color-success,#2e7d32)) 10%,transparent))"
          />
          <path
            class="bulud-radial-value outline-none focus-visible:outline-2 focus-visible:outline-[var(--bulud-radial-focus,var(--bulud-color-focus))]"
            role="button"
            [attr.aria-label]="label() + ': ' + formatted()"
            [attr.aria-pressed]="selected()"
            [attr.aria-disabled]="disabled()"
            [attr.tabindex]="disabled() ? null : 0"
            [attr.filter]="filter()"
            (pointerenter)="enter($event)"
            (pointerleave)="hovered.set(false)"
            (click)="toggle()"
            (keydown)="keydown($event)"
            [attr.d]="arc(Math.min(359.99, Math.round((value() ?? 0) * 3.6)))"
            [attr.stroke-width]="layout().stroke"
            stroke="var(--bulud-radial-accent,var(--bulud-color-success,#2e7d32))"
          />
          <g
            text-anchor="middle"
            dominant-baseline="auto"
            stroke="none"
            fill="var(--bulud-radial-foreground,var(--bulud-color-on-surface,#222))"
            font-family="var(--bulud-radial-font-family,Helvetica,Arial,sans-serif)"
            font-weight="var(--bulud-radial-font-weight,lighter)"
          >
            <text
              class="bulud-radial-label"
              [attr.x]="layout().center"
              [attr.y]="layout().center + 40"
              font-size="var(--bulud-radial-label-size,16px)"
            >
              {{ label() }}
            </text>
            <text
              class="bulud-radial-text"
              [attr.x]="layout().center"
              [attr.y]="layout().center + 6"
              font-size="var(--bulud-radial-value-size,42px)"
            >
              {{ formatted() }}
            </text>
          </g>
        </g>
      </svg>
    }`,
})
export class BuludRadialChart {
  private readonly config = inject(BULUD_RADIAL_CHART_CONFIG);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly label = input.required<string>();
  readonly value = input<number | null>(0);
  readonly locale = input<string>();
  readonly theme = input<BuludRadialChartTheme>();
  readonly selected = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  protected readonly filterId = `bulud-radial-${nextRadialId++}`;
  protected readonly hovered = signal(false);
  protected readonly filter = computed(() =>
    this.disabled()
      ? null
      : this.selected()
        ? `url(#${this.filterId}-selected)`
        : this.hovered()
          ? `url(#${this.filterId}-hover)`
          : null,
  );
  protected enter(event: PointerEvent): void {
    if (!this.disabled() && event.pointerType !== 'touch')
      this.hovered.set(true);
  }
  protected toggle(): void {
    if (!this.disabled()) this.selected.update((value) => !value);
  }
  protected keydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
    }
  }
  readonly loading = input(false, { transform: booleanAttribute });
  readonly error = input(false, { transform: booleanAttribute });
  readonly loadingLabel = input('Loading chart…');
  readonly errorLabel = input('Invalid chart data');
  readonly emptyLabel = input('No chart data');
  protected readonly Math = Math;
  protected readonly width = signal(300);
  protected readonly invalid = computed(
    () =>
      this.value() !== null &&
      (!Number.isFinite(this.value()) ||
        this.value()! < 0 ||
        this.value()! > 100),
  );
  protected readonly styles = computed(() => {
    const result: Record<string, string> = {};
    for (const layer of [
      this.config.theme,
      this.config.defaults?.theme,
      this.theme(),
    ])
      for (const [key, value] of Object.entries(layer ?? {}))
        if (value !== undefined)
          result[
            '--bulud-radial-' +
              key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
          ] = value;
    return result;
  });
  private readonly formatter = computed(() => {
    const locale =
      this.locale() ?? this.config.defaults?.locale ?? this.config.locale;
    if (!locale) return null;
    try {
      return new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'percent',
        maximumFractionDigits: 20,
      });
    } catch {
      return null;
    }
  });
  protected readonly formatted = computed(() => {
    const value = this.value();
    return value === null
      ? ''
      : (this.formatter()?.format(value) ?? String(value) + '%');
  });
  protected readonly layout = computed(() => {
    const grid = this.width() / 1.2,
      size = Math.max(0, grid / 2.05 - 6),
      stroke = Math.max(0, size * 0.15 - 5);
    return {
      center: grid / 2,
      offsetX: (this.width() - grid) / 2,
      radius: Math.max(0, size - stroke * 1.5 - 5),
      stroke,
      height: Math.ceil(size * 2.05 + 15),
    };
  });
  protected arc(angle: number): string {
    const { center, radius } = this.layout();
    const end = ((angle - 90) * Math.PI) / 180;
    return `M ${center} ${center - radius} A ${radius} ${radius} 0 ${angle > 180 ? 1 : 0} 1 ${angle === 0 ? center : center + radius * Math.cos(end)} ${angle === 0 ? center - radius : center + radius * Math.sin(end)}`;
  }
  constructor() {
    afterRenderEffect((onCleanup) => {
      const element = this.element.nativeElement;
      const set = (value: number) => {
        if (value > 0) this.width.set(Math.floor(value));
      };
      set(element.getBoundingClientRect().width);
      const Observer = element.ownerDocument.defaultView?.ResizeObserver;
      if (!Observer) return;
      const observer = new Observer((entries) =>
        set(entries[0]?.contentRect.width ?? 0),
      );
      observer.observe(element);
      onCleanup(() => observer.disconnect());
    });
  }
}
