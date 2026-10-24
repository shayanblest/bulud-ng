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
@Component({
  selector: 'bulud-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style]': 'styles()' },
  template: `@if (invalid()) {
      <p role="status">{{ errorLabel() }}</p>
    } @else {
      <figure
        role="progressbar"
        [attr.aria-label]="label()"
        [attr.aria-busy]="loading()"
        aria-valuemin="0"
        [attr.aria-valuemax]="max()"
        [attr.aria-valuenow]="loading() ? null : value()"
      >
        <figcaption>{{ label() }}</figcaption>
        @if (variant() === 'ring') {
          <svg viewBox="0 0 120 120" aria-hidden="true" class="ring">
            <circle class="track" cx="60" cy="60" r="45" pathLength="100" />
            <circle
              class="value"
              cx="60"
              cy="60"
              r="45"
              pathLength="100"
              [attr.stroke-dasharray]="(loading() ? 25 : percent()) + ' 100'"
            />
            <text x="60" y="63" text-anchor="middle">
              {{ loading() ? '…' : percent() + '%' }}
            </text>
          </svg>
        } @else {
          <div class="track bar">
            <div
              class="fill"
              [style.width.%]="loading() ? 25 : percent()"
            ></div>
          </div>
        }
      </figure>
    }`,
  styles: `
    :host {
      display: block;
      color: var(--bulud-progress-foreground, var(--bulud-color-on-surface));
    }
    figure {
      margin: 0;
      padding: var(--bulud-progress-padding, 16px);
      background: var(--bulud-progress-background, var(--bulud-color-surface));
      border-radius: var(--bulud-progress-radius, 8px);
    }
    figcaption {
      margin-block-end: 12px;
    }
    .ring {
      display: block;
      inline-size: min(100%, 260px);
      margin-inline: auto;
      direction: ltr;
    }
    circle {
      fill: none;
      stroke-width: var(--bulud-progress-stroke-width, 8px);
      transform: rotate(-90deg);
      transform-origin: 60px 60px;
    }
    .track {
      stroke: var(--bulud-progress-border, var(--bulud-color-border));
      background: var(--bulud-progress-border, var(--bulud-color-border));
    }
    .value {
      stroke: var(--bulud-progress-accent, var(--bulud-color-primary));
      stroke-linecap: round;
    }
    text {
      fill: currentColor;
      font: 12px sans-serif;
    }
    .bar {
      border-radius: var(--bulud-progress-radius, 100px);
      height: var(--bulud-progress-height, 16px);
      overflow: hidden;
    }
    .fill {
      height: 100%;
      background: var(--bulud-progress-accent, var(--bulud-color-primary));
      border-radius: inherit;
    }
  `,
})
export class BuludProgress {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly label = input.required<string>();
  readonly value = input(0);
  readonly max = input(100);
  readonly variant = input<'bar' | 'ring'>('bar');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly errorLabel = input('Invalid progress value');
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly invalid = computed(
    () =>
      !Number.isFinite(this.max()) ||
      this.max() <= 0 ||
      (!this.loading() &&
        (!Number.isFinite(this.value()) ||
          this.value() < 0 ||
          this.value() > this.max())),
  );
  protected readonly percent = computed(
    () => Math.round((this.value() / this.max()) * 1000) / 10,
  );
  protected readonly styles = computed(() =>
    buludSharedUiStyles('progress', this.config, this.theme()),
  );
}
