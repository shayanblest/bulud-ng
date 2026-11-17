import {
  afterNextRender,
  Injector,
  ElementRef,
  runInInjectionContext,
  DOCUMENT,
  computed,
  signal,
  input,
  ViewEncapsulation,
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  Renderer2,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuludTourTooltip } from './tour-tooltip';
import { BuludRuntime } from 'bulud-ng/runtime';
import { BuludTourTheme, buludTourStyles } from './tour.types';
import { BuludTourStep as TourStep } from './tour.types';
import { BuludTour as TourService } from './tour.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'bulud-tour-overlay',
  imports: [CommonModule, BuludTourTooltip],
  templateUrl: './tour-overlay.html',
  styleUrl: './tour.css',
  encapsulation: ViewEncapsulation.None,
  host: { '[style]': 'styles()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class BuludTourOverlay implements OnInit, OnDestroy {
  private readonly stepState = signal<TourStep | null>(null);
  get step(): TourStep | null {
    return this.stepState();
  }
  set step(value: TourStep | null) {
    this.stepState.set(value);
  }
  private readonly highlightStyleState = signal<Record<string, string>>({
    display: 'none',
  });
  get highlightStyle(): Record<string, string> {
    return this.highlightStyleState();
  }
  set highlightStyle(value: Record<string, string>) {
    this.highlightStyleState.set(value);
  }
  private readonly tooltipStyleState = signal<Record<string, string>>({});
  get tooltipStyle(): Record<string, string> {
    return this.tooltipStyleState();
  }
  set tooltipStyle(value: Record<string, string>) {
    this.tooltipStyleState.set(value);
  }
  private readonly isTransitioningState = signal<boolean>(false);
  get isTransitioning(): boolean {
    return this.isTransitioningState();
  }
  set isTransitioning(value: boolean) {
    this.isTransitioningState.set(value);
  }
  private readonly totalState = signal<number>(0);
  get total(): number {
    return this.totalState();
  }
  set total(value: number) {
    this.totalState.set(value);
  }
  private readonly currentIndexState = signal<number>(0);
  get currentIndex(): number {
    return this.currentIndexState();
  }
  set currentIndex(value: number) {
    this.currentIndexState.set(value);
  }
  private readonly isPositionedState = signal<boolean>(false);
  get isPositioned(): boolean {
    return this.isPositionedState();
  }
  set isPositioned(value: boolean) {
    this.isPositionedState.set(value);
  }
  private readonly isTourActiveState = signal<boolean>(false);
  get isTourActive(): boolean {
    return this.isTourActiveState();
  }
  set isTourActive(value: boolean) {
    this.isTourActiveState.set(value);
  }
  private positionRunId = 0;
  private activeTarget: HTMLElement | null = null;
  private targetResize?: ResizeObserver;
  private targetPresence?: MutationObserver;
  private readonly followTarget = () => this.onResize();
  private watchTarget(el: HTMLElement): void {
    this.targetResize?.disconnect();
    this.targetPresence?.disconnect();
    this.document.removeEventListener('scroll', this.followTarget, true);
    if (typeof ResizeObserver !== 'undefined') {
      this.targetResize = new ResizeObserver(this.followTarget);
      this.targetResize.observe(el);
    }
    this.targetPresence = new MutationObserver(() => {
      if (this.isTourActive && !el.isConnected) this.close();
    });
    this.targetPresence.observe(this.document.body, {
      childList: true,
      subtree: true,
    });
    this.document.addEventListener('scroll', this.followTarget, true);
  }
  private readonly document = inject(DOCUMENT);
  private readonly runtime = inject(BuludRuntime);
  private readonly injector = inject(Injector);
  private get window(): Window {
    return this.document.defaultView!;
  }
  get isRtl(): boolean {
    return this.runtime.direction() === 'rtl';
  }
  private focusOrigin: HTMLElement | null = null;
  private guardsRegistered = false;
  readonly theme = input<BuludTourTheme>();
  protected readonly styles = computed(() =>
    buludTourStyles(this.tour.config, this.theme()),
  );
  private rendered(callback: () => void): void {
    runInInjectionContext(this.injector, () => afterNextRender(callback));
  }
  private readonly tour = inject(TourService);
  private readonly renderer = inject(Renderer2);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (!this.document.defaultView) return;

    this.tour.active$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((active) => {
        this.isTourActive = active;

        if (active) {
          if (!this.guardsRegistered) {
            this.focusOrigin =
              this.document.activeElement instanceof HTMLElement
                ? this.document.activeElement
                : null;
            this.registerInteractionGuards();
          }
          this.renderer.addClass(this.document.body, 'tour-freeze');

          this.rendered(() => this.focusTourControls());
        } else {
          this.unregisterInteractionGuards();
          this.unlockPage();
          if (this.focusOrigin?.isConnected)
            this.focusOrigin.focus({ preventScroll: true });
          this.focusOrigin = null;
        }
      });

    this.tour.total$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((total) => {
        this.total = total;
      });

    this.tour.currentIndex$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((index) => {
        this.currentIndex = index >= 0 ? index + 1 : 0;
      });

    this.tour.step$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((step) => {
        const runId = ++this.positionRunId;

        this.step = step;
        this.isPositioned = false;

        this.highlightStyle = {
          display: 'none',
        };

        this.removeActiveTarget();

        if (!step) {
          this.isTransitioning = false;

          return;
        }

        this.isTransitioning = true;

        void this.positionStep(step, runId);
      });
  }
  private getScrollableParent(el: HTMLElement): HTMLElement | Window {
    let parent = el.parentElement;

    while (parent) {
      const style = this.window.getComputedStyle(parent);
      const overflowY = style.overflowY;

      const canScroll =
        (overflowY === 'auto' || overflowY === 'scroll') &&
        parent.scrollHeight > parent.clientHeight;

      if (canScroll) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return this.window;
  }
  private async positionStep(step: TourStep, runId: number): Promise<void> {
    const el = await this.waitForTarget(step.targetId, runId);

    if (!this.isCurrentPositionRun(runId)) {
      return;
    }

    if (!el) {
      this.close();
      return;
    }

    try {
      await this.tour.config.prepareTarget?.(el, step);
    } catch {
      if (this.isCurrentPositionRun(runId)) this.close();
      return;
    }

    await this.waitForElementStable(el, runId);

    if (!this.isCurrentPositionRun(runId)) {
      return;
    }

    const isMobile = this.window.innerWidth < 992;
    const scrollParent = this.getScrollableParent(el);

    this.scrollTargetIntoView(el, isMobile, scrollParent);

    await this.waitForScrollSettled(scrollParent, el, runId);

    if (!this.isCurrentPositionRun(runId)) {
      return;
    }

    await this.waitForElementStable(el, runId);

    if (!this.isCurrentPositionRun(runId)) {
      return;
    }

    if (
      !el.isConnected ||
      !el.getBoundingClientRect().width ||
      !el.getBoundingClientRect().height
    ) {
      this.close();
      return;
    }

    this.setTooltipPosition(el);
    this.watchTarget(el);

    this.isTransitioning = false;

    this.rendered(() => this.focusTourControls());
  }
  private scrollTargetIntoView(
    el: HTMLElement,
    isMobile: boolean,
    scrollParent: HTMLElement | Window,
  ): void {
    if (scrollParent === this.window) {
      el.scrollIntoView({
        behavior: isMobile ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      return;
    }

    const parent = scrollParent as HTMLElement;
    const parentRect = parent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const verticalPosition = isMobile ? 0.35 : 0.5;

    const offsetTop =
      elRect.top -
      parentRect.top +
      parent.scrollTop -
      parent.clientHeight * verticalPosition +
      elRect.height / 2;

    parent.scrollTo({
      top: Math.max(0, offsetTop),
      behavior: isMobile ? 'auto' : 'smooth',
    });
  }
  private waitForTarget(
    targetId: string,
    runId: number,
    timeout = this.tour.config.targetTimeout ?? 2000,
  ): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      const startedAt = performance.now();

      const check = () => {
        if (!this.isCurrentPositionRun(runId)) {
          resolve(null);
          return;
        }

        const el = this.document.getElementById(targetId);

        if (el) {
          resolve(el);
          return;
        }

        if (performance.now() - startedAt >= timeout) {
          resolve(null);
          return;
        }

        requestAnimationFrame(check);
      };

      check();
    });
  }
  private waitForElementStable(
    el: HTMLElement,
    runId: number,
    timeout = 2000,
  ): Promise<void> {
    return new Promise((resolve) => {
      const startedAt = performance.now();

      let previousRect = el.getBoundingClientRect();
      let stableFrames = 0;

      const check = () => {
        if (!this.isCurrentPositionRun(runId) || !el.isConnected) {
          resolve();
          return;
        }

        const currentRect = el.getBoundingClientRect();

        const isVisible = currentRect.width > 0 && currentRect.height > 0;

        const isStable =
          Math.abs(currentRect.top - previousRect.top) < 0.5 &&
          Math.abs(currentRect.left - previousRect.left) < 0.5 &&
          Math.abs(currentRect.width - previousRect.width) < 0.5 &&
          Math.abs(currentRect.height - previousRect.height) < 0.5;

        if (isVisible && isStable) {
          stableFrames++;
        } else {
          stableFrames = 0;
        }

        previousRect = currentRect;

        const timedOut = performance.now() - startedAt >= timeout;

        if (stableFrames >= 4 || timedOut) {
          resolve();
          return;
        }

        requestAnimationFrame(check);
      };

      requestAnimationFrame(check);
    });
  }
  private waitForScrollSettled(
    scrollParent: HTMLElement | Window,
    el: HTMLElement,
    runId: number,
    timeout = 3500,
  ): Promise<void> {
    return new Promise((resolve) => {
      const startedAt = performance.now();

      let previousScrollPosition = this.getScrollPosition(scrollParent);

      let previousElementTop = el.getBoundingClientRect().top;

      let stableFrames = 0;

      const check = () => {
        if (!this.isCurrentPositionRun(runId) || !el.isConnected) {
          resolve();
          return;
        }

        const currentScrollPosition = this.getScrollPosition(scrollParent);

        const currentElementTop = el.getBoundingClientRect().top;

        const scrollIsStable =
          Math.abs(currentScrollPosition - previousScrollPosition) < 0.5;

        const elementIsStable =
          Math.abs(currentElementTop - previousElementTop) < 0.5;

        if (scrollIsStable && elementIsStable) {
          stableFrames++;
        } else {
          stableFrames = 0;
        }

        previousScrollPosition = currentScrollPosition;
        previousElementTop = currentElementTop;

        const timedOut = performance.now() - startedAt >= timeout;

        if (stableFrames >= 5 || timedOut) {
          resolve();
          return;
        }

        requestAnimationFrame(check);
      };

      requestAnimationFrame(check);
    });
  }
  private setTooltipPosition(el: HTMLElement) {
    if (this.activeTarget !== el) {
      this.activeTarget?.classList.remove('tour-active');
      this.activeTarget?.removeAttribute('data-bulud-tour-active');
    }
    this.activeTarget = el;
    el.classList.add('tour-active');
    el.setAttribute('data-bulud-tour-active', '');

    const rect = el.getBoundingClientRect();
    const viewportHeight = this.window.innerHeight;
    const viewportWidth = this.window.innerWidth;
    const isMobile = viewportWidth < 992;

    this.highlightStyle = {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      position: 'fixed',
      'box-shadow':
        this.step?.showBackdrop === false
          ? 'none'
          : '0 0 0 9999px var(--bulud-tour-backdrop,rgba(0,0,0,.7))',
      'border-radius': 'var(--bulud-tour-radius,12px)',
      'z-index': 'calc(var(--bulud-tour-z-index,2147483000) + 1)',
      'pointer-events': 'none',
    };

    const finalStyle: Record<string, string> = {
      position: 'fixed',
      'z-index': 'calc(var(--bulud-tour-z-index,2147483000) + 3)',
    };

    if (this.step?.position === 'bottom') {
      const width = isMobile
        ? viewportWidth - 32
        : Math.min(320, viewportWidth - 32);
      finalStyle['width'] = `${width}px`;
      finalStyle['left'] =
        `${Math.max(16, Math.min(this.isRtl ? rect.right - width : rect.left, viewportWidth - width - 16))}px`;
      // Render within the viewport before measuring translated content.
      finalStyle['top'] = '16px';
    } else if (isMobile) {
      finalStyle['width'] = 'calc(100% - 32px)';
      finalStyle['left'] = '16px';

      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      const tooltipHeight = 180;

      if (spaceBelow > tooltipHeight + 20) {
        finalStyle['top'] = `${rect.bottom + 15}px`;
        finalStyle['bottom'] = 'auto';
      } else if (spaceAbove > tooltipHeight + 20) {
        finalStyle['bottom'] = `${viewportHeight - rect.top + 15}px`;
        finalStyle['top'] = 'auto';
      } else {
        finalStyle['bottom'] = 'env(safe-area-inset-bottom, 20px)';
        finalStyle['top'] = 'auto';
        finalStyle['left'] = '16px';
        finalStyle['right'] = '16px';
        finalStyle['width'] = 'auto';
      }
    } else {
      const gap = 20;
      const margin = 16;

      const tooltipWidth = Math.min(320, viewportWidth - margin * 2);
      finalStyle['width'] = `${tooltipWidth}px`;

      if (viewportHeight - rect.top < 220) {
        finalStyle['bottom'] = `${viewportHeight - rect.bottom}px`;
        finalStyle['top'] = 'auto';
      } else {
        finalStyle['top'] = `${rect.top}px`;
        finalStyle['bottom'] = 'auto';
      }

      const isRtl = this.isRtl;

      let desiredLeft: number;

      if (isRtl) {
        if (rect.left > tooltipWidth + gap) {
          desiredLeft = rect.left - tooltipWidth - gap;
        } else {
          desiredLeft = rect.right + gap;
        }
      } else {
        if (viewportWidth - rect.right > tooltipWidth + gap) {
          desiredLeft = rect.right + gap;
        } else {
          desiredLeft = rect.left - tooltipWidth - gap;
        }
      }
      const minLeft = margin;
      const maxLeft = viewportWidth - tooltipWidth - margin;

      finalStyle['left'] = `${Math.max(
        minLeft,
        Math.min(desiredLeft, maxLeft),
      )}px`;
      finalStyle['right'] = 'auto';
    }

    this.tooltipStyle = finalStyle;
    this.isPositioned = true;

    // Measure actual translated content and consumer width, then clamp all placements.
    if (!isMobile)
      this.tooltipStyle = {
        ...finalStyle,
        width: 'min(var(--bulud-tour-width,320px),calc(100vw - 32px))',
      };
    const runId = this.positionRunId;
    this.rendered(() => {
      if (!this.isCurrentPositionRun(runId) || this.activeTarget !== el) return;
      const tooltip =
        this.element.nativeElement.querySelector<HTMLElement>('.tour-tooltip');
      const host = tooltip?.closest('bulud-tour-tooltip');
      if (!tooltip || !host) return;
      const bounds = host.getBoundingClientRect();
      const height = Math.min(
        tooltip.getBoundingClientRect().height,
        viewportHeight - 32,
      );
      let top = bounds.top;
      if (this.step?.position === 'bottom') {
        const below = rect.bottom + 12;
        const above = rect.top - height - 12;
        top =
          below + height <= viewportHeight - 16
            ? below
            : above >= 16
              ? above
              : viewportHeight - height - 16;
      }
      this.tooltipStyle = {
        ...this.tooltipStyle,
        top: `${Math.max(16, Math.min(top, viewportHeight - height - 16))}px`,
        left: `${Math.max(16, Math.min(bounds.left, viewportWidth - bounds.width - 16))}px`,
        bottom: 'auto',
        right: 'auto',
      };
    });
  }

  next(): void {
    if (!this.isTourActive || this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;
    this.tour.next();
  }
  previous(): void {
    if (!this.isTourActive || this.isTransitioning || this.currentIndex <= 1) {
      return;
    }
    this.isTransitioning = true;
    this.tour.previous();
  }

  @HostListener('window:resize')
  onResize(): void {
    const target =
      this.step && this.document.getElementById(this.step.targetId);
    if (target && this.isPositioned && !this.isTransitioning) {
      this.setTooltipPosition(target);
    }
  }
  close(): void {
    this.positionRunId++;
    this.isTransitioning = false;

    this.removeActiveTarget();
    this.tour.end();
  }
  blockInteraction(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
  ngOnDestroy(): void {
    this.positionRunId++;
    this.isTransitioning = false;

    this.unregisterInteractionGuards();
    const wasActive = this.isTourActive;
    this.unlockPage();

    if (wasActive) {
      this.tour.end();
    }
  }
  private unlockPage(): void {
    this.isTourActive = false;
    this.isPositioned = false;
    this.isTransitioning = false;
    this.step = null;

    this.highlightStyle = {
      display: 'none',
    };

    this.tooltipStyle = {};

    this.renderer.removeClass(this.document.body, 'tour-freeze');

    this.removeActiveTarget();
  }
  private registerInteractionGuards(): void {
    if (this.guardsRegistered) return;
    this.guardsRegistered = true;
    this.document.addEventListener('keydown', this.handleDocumentKeydown, true);

    this.document.addEventListener('focusin', this.handleDocumentFocus, true);
  }
  private unregisterInteractionGuards(): void {
    if (!this.guardsRegistered) return;
    this.guardsRegistered = false;
    this.document.removeEventListener(
      'keydown',
      this.handleDocumentKeydown,
      true,
    );

    this.document.removeEventListener(
      'focusin',
      this.handleDocumentFocus,
      true,
    );
  }
  private readonly handleDocumentKeydown = (event: KeyboardEvent): void => {
    if (!this.isTourActive) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    const tooltip =
      this.element.nativeElement.querySelector<HTMLElement>('.tour-tooltip');
    const target = event.target as Node | null;

    if (!tooltip || !target || !tooltip.contains(target)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      this.focusTourControls();
      return;
    }
    if (event.key === 'Tab') {
      this.trapTooltipFocus(event, tooltip);
    }
  };
  private readonly handleDocumentFocus = (event: FocusEvent): void => {
    if (!this.isTourActive) {
      return;
    }

    const target = event.target as HTMLElement | null;

    if (
      target &&
      this.element.nativeElement.contains(target) &&
      (target.closest('.tour-tooltip') || target.closest('.tour-backdrop'))
    ) {
      return;
    }

    event.stopPropagation();
    event.stopImmediatePropagation();

    this.rendered(() => this.focusTourControls());
  };

  private trapTooltipFocus(event: KeyboardEvent, tooltip: HTMLElement): void {
    const focusableElements = Array.from(
      tooltip.querySelectorAll<HTMLElement>(
        [
          'button:not([disabled])',
          'a[href]',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(','),
      ),
    );

    if (!focusableElements.length) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = this.document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
  private getScrollPosition(scrollParent: HTMLElement | Window): number {
    if (scrollParent === this.window) {
      return (
        this.window.scrollY || this.document.documentElement.scrollTop || 0
      );
    }

    return (scrollParent as HTMLElement).scrollTop;
  }
  private isCurrentPositionRun(runId: number): boolean {
    return (
      runId === this.positionRunId && this.isTourActive && this.step !== null
    );
  }
  private removeActiveTarget(): void {
    this.targetResize?.disconnect();
    this.targetPresence?.disconnect();
    this.document.removeEventListener('scroll', this.followTarget, true);
    this.activeTarget?.classList.remove('tour-active');
    this.activeTarget?.removeAttribute('data-bulud-tour-active');
    this.activeTarget = null;
  }
  private focusTourControls(): void {
    if (!this.isTourActive) {
      return;
    }

    const firstButton = this.element.nativeElement.querySelector<HTMLElement>(
      '.tour-tooltip button:not([disabled])',
    );

    const backdrop =
      this.element.nativeElement.querySelector<HTMLElement>('.tour-backdrop');

    const elementToFocus = firstButton ?? backdrop;

    elementToFocus?.focus({
      preventScroll: true,
    });
  }
}
