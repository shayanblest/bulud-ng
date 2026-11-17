import {NgTemplateOutlet} from '@angular/common';
import {
  HostBinding,HostListener,afterRenderEffect,OnDestroy,Directive,TemplateRef,contentChild,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  Renderer2,
  signal,
} from '@angular/core';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
let nextId = 0;
/** Project one focusable trigger. Tooltip content is descriptive text, never interactive controls. */
@Directive({selector:'ng-template[buludTooltipContent]',standalone:true})
export class BuludTooltipContent {readonly template=inject<TemplateRef<unknown>>(TemplateRef);}
@Component({
  selector: 'bulud-tooltip',
  imports:[NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './tooltip.css',
  host: {
    '[style]': 'styles()',
    '[class.bulud-tooltip--manual]': "presentation()==='manual'",
    '(pointerenter)': 'enter()',
    '(pointerleave)': 'leave()',
    '(focusin)': 'focus($event)',
    '(focusout)': 'blur($event)',
    '(keydown.escape)': 'dismiss()',
  },
  template: `<ng-content/>@if(presentation()==='manual'){@if(isVisible){<div class="tooltip" role="tooltip" [id]="id"><ng-container [ngTemplateOutlet]="content()?.template??null"/></div>}}@else{@if(open()){<span class="surface tip" role="tooltip" [id]="id">{{text()}}</span>}}`,

})
export class BuludTooltip implements OnDestroy {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  readonly text = input('');
  readonly presentation=input<'automatic'|'manual'>('automatic');
  protected readonly content=contentChild(BuludTooltipContent);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly id = `bulud-tooltip-${nextId++}`;
  protected readonly open = signal(false);
  private hovered = false;
  private trigger: HTMLElement | null = null;
  protected readonly styles = computed(() =>
    buludSharedUiStyles('tooltip', this.config, this.theme()),
  );
  constructor() {
    inject(DestroyRef).onDestroy(() => this.removeDescription());
    afterRenderEffect(() => {
      this.anchor();
      if (this.open()) {
        this.schedulePositionUpdate();
        this.observePositionChanges();
      }
    });
  }
  protected enter(): void {
    if(this.presentation()==='manual')return;
    this.hovered = true;
    this.open.set(true);
  }
  protected leave(): void {
    if(this.presentation()==='manual')return;
    this.hovered = false;
    if (
      !this.host.nativeElement.contains(
        this.host.nativeElement.ownerDocument.activeElement,
      )
    )
      this.dismiss();
  }
  protected focus(event: FocusEvent): void {
    if(this.presentation()==='manual')return;
    this.removeDescription();
    const target = event.target;
    if (target instanceof HTMLElement) {
      this.trigger = target;
      const ids = new Set(
        (target.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .filter(Boolean),
      );
      ids.add(this.id);
      this.renderer.setAttribute(
        target,
        'aria-describedby',
        [...ids].join(' '),
      );
    }
    this.open.set(true);
  }
  protected blur(event: FocusEvent): void {
    if(this.presentation()==='manual')return;
    if (
      event.relatedTarget instanceof Node &&
      this.host.nativeElement.contains(event.relatedTarget)
    )
      return;
    this.removeDescription();
    if (!this.hovered) this.open.set(false);
  }
  protected dismiss(): void {
    if(this.presentation()==='manual'){this.isVisible=false;this.anchor()?.focus();return;}
    this.open.set(false);
    this.removeDescription();
  }
  private removeDescription(): void {
    if (!this.trigger) return;
    const ids = (this.trigger.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((id) => id && id !== this.id);
    if (ids.length)
      this.renderer.setAttribute(
        this.trigger,
        'aria-describedby',
        ids.join(' '),
      );
    else this.renderer.removeAttribute(this.trigger, 'aria-describedby');
    this.trigger = null;
  }
  private describeAnchor():void {const anchor=this.anchor();if(!anchor)return;this.removeDescription();this.trigger=anchor;const ids=new Set((anchor.getAttribute('aria-describedby')??'').split(/\s+/).filter(Boolean));ids.add(this.id);anchor.setAttribute('aria-describedby',[...ids].join(' '));}
  readonly anchor = input<HTMLElement | null>(null);

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private animationFrameId?: number;
  private resizeObserver?: ResizeObserver;

  @HostBinding('class.tooltip-anchor-positioned')
  get hasAnchor(): boolean {
    return !!this.anchor();
  }

  get isVisible(): boolean {
    return this.open();
  }

  set isVisible(value: boolean) {
    if (this.open() === value) {
      return;
    }

    this.open.set(value);
    if(value)this.describeAnchor();else this.removeDescription();

    if (value) {
      this.schedulePositionUpdate();
      this.observePositionChanges();
    } else {
      this.stopObserving();
    }
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.anchor()?.focus();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isVisible) {
      this.schedulePositionUpdate();
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isVisible) {
      this.schedulePositionUpdate();
    }
  }

  @HostListener('document:click', ['$event'])
  clickOut(event: MouseEvent): void {
    if(this.presentation()!=='manual')return;
    const target = event.target as Node | null;
    const host = this.elementRef.nativeElement;
    const parent = host.parentElement;

    if (!target) {
      return;
    }

    if (
      host.contains(target) ||
      this.anchor()?.contains(target) ||
      parent?.contains(target)
    ) {
      return;
    }

    this.isVisible = false;
  }

  private schedulePositionUpdate(): void {
    const windowRef = this.elementRef.nativeElement.ownerDocument.defaultView;

    if (!windowRef) {
      return;
    }

    if (this.animationFrameId !== undefined) {
      windowRef.cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = windowRef.requestAnimationFrame(() => {
      this.updatePosition();
      this.animationFrameId = undefined;
    });
  }

  private updatePosition(): void {
    if (!this.anchor() || !this.isVisible) {
      return;
    }

    const host = this.elementRef.nativeElement;
    const offsetParent = host.offsetParent as HTMLElement | null;

    if (!offsetParent) {
      return;
    }

    const tooltipRect = host.getBoundingClientRect();
    const anchorRect = this.anchor()!.getBoundingClientRect();
    const parentRect = offsetParent.getBoundingClientRect();

    if (!tooltipRect.width) {
      return;
    }

    const windowRef = host.ownerDocument.defaultView;

    if (!windowRef) {
      return;
    }

    const viewportPadding = 12;
    const arrowPadding = 12;

    const anchorCenter = anchorRect.left + anchorRect.width / 2;

    const desiredViewportLeft = anchorCenter - tooltipRect.width / 2;

    const maximumViewportLeft = Math.max(
      viewportPadding,
      windowRef.innerWidth - tooltipRect.width - viewportPadding,
    );

    const viewportLeft = Math.min(
      Math.max(desiredViewportLeft, viewportPadding),
      maximumViewportLeft,
    );

    const tooltipLeft =
      viewportLeft - parentRect.left + offsetParent.scrollLeft;

    const arrowLeft = Math.min(
      Math.max(anchorCenter - viewportLeft, arrowPadding),
      tooltipRect.width - arrowPadding,
    );

    host.style.insetInlineStart = 'auto';
    host.style.insetInlineEnd = 'auto';
    host.style.right = 'auto';
    host.style.left = `${tooltipLeft}px`;

    host.style.setProperty('--tooltip-arrow-left', `${arrowLeft}px`);
  }

  private observePositionChanges(): void {
    this.stopObserving();

    if (!this.anchor() || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.schedulePositionUpdate();
    });

    this.resizeObserver.observe(this.anchor()!);

    const parent = this.elementRef.nativeElement.parentElement;

    if (parent) {
      this.resizeObserver.observe(parent);
    }
  }

  private stopObserving(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  ngOnDestroy(): void {
    const windowRef = this.elementRef.nativeElement.ownerDocument.defaultView;

    if (windowRef && this.animationFrameId !== undefined) {
      windowRef.cancelAnimationFrame(this.animationFrameId);
    }

    this.stopObserving();
  }

}
