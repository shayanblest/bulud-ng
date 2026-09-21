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
  signal,
  viewChild,
} from '@angular/core';

import { BuludDialogTheme } from 'bulud-ng';

export type BuludDialogCloseReason = 'escape' | 'backdrop';

interface DialogStackEntry {
  readonly handleKeydown: (event: KeyboardEvent) => void;
  readonly handleFocusin: (event: FocusEvent) => void;
  readonly getRestoreTarget: () => HTMLElement | null;
  readonly setRestoreTarget: (target: HTMLElement | null) => void;
  readonly setStackLevel: (level: number) => void;
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

function updateStackLevels(stack: readonly DialogStackEntry[]): void {
  stack.forEach((entry, index) => entry.setStackLevel(index));
}

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
  updateStackLevels(registry.stack);
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
  if (!wasTop) {
    registry.stack[index + 1].setRestoreTarget(entry.getRestoreTarget());
  }
  registry.stack.splice(index, 1);
  updateStackLevels(registry.stack);

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

function isUnavailableElement(element: HTMLElement): boolean {
  if (element.matches(':disabled')) {
    return true;
  }

  for (
    let current: HTMLElement | null = element;
    current;
    current = current.parentElement
  ) {
    if (
      current !== element &&
      current.localName === 'details' &&
      !(current as HTMLDetailsElement).open
    ) {
      const firstSummary = Array.from(current.children).find(
        (child) => child.localName === 'summary',
      );
      if (element !== firstSummary) {
        return true;
      }
    }

    if (
      current.hidden ||
      current.getAttribute('aria-hidden') === 'true' ||
      current.hasAttribute('inert')
    ) {
      return true;
    }

    const style = current.ownerDocument.defaultView?.getComputedStyle(current);
    if (style?.display === 'none' || style?.visibility === 'hidden') {
      return true;
    }
  }

  return false;
}

function hasNonNegativeTabIndex(element: HTMLElement): boolean {
  const tabindex = element.getAttribute('tabindex');
  return (
    tabindex !== null &&
    /^[-+]?\d+$/.test(tabindex.trim()) &&
    Number.parseInt(tabindex, 10) >= 0
  );
}

function hasExplicitTabIndex(element: HTMLElement): boolean {
  const tabindex = element.getAttribute('tabindex');
  return tabindex !== null && /^[-+]?\d+$/.test(tabindex.trim());
}

function isContentEditableElement(element: HTMLElement): boolean {
  const ownValue = element.getAttribute('contenteditable');
  if (ownValue !== null) {
    const normalizedOwnValue = ownValue.trim().toLowerCase();
    if (normalizedOwnValue === 'false') {
      return false;
    }
    if (
      normalizedOwnValue === '' ||
      normalizedOwnValue === 'true' ||
      normalizedOwnValue === 'plaintext-only'
    ) {
      return true;
    }
  }

  const contentEditable = (
    element as HTMLElement & {
      readonly isContentEditable?: boolean;
    }
  ).isContentEditable;
  if (contentEditable === true) {
    return contentEditable;
  }
  for (
    let current: HTMLElement | null = element;
    current;
    current = current.parentElement
  ) {
    const value = current.getAttribute('contenteditable');
    if (value === null) {
      continue;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'false') {
      return false;
    }
    if (
      normalized === '' ||
      normalized === 'true' ||
      normalized === 'plaintext-only'
    ) {
      return true;
    }
  }

  return false;
}

function isFirstSummary(element: HTMLElement): boolean {
  if (element.localName !== 'summary') {
    return false;
  }

  const details = element.parentElement;
  if (!details || details.localName !== 'details') {
    return false;
  }

  return (
    Array.from(details.children).find(
      (child) => child.localName === 'summary',
    ) === element
  );
}

function isNativeFocusTarget(element: HTMLElement): boolean {
  if (element.localName === 'summary') {
    return isFirstSummary(element);
  }

  // The browser's computed tabIndex captures native controls, media with
  // controls, iframe, anchors with href, and platform-specific focusable
  // elements without maintaining a fragile selector allow-list.
  return element.tabIndex >= 0;
}

function isFocusableElement(element: HTMLElement): boolean {
  if (hasExplicitTabIndex(element)) {
    return true;
  }

  if (element.hasAttribute('contenteditable')) {
    return isContentEditableElement(element);
  }

  return isNativeFocusTarget(element);
}

function isTabCycleCandidate(element: HTMLElement): boolean {
  if (isUnavailableElement(element) || !element.isConnected) {
    return false;
  }

  if (element.hasAttribute('tabindex') && !hasNonNegativeTabIndex(element)) {
    return false;
  }

  if (
    element.localName === 'input' &&
    element.getAttribute('type')?.toLowerCase() === 'radio'
  ) {
    const name = element.getAttribute('name');
    if (name) {
      const radios = Array.from(
        element.ownerDocument.querySelectorAll<HTMLInputElement>(
          'input[type="radio"]',
        ),
      ).filter(
        (candidate) =>
          candidate.name === name &&
          candidate.form === (element as HTMLInputElement).form &&
          !isUnavailableElement(candidate),
      );
      const checked = radios.find((radio) => radio.checked);
      if (checked && checked !== element) {
        return false;
      }
    }
  }

  return isFocusableElement(element);
}

function isProgrammaticFocusTarget(
  element: HTMLElement,
  surface: HTMLElement,
): boolean {
  if (
    !element.isConnected ||
    !surface.contains(element) ||
    isUnavailableElement(element)
  ) {
    return false;
  }

  const hasExplicitTabIndexValue = hasExplicitTabIndex(element);
  const isNaturallyFocusable = isFocusableElement(element);
  return hasExplicitTabIndexValue || isNaturallyFocusable;
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
  private readonly overlay =
    viewChild<ElementRef<HTMLDialogElement>>('overlay');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly instanceId = `bulud-dialog-${BuludDialog.nextId++}`;
  protected readonly stackLevel = signal(0);
  private wasOpen = false;
  private restoreTarget: HTMLElement | null = null;
  private readonly stackEntry: DialogStackEntry = {
    handleKeydown: (event) => this.handleDocumentKeydown(event),
    handleFocusin: (event) => this.handleDocumentFocusin(event),
    getRestoreTarget: () => this.restoreTarget,
    setRestoreTarget: (target) => {
      this.restoreTarget = target;
    },
    setStackLevel: (level) => this.stackLevel.set(level),
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
      '--bulud-dialog-focus-width': override.focusWidth,
      '--bulud-dialog-focus-offset': override.focusOffset,
      '--bulud-dialog-stack-base': override.stackBase,
    };
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.wasOpen) {
        const wasTop = this.detachListeners();
        unlockBodyScroll(this.document);
        this.closeNativeDialog();
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
              this.openNativeDialog();
              this.focusInitialTarget();
            }
          }),
        );
      } else if (!isOpen && this.wasOpen) {
        this.closeNativeDialog();
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

  protected handleNativeCancel(event: Event): void {
    event.preventDefault();
  }

  private openNativeDialog(): void {
    const overlay = this.overlay()?.nativeElement;
    if (overlay && !overlay.open) {
      overlay.showModal();
    }
  }

  private closeNativeDialog(): void {
    const overlay = this.overlay()?.nativeElement;
    if (overlay?.open) {
      overlay.close();
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
    const explicit = requested
      ? this.queryProgrammaticFocusTarget(surface, requested)
      : null;
    const target = explicit ?? this.focusableElements(surface)[0] ?? surface;
    target.focus();
  }

  private queryProgrammaticFocusTarget(
    surface: HTMLElement,
    selector: string,
  ): HTMLElement | null {
    try {
      const element = surface.querySelector<HTMLElement>(selector);
      return element && isProgrammaticFocusTarget(element, surface)
        ? element
        : null;
    } catch {
      return null;
    }
  }

  private focusableElements(surface: HTMLElement): HTMLElement[] {
    return Array.from(surface.querySelectorAll<HTMLElement>('*'))
      .filter((element) => isTabCycleCandidate(element))
      .sort((left, right) => {
        const leftTabIndex = left.tabIndex;
        const rightTabIndex = right.tabIndex;
        if (leftTabIndex > 0 && rightTabIndex <= 0) {
          return -1;
        }
        if (rightTabIndex > 0 && leftTabIndex <= 0) {
          return 1;
        }
        if (leftTabIndex > 0 && rightTabIndex > 0) {
          return leftTabIndex - rightTabIndex;
        }
        return 0;
      });
  }

  private focusedElement(): HTMLElement | null {
    const active = this.document.activeElement;
    return active instanceof HTMLElement ? active : null;
  }

  private restoreFocus(): void {
    const target = this.restoreTarget;
    this.restoreTarget = null;
    if (target?.isConnected && isProgrammaticFocusTarget(target, target)) {
      target.focus();
    }
  }
}
