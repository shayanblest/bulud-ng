import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  inject,
  input,
  model,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
@Directive({ selector: 'ng-template[buludStep]' })
export class BuludStep {
  readonly buludStep = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
@Component({
  selector: 'bulud-stepper',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './stepper.scss',
  host: { '[style]': 'styles()' },
  template: `<nav [attr.aria-label]="label()">
      <ol class="actions">
        @for (step of steps(); track step; let i = $index) {
          <li [class.completed]="i < selected() && !step.disabled()">
            <button
              type="button"
              [disabled]="disabled() || step.disabled()"
              [attr.aria-current]="selected() === i ? 'step' : null"
              (click)="select(i)"
            >
              <span class="number" aria-hidden="true">
                @if (i < selected() && !step.disabled()) {
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                } @else {
                  {{ i + 1 }}
                }</span
              >{{ step.buludStep() }}
            </button>
          </li>
        }
      </ol>
    </nav>
    @if (current(); as step) {
      <section class="surface" [attr.aria-label]="step.buludStep()">
        <ng-container [ngTemplateOutlet]="step.template" />
      </section>
    }`,
})
export class BuludStepper {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly label = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly active = model(0);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly steps = contentChildren(BuludStep);
  protected readonly selected = computed(() => {
    const steps = this.steps(),
      n = this.active();
    return Number.isInteger(n) && steps[n] && !steps[n].disabled()
      ? n
      : steps.findIndex((s) => !s.disabled());
  });
  protected readonly current = computed(() => this.steps()[this.selected()]);
  protected readonly styles = computed(() =>
    buludSharedUiStyles('stepper', this.config, this.theme()),
  );
  protected select(index: number): void {
    if (!this.disabled() && !this.steps()[index]?.disabled())
      this.active.set(index);
  }
}
