import {
  afterRenderEffect,
  effect,
  untracked,
  ElementRef,
  forwardRef,
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
export type BuludStepState = 'current' | 'previous' | 'next';
@Directive({
  selector: '[buludStep]',
  exportAs: 'buludStep',
})
export class BuludStep {
  readonly buludStep = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef, {
    optional: true,
  });
  private readonly stepper = inject<BuludStepper>(
    forwardRef(() => BuludStepper),
  );
  readonly state = computed(() => this.stepper.stateFor(this));
  constructor() {
    const element = inject<ElementRef<Node>>(ElementRef).nativeElement;
    effect(() => {
      const state = this.state(),
        content = this.stepper.presentation() === 'content';
      if (!(element instanceof Element)) return;
      element.classList.toggle('bulud-step', content);
      if (content && state === 'current')
        element.setAttribute('aria-current', 'step');
      else element.removeAttribute('aria-current');
      if (this.disabled()) element.setAttribute('aria-disabled', 'true');
      else element.removeAttribute('aria-disabled');
      for (const name of ['current', 'previous', 'next'])
        element.classList.toggle(name, content && state === name);
    });
  }
}
@Component({
  selector: 'bulud-stepper',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './stepper.css',
  host: {
    '[style]': 'styles()',
    '[class.bulud-stepper--content]': "presentation()==='content'",
  },
  template:
    '@if (presentation() === \'content\') {\n      <ng-content />\n    } @else {\n      <nav [attr.aria-label]="label()">\n        <ol class="actions">\n          @for (step of steps(); track step; let i = $index) {\n            <li [class.completed]="i < selected() && !step.disabled()">\n              <button [attr.id]="idPrefix() ? idPrefix() + \'_step_\' + (i + 1) : null"\n                type="button"\n                [disabled]="disabled() || step.disabled()"\n                [attr.aria-current]="selected() === i ? \'step\' : null"\n                (click)="select(i)"\n              >\n                <span class="number" aria-hidden="true">\n                  @if (i < selected() && !step.disabled()) {\n                    <svg viewBox="0 0 24 24" focusable="false">\n                      <path d="m5 12 4 4L19 6" />\n                    </svg>\n                  } @else {\n                    {{ i + 1 }}\n                  }</span\n                >{{ step.buludStep() }}\n              </button>\n            </li>\n          }\n        </ol>\n      </nav>\n      @if (current(); as step) {\n        <section class="surface" [attr.aria-label]="step.buludStep()">\n          <ng-container [ngTemplateOutlet]="step.template" />\n        </section>\n      }\n    }',
})
export class BuludStepper {
  readonly idPrefix = input<string | null>(null);
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly presentation = input<'steps' | 'content'>('steps');
  readonly activeStepName = input<string>();
  readonly activeStepIndex = input(0);
  readonly scrollCurrent = input(true);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly label = input('Steps');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly active = model(0);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  readonly steps = contentChildren(BuludStep);
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
  constructor() {
    effect(() => {
      if (this.presentation() !== 'content') return;
      const steps = this.steps(),
        name = this.activeStepName(),
        requested = this.activeStepIndex(),
        index = name
          ? steps.findIndex((step) => step.buludStep() === name)
          : requested;
      if (index >= 0 && index < steps.length)
        untracked(() => this.active.set(index));
    });
    afterRenderEffect(() => {
      this.active();
      if (this.presentation() === 'content' && this.scrollCurrent())
        this.element.nativeElement
          .querySelector<HTMLElement>('.current')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  stateFor(step: BuludStep): BuludStepState {
    const index = this.steps().indexOf(step);
    return index === this.active()
      ? 'current'
      : index < this.active()
        ? 'previous'
        : 'next';
  }
  nextStep(): void {
    for (let index = this.active() + 1; index < this.steps().length; index++)
      if (!this.steps()[index].disabled()) {
        this.select(index);
        break;
      }
  }
  prevStep(): void {
    for (let index = this.active() - 1; index >= 0; index--)
      if (!this.steps()[index].disabled()) {
        this.select(index);
        break;
      }
  }
}
