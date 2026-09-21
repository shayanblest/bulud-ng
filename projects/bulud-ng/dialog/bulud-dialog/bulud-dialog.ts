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
    document.addEventListener('keydown', registry.keydown);
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
    document.removeEventListener('keydown', registry.keydown);
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

type FocusCandidate = Element & {
  readonly tabIndex: number;
  focus: (options?: FocusOptions) => void;
};

type DomConstructor = abstract new (...args: never[]) => object;

const DOCUMENT_POSITION_PRECEDING = 2;
const DOCUMENT_POSITION_FOLLOWING = 4;

function isDomInstance<T>(
  value: unknown,
  document: Document,
  constructorName: string,
): value is T {
  const constructor = (
    document.defaultView as unknown as Record<string, unknown> | null
  )?.[constructorName];
  return (
    typeof constructor === 'function' &&
    value instanceof (constructor as DomConstructor)
  );
}

function isUnavailableElement(element: Element): boolean {
  const document = element.ownerDocument;
  if (
    isDomInstance<HTMLElement>(element, document, 'HTMLElement') &&
    element.matches(':disabled')
  ) {
    return true;
  }

  for (
    let current: Element | null = element;
    current;
    current = composedParent(current)
  ) {
    if (
      current !== element &&
      current.localName === 'details' &&
      !(current as HTMLDetailsElement).open
    ) {
      const firstSummary = Array.from(current.children).find(
        (child) => child.localName === 'summary',
      );
      if (
        !isDomInstance<HTMLElement>(firstSummary, document, 'HTMLElement') ||
        !isComposedDescendant(element, firstSummary)
      ) {
        return true;
      }
    }

    if (
      current.getAttribute('aria-hidden') === 'true' ||
      current.hasAttribute('inert') ||
      (isDomInstance<HTMLElement>(current, document, 'HTMLElement') &&
        current.hidden)
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

function hasNonNegativeTabIndex(element: Element): boolean {
  const tabindex = element.getAttribute('tabindex');
  return (
    tabindex !== null &&
    /^[-+]?\d+$/.test(tabindex.trim()) &&
    Number.parseInt(tabindex, 10) >= 0
  );
}

function hasExplicitTabIndex(element: Element): boolean {
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

function isFirstSummary(element: Element): boolean {
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

function isNativeFocusTarget(element: Element): element is FocusCandidate {
  if (element.localName === 'summary') {
    return isFirstSummary(element);
  }

  // The browser's computed tabIndex captures native controls, media with
  // controls, iframe, anchors with href, and platform-specific focusable
  // elements without maintaining a fragile selector allow-list.
  return (
    'tabIndex' in element &&
    typeof (element as { tabIndex?: unknown }).tabIndex === 'number' &&
    'focus' in element &&
    typeof (element as { focus?: unknown }).focus === 'function' &&
    (element as FocusCandidate).tabIndex >= 0
  );
}

function isFocusCapable(element: Element): element is FocusCandidate {
  return (
    'tabIndex' in element &&
    typeof (element as { tabIndex?: unknown }).tabIndex === 'number' &&
    'focus' in element &&
    typeof (element as { focus?: unknown }).focus === 'function'
  );
}

function isIntrinsicallyNonFocusable(element: Element): boolean {
  if (
    element.localName === 'input' &&
    element.getAttribute('type')?.trim().toLowerCase() === 'hidden'
  ) {
    return true;
  }

  if (element.localName === 'option' || element.localName === 'optgroup') {
    return true;
  }

  return element.localName === 'area' && !element.hasAttribute('href');
}

function isFocusableElement(element: Element): element is FocusCandidate {
  if (hasExplicitTabIndex(element)) {
    return !isIntrinsicallyNonFocusable(element);
  }

  // Chromium reports unchecked native radios with tabIndex -1 even though
  // the group still has a sequential-focus representative. Group reduction
  // below decides which enabled radio is that representative.
  if (
    isDomInstance<HTMLElement>(element, element.ownerDocument, 'HTMLElement') &&
    element.localName === 'input' &&
    element.getAttribute('type')?.trim().toLowerCase() === 'radio'
  ) {
    return true;
  }

  if (
    isDomInstance<HTMLElement>(element, element.ownerDocument, 'HTMLElement') &&
    element.hasAttribute('contenteditable')
  ) {
    return isContentEditableElement(element);
  }

  return isNativeFocusTarget(element);
}

function isTabCycleCandidate(element: Element): element is FocusCandidate {
  if (isUnavailableElement(element) || !element.isConnected) {
    return false;
  }

  if (element.hasAttribute('tabindex') && !hasNonNegativeTabIndex(element)) {
    return false;
  }

  return isFocusableElement(element);
}

function composedParent(element: Element): Element | null {
  if (element.assignedSlot) {
    return element.assignedSlot;
  }

  if (element.parentElement) {
    return element.parentElement;
  }

  const root = element.getRootNode();
  return isDomInstance<ShadowRoot>(root, element.ownerDocument, 'ShadowRoot')
    ? root.host
    : element.parentElement;
}

function isComposedDescendant(element: Element, ancestor: Element): boolean {
  for (
    let current: Element | null = element;
    current;
    current = composedParent(current)
  ) {
    if (current === ancestor) {
      return true;
    }
  }
  return false;
}

function isOpaqueCustomElement(
  node: EventTarget | null,
  document: Document,
): node is HTMLElement {
  return (
    isDomInstance<HTMLElement>(node, document, 'HTMLElement') &&
    node.localName.includes('-') &&
    document.defaultView?.customElements?.get(node.localName) !== undefined &&
    node.shadowRoot === null
  );
}

function isModalNativeDialog(dialog: HTMLDialogElement): boolean {
  try {
    return dialog.matches(':modal');
  } catch {
    return false;
  }
}

function collectComposedElements(root: HTMLElement): Element[] {
  const elements: Element[] = [];
  const visited = new Set<Element>();
  const document = root.ownerDocument;

  const visit = (element: Element): void => {
    if (visited.has(element)) {
      return;
    }
    visited.add(element);
    elements.push(element);

    if (isDomInstance<HTMLSlotElement>(element, document, 'HTMLSlotElement')) {
      const assigned = element.assignedElements({ flatten: true });
      (assigned.length ? assigned : Array.from(element.children)).forEach(
        visit,
      );
      return;
    }

    const shadowRoot = isDomInstance<HTMLElement>(
      element,
      root.ownerDocument,
      'HTMLElement',
    )
      ? element.shadowRoot
      : isDomInstance<SVGElement>(element, root.ownerDocument, 'SVGElement')
        ? element.shadowRoot
        : null;
    if (shadowRoot) {
      Array.from(shadowRoot.children).forEach(visit);
      return;
    }

    Array.from(element.children).forEach(visit);
  };

  Array.from(root.children).forEach(visit);
  return elements;
}

function isSameRadioGroup(
  left: HTMLInputElement,
  right: HTMLInputElement,
): boolean {
  const leftName = left.getAttribute('name');
  return (
    Boolean(leftName) &&
    leftName === right.getAttribute('name') &&
    left.form === right.form &&
    left.getRootNode() === right.getRootNode()
  );
}

function isProgrammaticFocusTarget(
  element: FocusCandidate,
  surface: HTMLElement,
): boolean {
  if (
    !element.isConnected ||
    !isComposedDescendant(element, surface) ||
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
  private destroyed = false;
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
  private removeNativeCloseListener: (() => void) | null = null;
  private readonly nativeCloseListener = (): void => this.handleNativeClose();

  /** Controlled open state. Use `[(open)]` for two-way binding. */
  readonly open = input(false);
  readonly openChange = output<boolean>();

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
      '--bulud-dialog-border-width': override.borderWidth,
      '--bulud-dialog-radius': override.radius,
      '--bulud-dialog-shadow': override.shadow,
      '--bulud-dialog-padding': override.padding,
      '--bulud-dialog-max-width': override.maxWidth,
      '--bulud-dialog-focus': override.focus,
      '--bulud-dialog-focus-width': override.focusWidth,
      '--bulud-dialog-focus-offset': override.focusOffset,
      '--bulud-dialog-viewport-gutter': override.viewportGutter,
      '--bulud-dialog-stack-base': override.stackBase,
    };
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      if (this.wasOpen) {
        const wasTop = this.cleanupActiveDialog();
        this.closeNativeDialog();
        if (wasTop) {
          this.restoreFocus();
        }
      }
    });

    // The render callback runs after the projected content exists, which lets
    // dynamic projected controls participate in initial focus and trapping.
    const checkState = (): void => {
      if (this.destroyed || !this.document.defaultView) {
        return;
      }

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
        const wasTop = this.cleanupActiveDialog();
        this.closeNativeDialog();
        if (wasTop) {
          this.restoreFocus();
        }
      }
    };

    // Reading the model in an effect keeps this synchronized in zoneless
    // applications without timers or manual change detection.
    effect(checkState);
  }

  /** Closes the dialog as a programmatic action. */
  close(): void {
    if (this.open() && this.wasOpen) {
      const wasTop = this.cleanupActiveDialog();
      this.closeNativeDialog();
      if (wasTop) {
        this.restoreFocus();
      }
      this.openChange.emit(false);
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

  /** Synchronize native form-driven closes with the controlled lifecycle. */
  protected handleNativeClose(): void {
    if (this.destroyed || !this.wasOpen) {
      return;
    }

    this.cleanupActiveDialog(true);
    this.openChange.emit(false);
  }

  private openNativeDialog(): void {
    const overlay = this.overlay()?.nativeElement;
    if (overlay && !overlay.open) {
      overlay.addEventListener('close', this.nativeCloseListener);
      this.removeNativeCloseListener = () =>
        overlay.removeEventListener('close', this.nativeCloseListener);
      try {
        overlay.showModal();
      } catch (error) {
        this.removeNativeCloseListener();
        this.removeNativeCloseListener = null;
        throw error;
      }
    }
  }

  private closeNativeDialog(): void {
    const overlay = this.overlay()?.nativeElement;
    if (overlay?.open) {
      overlay.close();
      this.removeNativeCloseListener?.();
      this.removeNativeCloseListener = null;
    }
  }

  private cleanupActiveDialog(restoreImmediately = false): boolean {
    if (!this.wasOpen) {
      return false;
    }

    this.wasOpen = false;
    const wasTop = this.detachListeners();
    unlockBodyScroll(this.document);
    this.stackLevel.set(0);
    if (wasTop) {
      if (restoreImmediately) {
        this.restoreFocus();
      }
    } else {
      this.restoreTarget = null;
    }

    return wasTop;
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

    if (this.isInsideAnotherNativeDialog(event)) {
      return;
    }

    if (event.key === 'Escape') {
      if (event.defaultPrevented) {
        return;
      }
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

    // A closed shadow tree is intentionally opaque. Once focus is in such a
    // widget, let the browser own its internal Tab navigation rather than
    // guessing at inaccessible descendants. Escape remains owned by this
    // dialog when it bubbles out unconsumed.
    if (
      event
        .composedPath()
        .some((node) => isOpaqueCustomElement(node, this.document))
    ) {
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

    const active = this.deepestActiveElement();
    const directActiveIndex = focusable.indexOf(active as FocusCandidate);
    const activeIndex =
      directActiveIndex >= 0
        ? directActiveIndex
        : this.radioRepresentativeIndex(focusable, active);
    if (event.shiftKey) {
      const previous =
        activeIndex >= 0
          ? (focusable[activeIndex - 1] ?? focusable.at(-1))
          : this.relativeTabCandidate(surface, focusable, active, true);
      if (previous) {
        event.preventDefault();
        previous.focus();
      }
    } else {
      const next =
        activeIndex >= 0
          ? (focusable[activeIndex + 1] ?? focusable[0])
          : this.relativeTabCandidate(surface, focusable, active, false);
      if (next) {
        event.preventDefault();
        next.focus();
      }
    }
  };

  private relativeTabCandidate(
    surface: HTMLElement,
    focusable: readonly FocusCandidate[],
    active: Element | null,
    backwards: boolean,
  ): FocusCandidate | undefined {
    if (
      !isDomInstance<Element>(active, this.document, 'Element') ||
      active === surface
    ) {
      return backwards ? focusable.at(-1) : focusable[0];
    }

    if (!isComposedDescendant(active, surface)) {
      return backwards ? focusable.at(-1) : focusable[0];
    }

    const candidates = focusable.filter((candidate) => {
      const relation = active.compareDocumentPosition(candidate);
      return Boolean(
        relation &
        (backwards ? DOCUMENT_POSITION_PRECEDING : DOCUMENT_POSITION_FOLLOWING),
      );
    });

    return backwards
      ? (candidates.at(-1) ?? focusable.at(-1))
      : (candidates[0] ?? focusable[0]);
  }

  private radioRepresentativeIndex(
    focusable: readonly FocusCandidate[],
    active: Element | null,
  ): number {
    if (
      !isDomInstance<HTMLInputElement>(
        active,
        this.document,
        'HTMLInputElement',
      ) ||
      active.type !== 'radio' ||
      !active.name
    ) {
      return -1;
    }
    return focusable.findIndex(
      (candidate) =>
        isDomInstance<HTMLInputElement>(
          candidate,
          this.document,
          'HTMLInputElement',
        ) &&
        candidate.type === 'radio' &&
        isSameRadioGroup(candidate, active),
    );
  }

  private isInsideAnotherNativeDialog(event: KeyboardEvent): boolean {
    const overlay = this.overlay()?.nativeElement;
    return event
      .composedPath()
      .some(
        (node) =>
          isDomInstance<HTMLDialogElement>(
            node,
            this.document,
            'HTMLDialogElement',
          ) &&
          node !== overlay &&
          isModalNativeDialog(node),
      );
  }

  private readonly handleDocumentFocusin = (event: FocusEvent): void => {
    const surface = this.panel()?.nativeElement;
    const target = event.target;
    if (
      !surface ||
      !isDomInstance<Node>(target, this.document, 'Node') ||
      surface.contains(target)
    ) {
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
  ): FocusCandidate | null {
    try {
      const element = collectComposedElements(surface).find((candidate) =>
        candidate.matches(selector),
      );
      return element &&
        isFocusCapable(element) &&
        isProgrammaticFocusTarget(element, surface)
        ? element
        : null;
    } catch {
      return null;
    }
  }

  private focusableElements(surface: HTMLElement): FocusCandidate[] {
    const candidates = collectComposedElements(surface).filter((element) =>
      isTabCycleCandidate(element),
    );

    // Native radios with the same name/form/tree scope share one sequential
    // focus stop. A checked, enabled member represents the group; without one,
    // the first enabled member in composed document order does. Arrow-key
    // movement remains entirely browser-owned because only Tab is handled here.
    const representatives: HTMLInputElement[] = [];
    const tabCandidates = candidates
      .filter((candidate) => {
        if (
          candidate.localName !== 'input' ||
          candidate.getAttribute('type')?.trim().toLowerCase() !== 'radio' ||
          !candidate.getAttribute('name')
        ) {
          return true;
        }

        const radio = candidate as HTMLInputElement;
        const group = representatives.find((member) =>
          isSameRadioGroup(member, radio),
        );
        if (group) {
          return group === radio;
        }

        const groupMembers = candidates.filter(
          (member): member is HTMLInputElement =>
            member.localName === 'input' &&
            member.getAttribute('type')?.trim().toLowerCase() === 'radio' &&
            isSameRadioGroup(radio, member as HTMLInputElement),
        );
        const representative =
          groupMembers.find((member) => member.checked) ?? groupMembers[0];
        representatives.push(representative);
        return representative === radio;
      })
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
    return tabCandidates;
  }

  private focusedElement(): HTMLElement | null {
    const active = this.deepestActiveElement();
    return isDomInstance<HTMLElement>(active, this.document, 'HTMLElement')
      ? active
      : null;
  }

  private deepestActiveElement(): FocusCandidate | null {
    let active: Element | null = this.document.activeElement;
    while (
      (isDomInstance<HTMLElement>(active, this.document, 'HTMLElement') ||
        isDomInstance<SVGElement>(active, this.document, 'SVGElement')) &&
      active.shadowRoot?.activeElement
    ) {
      active = active.shadowRoot.activeElement;
    }
    return isDomInstance<Element>(active, this.document, 'Element') &&
      isFocusCapable(active)
      ? active
      : null;
  }

  private restoreFocus(): void {
    const target = this.restoreTarget;
    this.restoreTarget = null;
    if (target?.isConnected && isProgrammaticFocusTarget(target, target)) {
      target.focus();
    }
  }
}
