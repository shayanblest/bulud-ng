import { BuludRuntime } from 'bulud-ng/runtime';
import {
  afterRenderEffect,
  effect,
  signal,
  untracked,
  output,
  viewChild,
  ElementRef,
  InjectionToken,
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
export interface BuludCarouselLayout {
  readonly itemsPerSlide?: number;
  readonly step?: number;
  readonly sizes?: Readonly<
    Record<number, { readonly itemsPerSlide: number; readonly step?: number }>
  >;
}
export interface BuludCarouselConfig {
  readonly layout?: BuludCarouselLayout;
  readonly defaults?: BuludCarouselLayout;
}
export const BULUD_CAROUSEL_CONFIG = new InjectionToken<BuludCarouselConfig>(
  'BULUD_CAROUSEL_CONFIG',
  {
    providedIn: 'root',
    factory: () => ({}),
  },
);

@Directive({ selector: 'ng-template[buludSlide]' })
export class BuludSlide {
  readonly buludSlide = input.required<string>();
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
@Component({
  selector: 'bulud-carousel',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './carousel.css',
  host: {
    '[style]': 'styles()',
    '[attr.dir]': "presentation()==='single'?(dir()??null):direction()",
    '[class.bulud-carousel--single]': "presentation()==='single'",
    '[class.bulud-carousel--scroll]': "presentation()==='scroll'",
  },
  template:
    '@if(presentation()===\'single\'){<section\n    class="surface"\n    role="region"\n    aria-roledescription="carousel"\n    [attr.aria-label]="label()"\n  >\n    <div class="actions">\n      <button [attr.id]="idPrefix() ? idPrefix() + \'_previous\' : null"\n        type="button"\n        [disabled]="disabled() || index() === 0"\n        (click)="go(-1)"\n      >\n        {{ resolvedPreviousLabel() }}</button\n      ><span aria-live="polite" aria-atomic="true"\n        >{{ slides().length ? index() + 1 : 0 }} / {{ slides().length }}</span\n      ><button [attr.id]="idPrefix() ? idPrefix() + \'_next\' : null"\n        type="button"\n        [disabled]="disabled() || index() >= slides().length - 1"\n        (click)="go(1)"\n      >\n        {{ resolvedNextLabel() }}\n      </button>\n    </div>\n    @if (slides()[index()]; as slide) {\n      <div\n        class="slide"\n        role="group"\n        aria-roledescription="slide"\n        [attr.aria-label]="slide.buludSlide()"\n      >\n        <ng-container [ngTemplateOutlet]="slide.template" />\n      </div>\n    }\n    @if (!slides().length) {\n      <ng-content select="[buludCarouselEmpty]" />\n    }\n  </section>}@else if(presentation()===\'multi\'){ <div\n    class="bulud-carousel-multi itb-carousel"\n    role="region"\n    aria-roledescription="carousel"\n    [attr.aria-label]="label()"\n  >\n    <button [attr.id]="idPrefix() ? idPrefix() + \'_previous\' : null"\n      type="button"\n      class="bulud-carousel-previous"\n      [attr.aria-label]="resolvedPreviousLabel()"\n      [disabled]="disabled() || index() === 0"\n      [class.opacity-50]="index() === 0"\n      (mousedown)="$event.preventDefault()"\n      (click)="prev()"\n    >\n      @if (previousIconClass()) {\n        <i [class]="previousIconClass()" aria-hidden="true"></i>\n      } @else {\n        <svg\n          viewBox="0 0 24 24"\n          aria-hidden="true"\n          fill="none"\n          stroke="currentColor"\n        >\n          <path [attr.d]="direction() === \'rtl\' ? \'m9 6 6 6-6 6\' : \'m15 6-6 6 6 6\'" />\n        </svg>\n      }\n    </button>\n    <div\n      #viewport\n      class="itb-carousel__viewport"\n      [dir]="direction()"\n      (pointerdown)="pointerDown($event)"\n      (pointermove)="pointerMove($event)"\n      (pointerup)="pointerUp()"\n      (pointercancel)="pointerUp()"\n    >\n      <div\n        class="itb-carousel__wrapper"\n        [class.dragging]="dragging()"\n        [style.transform]="\'translate3d(\' + translate() + \'%,0,0)\'"\n      >\n        @for (item of items(); track item) {\n          <div\n            class="itb-carousel__item"\n            [style.width.%]="100 / layout().perSlide"\n            [style.min-width.%]="100 / layout().perSlide"\n            [style.max-width.%]="100 / layout().perSlide"\n            [style.flex]="\'0 0 \' + 100 / layout().perSlide + \'%\'"\n          >\n            <ng-container [ngTemplateOutlet]="item" />\n          </div>\n        }\n      </div>\n    </div>\n    <button [attr.id]="idPrefix() ? idPrefix() + \'_next\' : null"\n      type="button"\n      class="bulud-carousel-next"\n      [attr.aria-label]="resolvedNextLabel()"\n      [disabled]="disabled() || index() >= pageCount() - 1"\n      [class.opacity-50]="index() >= pageCount() - 1"\n      (click)="next()"\n    >\n      @if (nextIconClass()) {\n        <i [class]="nextIconClass()" aria-hidden="true"></i>\n      } @else {\n        <svg\n          viewBox="0 0 24 24"\n          aria-hidden="true"\n          fill="none"\n          stroke="currentColor"\n        >\n          <path [attr.d]="direction() === \'rtl\' ? \'m15 6-6 6 6 6\' : \'m9 6 6 6-6 6\'" />\n        </svg>\n      }\n    </button>\n  </div>}@else{\n    <div\n      #viewport\n      class="carousel-viewport"\n      [class.is-ready]="ready()"\n      [class.is-dragging]="dragging()"\n      role="region"\n      aria-roledescription="carousel"\n      [attr.aria-label]="label()"\n      tabindex="0"\n      (keydown)="keydown($event)"\n      (scroll)="onScroll()"\n      (touchstart)="touchStart($event)"\n      (touchend)="touchEnd($event)"\n      (mousedown)="mouseDown($event)"\n      (mousemove)="mouseMove($event)"\n      (mouseup)="mouseUp($event)"\n      (mouseleave)="mouseLeave()"\n    >\n      <div #scrollTrack class="carousel-track"><ng-content /></div>\n    </div>\n    @if (count() > 1) {\n      <div class="dots-container">\n        @for (dot of dots(); track dot) {\n          <button [attr.id]="idPrefix() ? idPrefix() + \'_slide_\' + (dot + 1) : null"\n            type="button"\n            [attr.aria-label]="slideLabel(dot)"\n            [attr.aria-current]="active() === dot ? \'true\' : null"\n            [class.active]="active() === dot"\n            (click)="goToSlide(dot)"\n          ></button>\n        }\n      </div>\n    }\n  }',
})
export class BuludCarousel {
  readonly idPrefix = input<string | null>(null);
  private readonly ui = inject(BULUD_SHARED_UI_CONFIG);
  readonly presentation = input<'single' | 'multi' | 'scroll'>('single');
  readonly slideChange = output<number>();
  readonly label = input.required<string>();
  readonly previousLabel = input<string>();
  readonly nextLabel = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly active = model(0);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly slides = contentChildren(BuludSlide);
  readonly index = computed(() =>
    this.presentation() !== 'single'
      ? this.active()
      : Math.max(
          0,
          Math.min(
            this.slides().length - 1,
            Number.isInteger(this.active()) ? this.active() : 0,
          ),
        ),
  );
  protected readonly resolvedPreviousLabel = computed(
    () =>
      this.previousLabel() ??
      (this.presentation() === 'single'
        ? 'Previous'
        : this.runtime.text('Previous', 'Previous slide')),
  );
  protected readonly resolvedNextLabel = computed(
    () =>
      this.nextLabel() ??
      (this.presentation() === 'single'
        ? 'Next'
        : this.runtime.text('Next', 'Next slide')),
  );
  protected readonly styles = computed(() =>
    buludSharedUiStyles('carousel', this.ui, this.theme()),
  );
  protected go(delta: number): void {
    if (!this.disabled())
      this.active.set(
        Math.min(this.slides().length - 1, Math.max(0, this.index() + delta)),
      );
  }

  private readonly runtime = inject(BuludRuntime);
  private readonly settings = inject(BULUD_CAROUSEL_CONFIG);
  readonly config = input<BuludCarouselLayout>();
  readonly defaultIndex = input(0);
  readonly previousIconClass = input<string>();
  readonly nextIconClass = input<string>();
  readonly dir = input<'ltr' | 'rtl'>();
  private readonly namedItems =
    contentChildren<TemplateRef<unknown>>('carouselItem');
  readonly items = computed(() =>
    this.namedItems().length
      ? this.namedItems()
      : this.slides().map((slide) => slide.template),
  );
  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  protected readonly dragging = signal(false);
  private readonly dragPosition = signal<number | null>(null);
  private pointer: {
    id: number;
    x: number;
    y: number;
    width: number;
    offset: number;
    horizontal: boolean;
  } | null = null;
  protected readonly direction = computed(
    () => this.dir() ?? this.runtime.direction(),
  );
  readonly layout = computed(() => {
    const instance = this.config();
    const options = {
      itemsPerSlide:
        instance?.itemsPerSlide ??
        this.settings.defaults?.itemsPerSlide ??
        this.settings.layout?.itemsPerSlide ??
        1,
      step:
        instance?.step ??
        this.settings.defaults?.step ??
        this.settings.layout?.step ??
        1,
      sizes:
        instance?.sizes ??
        this.settings.defaults?.sizes ??
        this.settings.layout?.sizes,
    };
    let perSlide = options.itemsPerSlide ?? 1,
      step = options.step ?? 1;
    for (const breakpoint of Object.keys(options.sizes ?? {})
      .map(Number)
      .sort((a, b) => a - b))
      if (this.runtime.viewportWidth() <= breakpoint) {
        perSlide = options.sizes![breakpoint].itemsPerSlide;
        step = options.sizes![breakpoint].step ?? step;
        break;
      }
    return {
      perSlide: Number.isFinite(perSlide)
        ? Math.min(
            Math.max(1, this.items().length),
            Math.max(1, Math.floor(perSlide)),
          )
        : 1,
      step: Number.isFinite(step) ? Math.max(1, Math.floor(step)) : 1,
    };
  });
  private readonly maxPosition = computed(() =>
    Math.max(0, this.items().length - this.layout().perSlide),
  );
  readonly pageCount = computed(
    () => Math.ceil(this.maxPosition() / this.layout().step) + 1,
  );
  private readonly offset = computed(() =>
    Math.min(this.index() * this.layout().step, this.maxPosition()),
  );
  protected readonly translate = computed(() =>
    this.items().length
      ? (((this.dragPosition() ?? this.offset()) * 100) /
          this.layout().perSlide) *
        (this.direction() === 'rtl' ? 1 : -1)
      : 0,
  );
  private previousDefault: number | undefined;

  private selectSlide(index: number): void {
    if (this.disabled()) return;
    const next = Math.max(0, Math.min(index, this.pageCount() - 1));
    if (next !== this.index()) {
      this.active.set(next);
      this.slideChange.emit(next);
    }
  }
  next(): void {
    this.selectSlide(this.index() + 1);
  }
  prev(): void {
    this.selectSlide(this.index() - 1);
  }
  protected pointerDown(event: PointerEvent): void {
    if (this.disabled()) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const viewport = this.viewport()?.nativeElement;
    if (!viewport) return;
    this.pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width: viewport.clientWidth || 1,
      offset: this.offset(),
      horizontal: false,
    };
    this.dragging.set(true);
    viewport.style.userSelect = 'none';
    viewport.setPointerCapture?.(event.pointerId);
  }
  protected pointerMove(event: PointerEvent): void {
    const pointer = this.pointer;
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x,
      dy = event.clientY - pointer.y;
    if (!pointer.horizontal) {
      if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 8) return;
      pointer.horizontal = true;
    }
    event.preventDefault();
    this.dragPosition.set(
      pointer.offset -
        (this.direction() === 'rtl' ? -dx : dx) /
          (pointer.width / this.layout().perSlide),
    );
  }
  protected pointerUp(): void {
    const pointer = this.pointer;
    this.pointer = null;
    this.dragging.set(false);
    const viewport = this.viewport()?.nativeElement;
    if (viewport) viewport.style.userSelect = '';
    if (pointer?.horizontal) {
      const position = Math.max(
        0,
        Math.min(this.dragPosition() ?? this.offset(), this.maxPosition()),
      );
      this.selectSlide(Math.round(position / this.layout().step));
    }
    this.dragPosition.set(null);
  }

  private readonly scrollTrack =
    viewChild<ElementRef<HTMLElement>>('scrollTrack');
  protected readonly count = signal(0);
  protected readonly ready = signal(false);
  protected readonly dots = computed(() =>
    Array.from({ length: this.count() }, (_, index) => index),
  );
  private touchX = 0;
  private startX = 0;
  private startScroll = 0;

  private clamp(index: number): number {
    return Math.max(0, Math.min(Math.trunc(index) || 0, this.count() - 1));
  }
  private rtl(): boolean {
    return (
      this.viewport()!.nativeElement.ownerDocument.defaultView?.getComputedStyle(
        this.viewport()!.nativeElement,
      ).direction === 'rtl'
    );
  }
  private scrollToIndex(index: number, smooth: boolean): void {
    const element = this.viewport()!.nativeElement,
      left = index * element.clientWidth * (this.rtl() ? -1 : 1);
    element.scrollTo({ left, behavior: smooth ? 'smooth' : 'instant' });
  }
  goToSlide(index: number): void {
    this.scrollToIndex(this.clamp(index), true);
  }
  protected slideLabel(index: number): string {
    return this.runtime.text('Carousel.Slide', 'Slide ' + (index + 1), {
      slide: index + 1,
    });
  }
  protected onScroll(): void {
    const element = this.viewport()!.nativeElement;
    if (!element.clientWidth) return;
    const index = this.clamp(
      Math.round(Math.abs(element.scrollLeft) / element.clientWidth),
    );
    if (index !== this.active()) {
      this.active.set(index);
      this.slideChange.emit(index);
    }
  }
  protected touchStart(event: TouchEvent): void {
    this.touchX = event.touches[0]?.clientX ?? 0;
  }
  protected touchEnd(event: TouchEvent): void {
    const delta =
      this.touchX - (event.changedTouches[0]?.clientX ?? this.touchX);
    if (Math.abs(delta) <= 50) return;
    this.goToSlide(
      this.active() + (this.rtl() ? (delta < 0 ? 1 : -1) : delta > 0 ? 1 : -1),
    );
  }
  protected mouseDown(event: MouseEvent): void {
    if (this.disabled()) return;
    if (event.button !== 0) return;
    const element = this.viewport()!.nativeElement;
    this.dragging.set(true);
    this.startX = event.pageX - element.offsetLeft;
    this.startScroll = element.scrollLeft;
  }
  protected mouseMove(event: MouseEvent): void {
    if (!this.dragging()) return;
    event.preventDefault();
    const element = this.viewport()!.nativeElement;
    element.scrollLeft =
      this.startScroll - (event.pageX - element.offsetLeft - this.startX);
  }
  protected mouseUp(event: MouseEvent): void {
    if (!this.dragging()) return;
    this.dragging.set(false);
    const distance =
      this.startX - (event.pageX - this.viewport()!.nativeElement.offsetLeft);
    this.goToSlide(
      this.active() + (Math.abs(distance) > 50 ? (distance > 0 ? 1 : -1) : 0),
    );
  }
  protected mouseLeave(): void {
    if (this.dragging()) {
      this.dragging.set(false);
      this.goToSlide(this.active());
    }
  }
  protected keydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    if (event.target !== this.viewport()!.nativeElement) return;
    const direction =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (direction) {
      event.preventDefault();
      this.goToSlide(this.active() + direction * (this.rtl() ? -1 : 1));
    }
  }

  constructor() {
    effect(() => {
      if (this.presentation() !== 'multi') return;
      const initial = this.defaultIndex(),
        max = this.pageCount() - 1,
        count = this.items().length;
      untracked(() => {
        if (!count) {
          this.active.set(0);
          this.previousDefault = undefined;
        } else if (this.previousDefault !== initial) {
          this.active.set(Math.max(0, Math.min(Math.trunc(initial) || 0, max)));
          this.previousDefault = initial;
        } else this.active.update((index) => Math.min(index, max));
        this.dragPosition.set(null);
      });
    });

    afterRenderEffect((onCleanup) => {
      if (this.presentation() !== 'scroll') return;
      const viewport = this.viewport()!.nativeElement,
        track = this.scrollTrack()!.nativeElement,
        win = viewport.ownerDocument.defaultView;
      if (!win) return;
      const count = () => this.count.set(track.children.length);
      count();
      const Observer = (
        win as Window & { MutationObserver?: typeof MutationObserver }
      ).MutationObserver;
      const mutation = Observer ? new Observer(count) : undefined;
      mutation?.observe(track, { childList: true });
      const Resize = (
        win as Window & { ResizeObserver?: typeof ResizeObserver }
      ).ResizeObserver;
      const resize = Resize
        ? new Resize(() => this.scrollToIndex(this.active(), false))
        : undefined;
      resize?.observe(viewport);
      onCleanup(() => {
        mutation?.disconnect();
        resize?.disconnect();
      });
    });
    afterRenderEffect(() => {
      if (this.presentation() !== 'scroll') return;
      const initial = this.defaultIndex();
      this.direction();
      this.runtime.viewportWidth();
      const target =
        this.previousDefault !== initial
          ? initial
          : untracked(() => this.active());
      this.previousDefault = initial;
      this.active.set(this.clamp(target));
      this.scrollToIndex(this.clamp(target), false);
      this.ready.set(true);
    });
  }
}
