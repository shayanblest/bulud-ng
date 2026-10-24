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
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style]': 'styles()' },
  styleUrl: './donut.scss',
  template: `<figure [attr.aria-busy]="loading()">
    <figcaption>{{ caption() }}</figcaption>
    @if (loading() || invalid() || !total()) {
      <p role="status">
        {{
          loading() ? loadingLabel() : invalid() ? errorLabel() : emptyLabel()
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
  </figure>`,
})
export class BuludDonutChart {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly caption = input.required<string>();
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
}
