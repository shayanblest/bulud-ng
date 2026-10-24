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
export type BuludSkeletonShape = 'line' | 'circle' | 'thumbnail' | 'card';
/** CSS-only placeholders. Mark the real content region aria-busy in the consumer. */
@Component({
  selector: 'bulud-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style]': 'styles()',
    '[attr.role]': 'announce()?"status":null',
    '[attr.aria-label]': 'announce()?label():null',
    '[attr.aria-hidden]': 'announce()?null:"true"',
  },
  template: `<div
    class="skeleton"
    [attr.data-shape]="shape()"
    [class.still]="!animated()"
    aria-hidden="true"
  >
    @if (shape() === 'card') {
      <div class="block media"></div>
      <div class="lines">
        @for (line of rowIds(); track line) {
          <span class="block line" [class.short]="$last"></span>
        }
      </div>
    } @else if (shape() === 'line') {
      <div class="lines">
        @for (line of rowIds(); track line) {
          <span
            class="block line"
            [class.short]="$last && rowIds().length > 1"
          ></span>
        }
      </div>
    } @else {
      <div class="block thumb" [class.circle]="shape() === 'circle'"></div>
    }
  </div>`,
  styleUrl: './skeleton.scss',
})
export class BuludSkeleton {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly shape = input<BuludSkeletonShape>('line');
  readonly lines = input(3);
  readonly animated = input(true, { transform: booleanAttribute });
  readonly announce = input(false, { transform: booleanAttribute });
  readonly label = input('Loading…');
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly rowIds = computed(() =>
    Array.from(
      {
        length: Number.isFinite(this.lines())
          ? Math.min(12, Math.max(1, Math.floor(this.lines())))
          : 3,
      },
      (_, i) => i,
    ),
  );
  protected readonly styles = computed(() =>
    buludSharedUiStyles('skeleton', this.config, this.theme()),
  );
}
