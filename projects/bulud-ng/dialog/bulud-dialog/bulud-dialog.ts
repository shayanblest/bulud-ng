import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  Injector,
  input,
  model,
  output,
  runInInjectionContext,
  viewChild,
} from '@angular/core';

import { BuludDialogTheme } from 'bulud-ng';

export type BuludDialogCloseReason = 'escape' | 'backdrop';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'video[controls]',
  'audio[controls]',
  '[contenteditable="true"]',
  '[tabindex]',
].join(',');

interface DialogStackEntry {
  readonly handleKeydown: (event: KeyboardEvent) => void;
  readonly handleFocusin: (event: FocusEvent) => void;
}

interface DialogRegistry {
  readonly stack: DialogStackEntry[];
  readonly keydown: EventListener;
  readonly focusin: EventListener;
}

interface BodyScrollLockState {
  count: number;
  previousOverflow: string;
}

const dialogRegistries = new WeakMap<Document, DialogRegistry>();
const bodyScrollLocks = new WeakMap<Document, BodyScrollLockState>();

function registerDialog(document: Document, entry: DialogStackEntry): void {
  let registry = dialogRegistries.get(document);

  if (!registry) {
    const stack: DialogStackEntry[] = [];
    registry = {
      stack,
      keydown: (event) => stack.at(-1)?.handleKeydown(event as KeyboardEvent),
      focusin: (event) => stack.at(-1)?.handleFocusin(event as FocusEvent),
    };
    dialogRegistries.set(document, registry);
    document.addEventListener('keydown', registry.keydown, true);
    document.addEventListener('focusin', registry.focusin, true);
  }

  registry.stack.push(entry);
}

function unregisterDialog(
  document: Document,
  entry: DialogStackEntry,
): boolean {
  const registry = dialogRegistries.get(document);
  if (!registry) {
    return false;
  }

  const index = registry.stack.indexOf(entry);
  if (index < 0) {
    return false;
  }

  const wasTop = index === registry.stack.length - 1;
  registry.stack.splice(index, 1);

  if (registry.stack.length === 0) {
    document.removeEventListener('keydown', registry.keydown, true);
    document.removeEventListener('focusin', registry.focusin, true);
    dialogRegistries.delete(document);
  }

  return wasTop;
}

function lockBodyScroll(document: Document): void {
  const state = bodyScrollLocks.get(document) ?? {
    count: 0,
    previousOverflow: document.body.style.overflow,
  };

  if (state.count === 0) {
    state.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  state.count += 1;
  bodyScrollLocks.set(document, state);
}

function unlockBodyScroll(document: Document): void {
  const state = bodyScrollLocks.get(document);
  if (!state) {
    return;
  }

  state.count = Math.max(0, state.count - 1);
  if (state.count === 0) {
    document.body.style.overflow = state.previousOverflow;
    bodyScrollLocks.delete(document);
  }
}

function isFocusableElement(element: HTMLElement): boolean {
  const tabindex = element.getAttribute('tabindex');
  if (tabindex !== null && Number.parseInt(tabindex, 10) < 0) {
    return false;
  }

  if (element.matches(':disabled')) {
    return false;
  }

  for (
    let current: HTMLElement | null = element;
    current;
    current = current.parentElement
  ) {
    if (
      current.hidden ||
      current.getAttribute('aria-hidden') === 'true' ||
      current.hasAttribute('inert')
    ) {
      return false;
    }

    const style = current.ownerDocument.defaultView?.getComputedStyle(current);
    if (style?.display === 'none' || style?.visibility === 'hidden') {
      return false;
    }
  }

  return true;
}

/**
 * A composable modal dialog with projected content and APG modal behavior.
 *
 * Consumers provide the accessible name with `aria-label` or
 * `aria-labelledby`, and can use `aria-describedby` for supporting text.
 */
@Component({
  selector: 'bulud-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bulud-dialog.html',
  styleUrl: './bulud-dialog.scss',
})
export class BuludDialog {
  private static nextId = 0;

  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly instanceId = `bulud-dialog-${BuludDialog.nextId++}`;
  private wasOpen = false;
  private restoreTarget: HTMLElement | null = null;
  private readonly stackEntry: DialogStackEntry = {
    handleKeydown: (event) => this.handleDocumentKeydown(event),
    handleFocusin: (event) => this.handleDocumentFocusin(event),
  };

  /** Controlled open state. Use `[(open)]` for two-way binding. */
  readonly open = model(false);

  /** Accessible name supplied directly to the dialog. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** ID of an element that labels the dialog. */
  readonly ariaLabelledby = input<string | null>(null, {
    alias: 'aria-labelledby',
  });

  /** IDs of elements that describe the dialog. */
  readonly ariaDescribedby = input<string | null>(null, {
    alias: 'aria-describedby',
  });

  /** Allows Escape to request closing. */
  readonly closeOnEscape = input(true, { transform: booleanAttribute });

  /** Allows a pointerdown on the backdrop to request closing. */
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });

  /** CSS selector for the element receiving initial focus. */
  readonly initialFocus = input<string | undefined>(undefined);

  /** Instance-level dialog CSS custom-property overrides. */
  readonly theme = input<Partial<BuludDialogTheme>>({});

  /** Emitted only for user-initiated close requests. */
  readonly closeRequest = output<BuludDialogCloseReason>();

  protected readonly dialogId = computed(() => `${this.instanceId}-surface`);
  protected readonly instanceStyles = computed(() => {
    const override = this.theme();
    return {
      '--bulud-dialog-backdrop': override.backdrop,
      '--bulud-dialog-background': override.background,
      '--bulud-dialog-foreground': override.foreground,
      '--bulud-dialog-border': override.border,
      '--bulud-dialog-radius': override.radius,
      '--bulud-dialog-shadow': override.shadow,
      '--bulud-dialog-padding': override.padding,
      '--bulud-dialog-max-width': override.maxWidth,
      '--bulud-dialog-focus': override.focus,
    };
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.wasOpen) {
        const wasTop = this.detachListeners();
        unlockBodyScroll(this.document);
        if (wasTop) {
          this.restoreFocus();
        } else {
          this.restoreTarget = null;
        }
      }
    });

    // The render callback runs after the projected content exists, which lets
    // dynamic projected controls participate in initial focus and trapping.
    const checkState = (): void => {
      const isOpen = this.open();

      if (isOpen && !this.wasOpen) {
        this.restoreTarget = this.focusedElement();
        this.wasOpen = true;
        this.attachListeners();
        lockBodyScroll(this.document);
        runInInjectionContext(this.injector, () =>
          afterNextRender(() => {
            if (this.open()) {
              this.focusInitialTarget();
            }
          }),
        );
      } else if (!isOpen && this.wasOpen) {
        this.wasOpen = false;
        const wasTop = this.detachListeners();
        unlockBodyScroll(this.document);
        if (wasTop) {
          this.restoreFocus();
        } else {
          this.restoreTarget = null;
        }
      }
    };

    // Reading the model in an effect keeps this synchronized in zoneless
    // applications without timers or manual change detection.
    effect(checkState);
  }

  /** Closes the dialog as a programmatic action. */
  close(): void {
    if (this.open()) {
      this.open.set(false);
    }
  }

  protected requestClose(reason: BuludDialogCloseReason): void {
    if (!this.open()) {
      return;
    }

    this.closeRequest.emit(reason);
    this.close();
  }

  protected handleBackdropPointerdown(event: PointerEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.requestClose('backdrop');
    }
  }

  private attachListeners(): void {
    registerDialog(this.document, this.stackEntry);
  }

  private detachListeners(): boolean {
    return unregisterDialog(this.document, this.stackEntry);
  }

  private readonly handleDocumentKeydown = (event: KeyboardEvent): void => {
    if (!this.open()) {
      return;
    }

    if (event.key === 'Escape') {
      if (this.closeOnEscape()) {
        event.preventDefault();
        event.stopPropagation();
        this.requestClose('escape');
      }
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const surface = this.panel()?.nativeElement;
    if (!surface) {
      return;
    }

    const focusable = this.focusableElements(surface);
    if (focusable.length === 0) {
      event.preventDefault();
      surface.focus();
      return;
    }

    const active = this.document.activeElement;
    const activeIndex = focusable.indexOf(active as HTMLElement);
    if (event.shiftKey) {
      if (activeIndex <= 0) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      }
    } else if (activeIndex === focusable.length - 1) {
      event.preventDefault();
      focusable[0].focus();
    }
  };

  private readonly handleDocumentFocusin = (event: FocusEvent): void => {
    const surface = this.panel()?.nativeElement;
    const target = event.target;
    if (!surface || !(target instanceof Node) || surface.contains(target)) {
      return;
    }

    this.focusInitialTarget();
  };

  private focusInitialTarget(): void {
    const surface = this.panel()?.nativeElement;
    if (!surface) {
      return;
    }

    const requested = this.initialFocus();
    const explicit = requested ? this.queryFocusable(surface, requested) : null;
    const target = explicit ?? this.focusableElements(surface)[0] ?? surface;
    target.focus();
  }

  private queryFocusable(
    surface: HTMLElement,
    selector: string,
  ): HTMLElement | null {
    try {
      const element = surface.querySelector<HTMLElement>(selector);
      return element && isFocusableElement(element) ? element : null;
    } catch {
      return null;
    }
  }

  private focusableElements(surface: HTMLElement): HTMLElement[] {
    return Array.from(
      surface.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((element) => isFocusableElement(element));
  }

  private focusedElement(): HTMLElement | null {
    const active = this.document.activeElement;
    return active instanceof HTMLElement ? active : null;
  }

  private restoreFocus(): void {
    const target = this.restoreTarget;
    this.restoreTarget = null;
    if (target?.isConnected && isFocusableElement(target)) {
      target.focus();
    }
  }
}
