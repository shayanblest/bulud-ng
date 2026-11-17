import {
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { BuludRuntime } from 'bulud-ng/runtime';
import {
  BULUD_TOUR_CONFIG,
  BuludTourStep,
  BuludTourTheme,
  buludTourStyles,
} from './tour.types';
@Component({
  selector: 'bulud-tour-tooltip',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './tour.css',
  host: { '[style]': 'styles()' },
  template: ` <div
    class="tour-tooltip"
    [class.rtl]="isRtl()"
    [attr.dir]="isRtl() ? 'rtl' : 'ltr'"
    role="dialog"
    aria-modal="true"
    [attr.aria-label]="title() || runtime.text('Tour', 'Tour')"
    tabindex="-1"
  >
    <div class="tour-count">
      <span dir="ltr"
        >{{ formatStep(currentStepIndex()) }} / {{ formatStep(total()) }}</span
      >
    </div>
    @if (title()) {
      <div class="tour-title">{{ title() }}</div>
    }
    <div
      class="tour-description"
      [class.tour-description--strong]="!title()"
      [innerHTML]="description()"
    ></div>
    <div class="tour-actions" [class.tour-actions--reverse]="!isRtl()">
      <button type="button" class="tour-primary" (click)="nextClicked.emit()">
        {{
          runtime.text(
            step().nextLabelKey ?? 'COMMON.Next',
            step().nextLabel ?? 'Next'
          )
        }}
      </button>
      @if (
        (step().previousLabelKey || step().previousLabel) &&
        currentStepIndex() > 1
      ) {
        <button
          type="button"
          class="tour-secondary"
          (click)="previousClicked.emit()"
        >
          {{
            runtime.text(
              step().previousLabelKey ?? '',
              step().previousLabel ?? 'Previous'
            )
          }}
        </button>
      } @else {
        <button type="button" class="tour-secondary" (click)="closed.emit()">
          {{
            runtime.text(
              step().closeLabelKey ?? 'COMMON.Close',
              step().closeLabel ?? 'Close'
            )
          }}
        </button>
      }
    </div>
  </div>`,
})
export class BuludTourTooltip {
  readonly step = input.required<BuludTourStep>();
  readonly total = input.required<number>();
  readonly currentStepIndex = input.required<number>();
  readonly isRtl = input(false);
  readonly theme = input<BuludTourTheme>();
  readonly nextClicked = output<void>();
  readonly previousClicked = output<void>();
  readonly closed = output<void>();
  protected readonly runtime = inject(BuludRuntime);
  private readonly config = inject(BULUD_TOUR_CONFIG);
  protected readonly styles = computed(() =>
    buludTourStyles(this.config, this.theme()),
  );
  protected readonly title = computed(() =>
    this.runtime.text(
      this.step().titleKey ?? '',
      this.step().title ?? this.step().titleKey ?? '',
    ),
  );
  protected readonly description = computed(() =>
    this.runtime.text(
      this.step().descriptionKey ?? '',
      this.step().description ?? this.step().descriptionKey ?? '',
    ),
  );
  protected formatStep(value: number): string {
    try {
      return new Intl.NumberFormat(this.runtime.language()).format(value);
    } catch {
      return String(value);
    }
  }
}
