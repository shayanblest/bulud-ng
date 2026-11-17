import {
  Directive,
  ElementRef,
  HostListener,
  input,
  model,
  OnDestroy,
  output,
  inject,
  signal,
} from '@angular/core';

/** Imperative dialog controls and mobile swipe lifecycle, with no application services. */
@Directive({
  selector: 'bulud-dialog[buludModalControl]',
  exportAs: 'buludModalControl',
  standalone: true,
})
export class BuludModalControl implements OnDestroy {
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly isOpen = signal(false);
  readonly closable = model(true);
  readonly appendToBody = input(false);
  readonly modalClose = output<void>();
  private startY = 0;
  private translation = 0;
  private slideDown = false;

  open(): void {
    if (
      this.appendToBody() &&
      this.element.parentElement !== this.element.ownerDocument.body
    ) {
      this.element.ownerDocument.body.appendChild(this.element);
    }
    this.isOpen.set(true);
  }

  close(emitEvent = true): void {
    if (!this.closable()) return;
    this.isOpen.set(false);
    this.resetModalState();
    if (emitEvent) this.modalClose.emit();
  }

  @HostListener('click', ['$event'])
  closeBackdrop(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.matches('.bulud-dialog__backdrop, .bulud-dialog__surface'))
      this.close();
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (!this.closable()) return;
    this.startY = event.touches[0].clientY;
    this.slideDown = false;
    this.panel?.classList.remove('animate-back', 'slide-down');
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.closable()) return;
    this.translation = Math.max(0, event.touches[0].clientY - this.startY);
    if (this.panel)
      this.panel.style.transform = `translateY(${this.translation}px)`;
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    if (!this.closable()) return;
    this.slideDown = this.translation > 150;
    this.panel?.classList.add(this.slideDown ? 'slide-down' : 'animate-back');
    if (!this.slideDown && this.panel)
      this.panel.style.transform = 'translateY(0px)';
  }

  @HostListener('transitionend', ['$event'])
  onTransitionEnd(event: TransitionEvent): void {
    if (event.target !== this.panel || event.propertyName !== 'transform')
      return;
    if (this.slideDown) this.close();
    this.resetModalState();
  }

  private get panel(): HTMLElement | null {
    return this.element.querySelector('.modal');
  }

  private resetModalState(): void {
    this.translation = 0;
    this.slideDown = false;
    if (this.panel) {
      this.panel.style.transform = 'translateY(0px)';
      this.panel.classList.remove('animate-back', 'slide-down');
    }
  }

  ngOnDestroy(): void {
    // Destruction must not execute parent close handlers that reset payment forms.
    this.isOpen.set(false);
  }
}
