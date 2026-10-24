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
@Directive({ selector: 'ng-template[buludSlide]' })
export class BuludSlide {
  readonly buludSlide = input.required<string>();
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
@Component({
  selector: 'bulud-carousel',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './carousel.scss',
  host: { '[style]': 'styles()' },
  template: `<section
    class="surface"
    role="region"
    aria-roledescription="carousel"
    [attr.aria-label]="label()"
  >
    <div class="actions">
      <button
        type="button"
        [disabled]="disabled() || index() === 0"
        (click)="go(-1)"
      >
        {{ previousLabel() }}</button
      ><span aria-live="polite" aria-atomic="true"
        >{{ slides().length ? index() + 1 : 0 }} / {{ slides().length }}</span
      ><button
        type="button"
        [disabled]="disabled() || index() >= slides().length - 1"
        (click)="go(1)"
      >
        {{ nextLabel() }}
      </button>
    </div>
    @if (slides()[index()]; as slide) {
      <div
        class="slide"
        role="group"
        aria-roledescription="slide"
        [attr.aria-label]="slide.buludSlide()"
      >
        <ng-container [ngTemplateOutlet]="slide.template" />
      </div>
    }
    @if (!slides().length) {
      <ng-content select="[buludCarouselEmpty]" />
    }
  </section>`,
})
export class BuludCarousel {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly label = input.required<string>();
  readonly previousLabel = input('Previous');
  readonly nextLabel = input('Next');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly active = model(0);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly slides = contentChildren(BuludSlide);
  protected readonly index = computed(() =>
    Math.max(
      0,
      Math.min(
        this.slides().length - 1,
        Number.isInteger(this.active()) ? this.active() : 0,
      ),
    ),
  );
  protected readonly styles = computed(() =>
    buludSharedUiStyles('carousel', this.config, this.theme()),
  );
  protected go(delta: number): void {
    if (!this.disabled())
      this.active.set(
        Math.min(this.slides().length - 1, Math.max(0, this.index() + delta)),
      );
  }
}
