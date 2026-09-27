import { DOCUMENT } from '@angular/common';
import {
  booleanAttribute,
  computed,
  Directive,
  DoCheck,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  AfterViewInit,
  signal,
} from '@angular/core';

type ResizeObserverConstructor = new (
  callback: ResizeObserverCallback,
) => ResizeObserver;

type MutationObserverConstructor = new (
  callback: MutationCallback,
) => MutationObserver;

interface FontLoadingSet {
  addEventListener(type: 'loadingdone', listener: EventListener): void;
  removeEventListener(type: 'loadingdone', listener: EventListener): void;
}

interface InlineStyleValue {
  readonly present: boolean;
  readonly value: string;
  readonly priority: string;
}

interface OriginalStyles {
  readonly height: InlineStyleValue;
  readonly overflowY: InlineStyleValue;
}

interface TextareaInteractionState {
  readonly value: string;
  readonly selectionStart: number | null;
  readonly selectionEnd: number | null;
  readonly selectionDirection: 'forward' | 'backward' | 'none' | null;
  readonly scrollTop: number;
  readonly scrollLeft: number;
}

/**
 * Resizes a native textarea to fit its value without polling.
 *
 * Programmatic value changes are detected during Angular change detection;
 * direct DOM assignments should dispatch an `input` event when Angular is not
 * involved. The directive owns its inline height and overflow-y while enabled
 * and restores their original values when disabled or destroyed.
 */
@Directive({
  selector: 'textarea[buludTextareaAutosize]',
  standalone: true,
})
export class BuludTextareaAutosize
  implements AfterViewInit, DoCheck, OnDestroy
{
  private readonly element =
    inject<ElementRef<HTMLTextAreaElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private originalStyles: OriginalStyles | null = null;
  private lastValue = '';
  private lastObservedWidth: number | null = null;
  private constraintContainer: Element | null = null;
  private ownedHeight: string | null = null;
  private ownedHeightPriority = '';
  private ownedOverflowY: string | null = null;
  private ownedOverflowYPriority = '';
  private observer: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private formMutationObserver: MutationObserver | null = null;
  private formMutationRoot: Node | null = null;
  private restoreBaselineObserver: MutationObserver | null = null;
  private metricAncestors: Element[] = [];
  private viewportResizeListener: EventListener | null = null;
  private fontLoadingSet: FontLoadingSet | null = null;
  private fontLoadingListener: EventListener | null = null;
  private resetForm: HTMLFormElement | null = null;
  private resetListener: EventListener | null = null;
  private lastMeasurementSignature: string | null = null;
  private pseudoStateListeners: Array<{
    readonly target: EventTarget;
    readonly type: string;
    readonly listener: EventListener;
    readonly capture: boolean;
  }> = [];
  private pointerInvalidationGeneration = 0;
  private pointerInvalidationScheduled = false;
  private composing = false;
  private resizeAfterComposition = false;
  private destroyed = false;
  private readonly viewInitialized = signal(false);

  /** Enables autosizing. Defaults to `true`. */
  readonly enabled = input(true, { transform: booleanAttribute });

  /** Minimum number of text rows. Invalid or non-positive values are ignored. */
  readonly minRows = input<number | null>(null);

  /** Maximum number of text rows. Invalid or non-positive values are ignored. */
  readonly maxRows = input<number | null>(null);

  private readonly normalizedMinRows = computed(() =>
    normalizeRows(this.minRows()),
  );
  private readonly normalizedMaxRows = computed(() =>
    normalizeRows(this.maxRows()),
  );

  constructor() {
    effect((onCleanup) => {
      const enabled = this.enabled();
      this.normalizedMinRows();
      this.normalizedMaxRows();
      if (!this.viewInitialized() || this.destroyed || !enabled) {
        return;
      }

      this.refreshRestoreBaseline();
      this.resize();
      this.connectWidthObserver();
      this.connectMutationObserver();
      this.connectFontLoadingObserver();
      this.connectFormResetListener();
      this.connectViewportResizeListener();
      const textarea = this.element.nativeElement;
      const inputListener = (event: Event): void => {
        if (eventIsComposing(event)) {
          this.composing = true;
        }
        if (textarea.value !== this.lastValue) {
          this.requestResize();
        }
      };
      const compositionStartListener = (): void => {
        this.composing = true;
      };
      const compositionEndListener = (): void => {
        this.composing = false;
        if (this.resizeAfterComposition || textarea.value !== this.lastValue) {
          this.resizeAfterComposition = false;
          this.resize();
        }
      };
      textarea.addEventListener('input', inputListener);
      textarea.addEventListener('compositionstart', compositionStartListener);
      textarea.addEventListener('compositionend', compositionEndListener);
      this.connectPseudoStateListeners();
      onCleanup(() => {
        this.resetCompositionState();
        textarea.removeEventListener('input', inputListener);
        textarea.removeEventListener(
          'compositionstart',
          compositionStartListener,
        );
        textarea.removeEventListener('compositionend', compositionEndListener);
        this.disconnectPseudoStateListeners();
        this.disconnectWidthObserver();
        this.disconnectMutationObserver();
        this.disconnectFontLoadingObserver();
        this.disconnectFormResetListener();
        this.disconnectViewportResizeListener();
        this.restoreOriginalStyles();
      });
    });
  }

  ngAfterViewInit(): void {
    const textarea = this.element.nativeElement;
    this.originalStyles = {
      height: captureInlineStyle(textarea.style, 'height'),
      overflowY: captureInlineStyle(textarea.style, 'overflow-y'),
    };
    this.connectRestoreBaselineObserver();
    this.viewInitialized.set(true);
  }

  ngDoCheck(): void {
    if (
      !this.viewInitialized() ||
      this.destroyed ||
      !this.enabled() ||
      !this.hasBrowserView()
    ) {
      return;
    }

    const value = this.element.nativeElement.value;
    if (value !== this.lastValue) {
      this.requestResize();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resetCompositionState();
    this.disconnectWidthObserver();
    this.disconnectMutationObserver();
    this.disconnectFontLoadingObserver();
    this.disconnectFormResetListener();
    this.disconnectViewportResizeListener();
    this.restoreBaselineObserver?.disconnect();
    this.restoreBaselineObserver = null;
    this.restoreOriginalStyles();
  }

  private resize(): void {
    if (this.destroyed || !this.hasBrowserView()) {
      return;
    }

    if (this.composing) {
      this.resizeAfterComposition = true;
      return;
    }

    const textarea = this.element.nativeElement;
    const view = this.document.defaultView;
    const getComputedStyle = view?.getComputedStyle;
    if (!view || typeof getComputedStyle !== 'function') {
      return;
    }

    const interactionState = captureTextareaInteractionState(textarea);
    const styles = getComputedStyle.call(view, textarea);
    const padding = getVerticalPadding(styles);
    const borders = getVerticalBorders(styles);
    const horizontalScrollbarGutter = getHorizontalScrollbarGutter(
      textarea,
      styles,
    );
    const cssMaxHeight = getCssMaxContentHeight(
      textarea,
      styles,
      padding,
      borders,
      horizontalScrollbarGutter,
    );
    this.setOwnedStyle('overflow-y', 'hidden');
    this.setOwnedStyle('height', '0px');
    this.lastMeasurementSignature = getMeasurementSignature(
      textarea,
      styles,
      view,
      cssMaxHeight,
    );
    const lineHeight = getLineHeight(textarea, styles);
    const minRows = this.normalizedMinRows();
    const maxRows = this.normalizedMaxRows();
    const effectiveMaxRows =
      maxRows === null ? null : Math.max(maxRows, minRows ?? 0);
    const boxSizing = styles.boxSizing;
    const contentHeight = this.measureContentHeight(textarea, padding);
    const minHeight =
      minRows === null || lineHeight === null ? 0 : minRows * lineHeight;
    const maxHeight =
      effectiveMaxRows === null || lineHeight === null
        ? Number.POSITIVE_INFINITY
        : effectiveMaxRows * lineHeight;
    const effectiveMaxHeight = Math.min(maxHeight, cssMaxHeight);
    const targetContentHeight = Math.min(
      effectiveMaxHeight,
      Math.max(minHeight, contentHeight),
    );
    const targetContentHeightWithScrollbar =
      targetContentHeight + horizontalScrollbarGutter;
    const targetHeight =
      boxSizing === 'border-box'
        ? targetContentHeightWithScrollbar + padding + borders
        : targetContentHeightWithScrollbar;
    const nextHeight = `${targetHeight}px`;
    const shouldScroll = contentHeight > effectiveMaxHeight;

    if (textarea.style.height !== nextHeight) {
      this.setOwnedStyle('height', nextHeight);
    }
    const nextOverflowY = shouldScroll ? 'auto' : 'hidden';
    if (textarea.style.overflowY !== nextOverflowY) {
      this.setOwnedStyle('overflow-y', nextOverflowY);
    }

    this.ownedHeight = nextHeight;
    this.ownedHeightPriority = this.originalStyles?.height.priority ?? '';
    this.ownedOverflowY = nextOverflowY;
    this.ownedOverflowYPriority = this.originalStyles?.overflowY.priority ?? '';
    this.lastValue = textarea.value;
    restoreTextareaInteractionState(textarea, interactionState);
  }

  private measureContentHeight(
    textarea: HTMLTextAreaElement,
    padding: number,
  ): number {
    return Math.max(0, textarea.scrollHeight - padding);
  }

  private connectWidthObserver(): void {
    if (this.observer || this.destroyed || !this.hasBrowserView()) {
      return;
    }

    const ResizeObserver = getResizeObserverConstructor(this.document);
    if (!ResizeObserver) {
      return;
    }

    const textarea = this.element.nativeElement;
    const view = this.document.defaultView;
    if (!view || typeof view.getComputedStyle !== 'function') {
      return;
    }
    const styles = view?.getComputedStyle(textarea);
    this.lastObservedWidth = styles
      ? getContentBoxWidth(textarea, styles)
      : null;
    this.observer = new ResizeObserver((entries) => {
      if (this.destroyed || !this.enabled()) {
        return;
      }

      if (isResolvingCssMaxHeight(textarea)) {
        scheduleMicrotask(() => {
          if (!this.destroyed && this.enabled()) {
            this.remeasureIfNeeded();
          }
        });
        return;
      }

      this.updateConstraintObservation();

      let shouldResize = false;
      for (const entry of entries) {
        if (entry.target === this.constraintContainer) {
          shouldResize = this.hasMeasurementSignatureChanged();
          continue;
        }

        if (entry.target !== textarea) {
          continue;
        }

        const width = entry.contentRect.width;
        if (Number.isFinite(width) && width !== this.lastObservedWidth) {
          this.lastObservedWidth = width;
          shouldResize = true;
        }

        if (this.hasMeasurementSignatureChanged()) {
          shouldResize = true;
        }

        if (this.hasExternalOwnedSizingChange()) {
          shouldResize = true;
        }
      }

      if (shouldResize) {
        this.resize();
      }
    });
    this.observer.observe(textarea);
    this.updateConstraintObservation();
  }

  private connectMutationObserver(): void {
    if (this.mutationObserver || this.destroyed || !this.hasBrowserView()) {
      return;
    }

    const MutationObserver = getMutationObserverConstructor(this.document);
    if (!MutationObserver) {
      return;
    }

    this.mutationObserver = new MutationObserver((records) => {
      if (!this.destroyed && this.enabled()) {
        this.updateConstraintObservation();
        if (metricObservationWasMoved(records, this.element.nativeElement)) {
          this.reconnectMetricAncestors();
          this.connectFormResetListener();
          this.connectFormMutationObserver();
        }
        if (!isResolvingCssMaxHeight(this.element.nativeElement)) {
          this.remeasureIfNeeded();
        }
      }
    });
    this.mutationObserver.observe(this.element.nativeElement, {
      attributes: true,
    });
    this.metricAncestors = getMetricAncestors(this.element.nativeElement);
    for (const [index, ancestor] of this.metricAncestors.entries()) {
      this.mutationObserver.observe(ancestor, {
        attributes: true,
        ...(index === 0 ? { childList: true, subtree: true } : {}),
      });
    }
    for (const ancestor of getShadowHostReparentObservers(
      this.element.nativeElement,
    )) {
      this.mutationObserver.observe(ancestor, { childList: true });
    }
    this.connectPseudoStateListeners();

    this.connectFormMutationObserver();
  }

  private connectFormMutationObserver(): void {
    const MutationObserver = getMutationObserverConstructor(this.document);
    if (
      !MutationObserver ||
      this.destroyed ||
      !this.hasBrowserView() ||
      !this.enabled()
    ) {
      return;
    }

    const root = this.element.nativeElement.getRootNode();
    if (this.formMutationObserver && this.formMutationRoot === root) {
      return;
    }

    this.formMutationObserver?.disconnect();
    this.formMutationObserver = new MutationObserver((records) => {
      if (
        !this.destroyed &&
        this.enabled() &&
        formMutationMayAffectTextarea(this.element.nativeElement, records)
      ) {
        const textareaWasMoved = records.some((record) =>
          recordTouchesTextarea(record, this.element.nativeElement),
        );
        this.connectFormResetListener();
        if (textareaWasMoved) {
          this.connectFormMutationObserver();
        }
      }
    });
    this.formMutationRoot = root;
    this.formMutationObserver.observe(root, {
      attributes: true,
      attributeFilter: ['form', 'id'],
      childList: true,
      subtree: true,
    });
  }

  private disconnectWidthObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.lastObservedWidth = null;
    this.constraintContainer = null;
    this.ownedHeight = null;
    this.ownedHeightPriority = '';
    this.ownedOverflowY = null;
    this.ownedOverflowYPriority = '';
    this.resetMeasurementSignature();
  }

  private disconnectMutationObserver(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.formMutationObserver?.disconnect();
    this.formMutationObserver = null;
    this.formMutationRoot = null;
    this.metricAncestors = [];
    this.disconnectPseudoStateListeners();
  }

  private connectFontLoadingObserver(): void {
    if (this.fontLoadingSet || this.destroyed || !this.hasBrowserView()) {
      return;
    }

    const fontLoadingSet = getFontLoadingSet(this.document);
    if (!fontLoadingSet) {
      return;
    }

    const listener: EventListener = () => {
      if (!this.destroyed && this.enabled()) {
        this.resize();
      }
    };
    fontLoadingSet.addEventListener('loadingdone', listener);
    this.fontLoadingSet = fontLoadingSet;
    this.fontLoadingListener = listener;
  }

  private disconnectFontLoadingObserver(): void {
    if (this.fontLoadingSet && this.fontLoadingListener) {
      this.fontLoadingSet.removeEventListener(
        'loadingdone',
        this.fontLoadingListener,
      );
    }
    this.fontLoadingSet = null;
    this.fontLoadingListener = null;
  }

  private connectFormResetListener(): void {
    if (this.destroyed || !this.hasBrowserView()) {
      return;
    }

    const form = this.element.nativeElement.form;
    if (form === this.resetForm) {
      return;
    }

    this.disconnectFormResetListener();
    if (!form) {
      return;
    }

    const listener: EventListener = () => {
      scheduleMicrotask(() => {
        if (
          !this.destroyed &&
          this.enabled() &&
          this.element.nativeElement.value !== this.lastValue
        ) {
          this.resize();
        }
      });
    };
    form.addEventListener('reset', listener);
    this.resetForm = form;
    this.resetListener = listener;
  }

  private disconnectFormResetListener(): void {
    if (this.resetForm && this.resetListener) {
      this.resetForm.removeEventListener('reset', this.resetListener);
    }
    this.resetForm = null;
    this.resetListener = null;
  }

  private connectViewportResizeListener(): void {
    if (this.viewportResizeListener || this.destroyed) {
      return;
    }

    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    const listener: EventListener = () => {
      if (!this.destroyed && this.enabled()) {
        this.remeasureIfNeeded();
      }
    };
    view.addEventListener('resize', listener);
    this.viewportResizeListener = listener;
  }

  private disconnectViewportResizeListener(): void {
    const view = this.document.defaultView;
    if (view && this.viewportResizeListener) {
      view.removeEventListener('resize', this.viewportResizeListener);
    }
    this.viewportResizeListener = null;
  }

  private reconnectMetricAncestors(): void {
    if (!this.mutationObserver) {
      return;
    }

    this.mutationObserver.disconnect();
    this.mutationObserver.observe(this.element.nativeElement, {
      attributes: true,
    });
    this.metricAncestors = getMetricAncestors(this.element.nativeElement);
    for (const [index, ancestor] of this.metricAncestors.entries()) {
      this.mutationObserver.observe(ancestor, {
        attributes: true,
        ...(index === 0 ? { childList: true, subtree: true } : {}),
      });
    }
    for (const ancestor of getShadowHostReparentObservers(
      this.element.nativeElement,
    )) {
      this.mutationObserver.observe(ancestor, { childList: true });
    }
    this.connectPseudoStateListeners();
    this.updateConstraintObservation();
  }

  private connectPseudoStateListeners(): void {
    this.disconnectPseudoStateListeners();

    const listener: EventListener = () => {
      this.remeasureIfNeeded();
    };
    const pointerListener: EventListener = () => {
      this.schedulePointerRemeasurement();
    };
    const textarea = this.element.nativeElement;
    for (const type of PSEUDO_STATE_EVENTS) {
      this.addPseudoStateListener(
        textarea,
        type,
        isPointerStateEvent(type) ? pointerListener : listener,
      );
    }

    for (const ancestor of this.metricAncestors) {
      this.addPseudoStateListener(ancestor, 'focusin', listener);
      this.addPseudoStateListener(ancestor, 'focusout', listener);
      for (const type of POINTER_STATE_EVENTS) {
        this.addPseudoStateListener(ancestor, type, pointerListener, true);
      }
    }

    const root = textarea.getRootNode();
    if (isShadowRoot(root, textarea.ownerDocument)) {
      this.addPseudoStateListener(root, 'focusin', listener);
      this.addPseudoStateListener(root, 'focusout', listener);
      for (const type of POINTER_STATE_EVENTS) {
        this.addPseudoStateListener(root, type, pointerListener, true);
      }
    }

    const transitionListener: EventListener = (event) => {
      if (isMetricTransitionEvent(event)) {
        this.scheduleTransitionRemeasurement();
      }
    };
    const animationListener: EventListener = () => {
      this.scheduleTransitionRemeasurement();
    };
    const transitionTargets: EventTarget[] = [
      textarea,
      ...this.metricAncestors,
    ];
    if (isShadowRoot(root, textarea.ownerDocument)) {
      transitionTargets.push(root);
    }
    for (const target of new Set(transitionTargets)) {
      this.addPseudoStateListener(
        target,
        'transitionend',
        transitionListener,
        true,
      );
      this.addPseudoStateListener(
        target,
        'transitioncancel',
        transitionListener,
        true,
      );
      this.addPseudoStateListener(
        target,
        'animationend',
        animationListener,
        true,
      );
      this.addPseudoStateListener(
        target,
        'animationcancel',
        animationListener,
        true,
      );
    }
  }

  private addPseudoStateListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    capture = false,
  ): void {
    target.addEventListener(type, listener, capture);
    this.pseudoStateListeners.push({ target, type, listener, capture });
  }

  private disconnectPseudoStateListeners(): void {
    this.pointerInvalidationGeneration += 1;
    this.pointerInvalidationScheduled = false;
    for (const { target, type, listener, capture } of this
      .pseudoStateListeners) {
      target.removeEventListener(type, listener, capture);
    }
    this.pseudoStateListeners = [];
  }

  private schedulePointerRemeasurement(): void {
    this.scheduleInvalidationRemeasurement();
  }

  private scheduleTransitionRemeasurement(): void {
    this.scheduleInvalidationRemeasurement();
  }

  private scheduleInvalidationRemeasurement(): void {
    if (this.pointerInvalidationScheduled) {
      return;
    }

    this.pointerInvalidationScheduled = true;
    const generation = this.pointerInvalidationGeneration;
    scheduleMicrotask(() => {
      if (generation !== this.pointerInvalidationGeneration) {
        return;
      }

      this.pointerInvalidationScheduled = false;
      if (!this.destroyed && this.enabled()) {
        this.remeasureIfNeeded();
      }
    });
  }

  private remeasureIfNeeded(): void {
    this.updateConstraintObservation();
    if (this.hasExternalOwnedSizingChange()) {
      this.resize();
      return;
    }

    if (this.hasMeasurementSignatureChanged()) {
      this.resize();
    }
  }

  private updateConstraintObservation(): void {
    if (!this.observer || this.destroyed || !this.hasBrowserView()) {
      return;
    }

    const textarea = this.element.nativeElement;
    const view = this.document.defaultView;
    if (!view || typeof view.getComputedStyle !== 'function') {
      return;
    }

    const styles = view.getComputedStyle(textarea);
    const container = hasRelativeMaxHeight(styles)
      ? findConstraintContainingBlock(textarea, styles)
      : null;
    const nextContainer =
      container && hasContainingBlockPercentage(styles)
        ? shouldObserveContainingBlock(container)
          ? container
          : null
        : null;
    if (nextContainer === this.constraintContainer) {
      return;
    }

    if (this.constraintContainer) {
      this.observer.unobserve(this.constraintContainer);
    }
    this.constraintContainer = nextContainer;
    if (nextContainer) {
      this.observer.observe(nextContainer);
    }
  }

  private hasMeasurementSignatureChanged(): boolean {
    const view = this.document.defaultView;
    if (!view || typeof view.getComputedStyle !== 'function') {
      return false;
    }

    const styles = view.getComputedStyle(this.element.nativeElement);
    const padding = getVerticalPadding(styles);
    const borders = getVerticalBorders(styles);
    const gutter = getHorizontalScrollbarGutter(
      this.element.nativeElement,
      styles,
    );
    const cssMaxHeight = getCssMaxContentHeight(
      this.element.nativeElement,
      styles,
      padding,
      borders,
      gutter,
    );
    return (
      getMeasurementSignature(
        this.element.nativeElement,
        styles,
        view,
        cssMaxHeight,
      ) !== this.lastMeasurementSignature
    );
  }

  private hasExternalOwnedSizingChange(): boolean {
    const textarea = this.element.nativeElement;
    return (
      (this.ownedHeight !== null &&
        (textarea.style.height !== this.ownedHeight ||
          textarea.style.getPropertyPriority('height') !==
            this.ownedHeightPriority)) ||
      (this.ownedOverflowY !== null &&
        (textarea.style.overflowY !== this.ownedOverflowY ||
          textarea.style.getPropertyPriority('overflow-y') !==
            this.ownedOverflowYPriority))
    );
  }

  private resetMeasurementSignature(): void {
    this.lastMeasurementSignature = null;
  }

  private restoreOriginalStyles(): void {
    if (!this.originalStyles) {
      return;
    }

    const textarea = this.element.nativeElement;
    restoreInlineStyle(textarea.style, 'height', this.originalStyles.height);
    restoreInlineStyle(
      textarea.style,
      'overflow-y',
      this.originalStyles.overflowY,
    );
  }

  private refreshRestoreBaseline(): void {
    if (
      !this.originalStyles ||
      this.ownedHeight !== null ||
      this.ownedOverflowY !== null
    ) {
      return;
    }

    const textarea = this.element.nativeElement;
    this.originalStyles = {
      height: captureInlineStyle(textarea.style, 'height'),
      overflowY: captureInlineStyle(textarea.style, 'overflow-y'),
    };
  }

  private requestResize(): void {
    if (this.composing) {
      this.resizeAfterComposition = true;
      return;
    }
    this.resize();
  }

  private setOwnedStyle(property: string, value: string): void {
    const textarea = this.element.nativeElement;
    const priority =
      property === 'height'
        ? (this.originalStyles?.height.priority ?? '')
        : (this.originalStyles?.overflowY.priority ?? '');
    textarea.style.setProperty(property, value, priority);
  }

  private resetCompositionState(): void {
    this.composing = false;
    this.resizeAfterComposition = false;
  }

  private connectRestoreBaselineObserver(): void {
    if (this.restoreBaselineObserver || this.destroyed) {
      return;
    }

    const MutationObserver = getMutationObserverConstructor(this.document);
    if (!MutationObserver) {
      return;
    }

    this.restoreBaselineObserver = new MutationObserver(() => {
      if (
        !this.destroyed &&
        this.ownedHeight === null &&
        this.ownedOverflowY === null
      ) {
        this.refreshRestoreBaseline();
      }
    });
    this.restoreBaselineObserver.observe(this.element.nativeElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
  }

  private hasBrowserView(): boolean {
    return this.document.defaultView !== null;
  }
}

function getResizeObserverConstructor(
  document: Document,
): ResizeObserverConstructor | null {
  const view = document.defaultView as
    (Window & { readonly ResizeObserver?: ResizeObserverConstructor }) | null;
  const ResizeObserver = view?.ResizeObserver;
  return typeof ResizeObserver === 'function' ? ResizeObserver : null;
}

function getMutationObserverConstructor(
  document: Document,
): MutationObserverConstructor | null {
  const view = document.defaultView as
    | (Window & {
        readonly MutationObserver?: MutationObserverConstructor;
      })
    | null;
  const MutationObserver = view?.MutationObserver;
  return typeof MutationObserver === 'function' ? MutationObserver : null;
}

function getFontLoadingSet(document: Document): FontLoadingSet | null {
  const fontLoadingSet = (
    document as Document & { readonly fonts?: FontLoadingSet }
  ).fonts;
  return fontLoadingSet &&
    typeof fontLoadingSet.addEventListener === 'function' &&
    typeof fontLoadingSet.removeEventListener === 'function'
    ? fontLoadingSet
    : null;
}

function getMetricAncestors(textarea: HTMLTextAreaElement): Element[] {
  const ancestors: Element[] = [];
  const seen = new Set<Element>();
  let current = textarea.parentElement ?? getShadowRootHost(textarea);
  while (current) {
    if (seen.has(current)) {
      break;
    }
    seen.add(current);
    ancestors.push(current);
    if (current.parentElement) {
      current = current.parentElement;
      continue;
    }

    current = getShadowRootHost(current);
  }
  return ancestors;
}

function getShadowRootHost(element: Element): HTMLElement | null {
  const root = element.getRootNode();
  if (!isShadowRoot(root, element.ownerDocument)) {
    return null;
  }

  const host = root.host;
  return isElement(host, element.ownerDocument) ? (host as HTMLElement) : null;
}

function isShadowRoot(root: Node, document: Document): root is ShadowRoot {
  if (root.nodeType !== 11 || !('host' in root)) {
    return false;
  }

  const view = document.defaultView as
    (Window & { readonly ShadowRoot?: typeof ShadowRoot }) | null;
  if (!view) {
    return false;
  }

  const ShadowRootConstructor = view?.ShadowRoot;
  return typeof ShadowRootConstructor === 'function'
    ? root instanceof ShadowRootConstructor
    : true;
}

function isElement(value: unknown, document: Document): value is Element {
  if (typeof value !== 'object' || value === null || !('nodeType' in value)) {
    return false;
  }

  const view = document.defaultView as
    (Window & { readonly Element?: typeof Element }) | null;
  const ElementConstructor = view?.Element;
  return typeof ElementConstructor === 'function'
    ? value instanceof ElementConstructor
    : (value as { nodeType: number }).nodeType === 1;
}

function metricObservationWasMoved(
  records: readonly MutationRecord[],
  textarea: HTMLTextAreaElement,
): boolean {
  const movedElements = [textarea, ...getShadowHostChain(textarea)];
  return records.some((record) => {
    if (record.type !== 'childList') {
      return false;
    }

    return movedElements.some((element) => recordTouchesNode(record, element));
  });
}

function getShadowHostChain(textarea: HTMLTextAreaElement): HTMLElement[] {
  const hosts: HTMLElement[] = [];
  let current: Element = textarea;
  const seen = new Set<Element>();
  while (!seen.has(current)) {
    seen.add(current);
    const host = getShadowRootHost(current);
    if (!host) {
      break;
    }
    hosts.push(host);
    current = host;
  }
  return hosts;
}

function getShadowHostReparentObservers(textarea: HTMLTextAreaElement): Node[] {
  const observers: Node[] = [];
  const seen = new Set<Node>();
  for (const host of getShadowHostChain(textarea)) {
    const root = host.getRootNode();
    const parent = isShadowRoot(root, host.ownerDocument)
      ? root
      : host.parentElement;
    if (parent && !seen.has(parent)) {
      seen.add(parent);
      observers.push(parent);
    }
  }
  return observers;
}

function recordTouchesNode(record: MutationRecord, target: Node): boolean {
  return [...record.addedNodes, ...record.removedNodes].some((node) =>
    nodeContains(node, target),
  );
}

function findConstraintContainingBlock(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
): Element | null {
  if (styles.position !== 'absolute' && styles.position !== 'fixed') {
    return getContainingBlockTraversalParent(textarea);
  }

  const view = textarea.ownerDocument.defaultView;
  if (!view || typeof view.getComputedStyle !== 'function') {
    return textarea.parentElement;
  }

  let current = getContainingBlockTraversalParent(textarea);
  while (current) {
    const ancestorStyles = view.getComputedStyle(current);
    if (
      establishesConstraintContainingBlock(
        ancestorStyles,
        styles.position === 'absolute',
      )
    ) {
      return current;
    }

    current = getContainingBlockTraversalParent(current);
  }

  return null;
}

function getContainingBlockTraversalParent(element: Element): Element | null {
  return element.parentElement ?? getShadowRootHost(element);
}

/** CSS properties that establish the containing block used by positioned descendants. */
function establishesConstraintContainingBlock(
  styles: CSSStyleDeclaration,
  positionedDescendantUsesPosition: boolean,
): boolean {
  if (
    (positionedDescendantUsesPosition && styles.position !== 'static') ||
    styles.transform !== 'none' ||
    styles.perspective !== 'none' ||
    styles.filter !== 'none' ||
    getStyleValue(styles, 'backdrop-filter') !== 'none' ||
    establishesContainingBlockViaContain(styles.contain) ||
    establishesContainingBlockViaWillChange(styles.willChange) ||
    getStyleValue(styles, 'container-type') !== 'normal'
  ) {
    return true;
  }

  return false;
}

function establishesContainingBlockViaContain(contain: string): boolean {
  return contain
    .trim()
    .split(/\s+/)
    .some(
      (token) =>
        token === 'layout' ||
        token === 'paint' ||
        token === 'content' ||
        token === 'strict',
    );
}

function establishesContainingBlockViaWillChange(willChange: string): boolean {
  return willChange
    .trim()
    .split(/\s*,\s*/)
    .some((property) =>
      [
        'transform',
        'perspective',
        'filter',
        'backdrop-filter',
        'contain',
      ].includes(property),
    );
}

function getStyleValue(styles: CSSStyleDeclaration, property: string): string {
  return styles.getPropertyValue(property).trim();
}

function hasRelativeMaxHeight(styles: CSSStyleDeclaration): boolean {
  const maxHeight = styles.maxHeight.trim();
  const maxBlockSize = styles.getPropertyValue('max-block-size').trim();
  return (
    (maxHeight !== '' &&
      maxHeight !== 'none' &&
      parsePixelLength(maxHeight) === null) ||
    (isHorizontalWritingMode(styles) &&
      maxBlockSize !== '' &&
      maxBlockSize !== 'none' &&
      parsePixelLength(maxBlockSize) === null)
  );
}

function hasContainingBlockPercentage(styles: CSSStyleDeclaration): boolean {
  const maxHeight = styles.maxHeight.trim();
  const maxBlockSize = styles.getPropertyValue('max-block-size').trim();
  return (
    maxHeight.includes('%') ||
    (isHorizontalWritingMode(styles) && maxBlockSize.includes('%'))
  );
}

interface CssUnitValueLike {
  readonly unit: string;
  readonly value: number;
}

function hasDefiniteContainingBlockBlockSize(container: Element): boolean {
  return getCssPixelBlockSize(container) !== null;
}

function shouldObserveContainingBlock(container: Element): boolean {
  const state = getContainingBlockBlockSizeState(container);
  return state !== 'indefinite';
}

function getContainingBlockBlockSizeState(
  container: Element,
): 'definite' | 'indefinite' | 'unknown' {
  const elementWithStyleMap = container as Element & {
    computedStyleMap?: () => StylePropertyMapReadOnly;
  };
  if (typeof elementWithStyleMap.computedStyleMap !== 'function') {
    return 'unknown';
  }

  const value = elementWithStyleMap.computedStyleMap().get('height');
  if (isCssPixelValue(value)) {
    return 'definite';
  }

  if (isCssKeywordValue(value) && value.value === 'auto') {
    return 'indefinite';
  }

  return 'unknown';
}

function getCssPixelBlockSize(container: Element): number | null {
  const elementWithStyleMap = container as Element & {
    computedStyleMap?: () => StylePropertyMapReadOnly;
  };
  if (typeof elementWithStyleMap.computedStyleMap !== 'function') {
    return null;
  }

  const value = elementWithStyleMap.computedStyleMap().get('height');
  if (!isCssPixelValue(value)) {
    return null;
  }

  return value.value;
}

function isCssPixelValue(value: unknown): value is CssUnitValueLike {
  if (typeof value !== 'object' || value === null || !('unit' in value)) {
    return false;
  }

  const candidate = value as { unit?: unknown; value?: unknown };
  return candidate.unit === 'px' && typeof candidate.value === 'number';
}

function isCssKeywordValue(
  value: unknown,
): value is { readonly value: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    typeof value.value === 'string'
  );
}

function formMutationMayAffectTextarea(
  textarea: HTMLTextAreaElement,
  records: readonly MutationRecord[],
): boolean {
  const associatedId = textarea.getAttribute('form');
  const currentForm = textarea.form;

  return records.some((record) => {
    if (record.target === textarea) {
      return true;
    }

    if (record.type === 'attributes') {
      return (
        record.target === currentForm ||
        (record.attributeName === 'id' &&
          associatedId !== null &&
          (record.target as Element).id === associatedId)
      );
    }

    if (record.type !== 'childList') {
      return false;
    }

    if (recordTouchesTextarea(record, textarea)) {
      return true;
    }

    return [...record.addedNodes, ...record.removedNodes].some((node) =>
      nodeContainsRelevantForm(node, associatedId, currentForm),
    );
  });
}

function recordTouchesTextarea(
  record: MutationRecord,
  textarea: HTMLTextAreaElement,
): boolean {
  return [...record.addedNodes, ...record.removedNodes].some((node) =>
    nodeContains(node, textarea),
  );
}

function nodeContains(node: Node, target: Node): boolean {
  return (
    node === target ||
    (node.nodeType === 1 && (node as Element).contains(target))
  );
}

function nodeContainsRelevantForm(
  node: Node,
  associatedId: string | null,
  currentForm: HTMLFormElement | null,
): boolean {
  if (node.nodeType !== 1) {
    return false;
  }

  const element = node as Element;
  if (
    element.tagName.toLowerCase() === 'form' &&
    (element === currentForm ||
      (associatedId !== null && element.id === associatedId))
  ) {
    return true;
  }

  return [...element.querySelectorAll('form')].some(
    (form) =>
      form === currentForm ||
      (associatedId !== null && form.id === associatedId),
  );
}

function parsePixels(value: string): number {
  const pixels = Number.parseFloat(value);
  return Number.isFinite(pixels) ? pixels : 0;
}

function getLineHeight(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
): number | null {
  const lineHeight = parsePixels(styles.lineHeight);
  if (lineHeight > 0) {
    return lineHeight;
  }

  return measureSingleRowHeight(textarea, styles);
}

function measureSingleRowHeight(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
): number | null {
  const view = textarea.ownerDocument.defaultView;
  if (!view || typeof view.getComputedStyle !== 'function') {
    return null;
  }

  const clone = textarea.cloneNode(false) as HTMLTextAreaElement;
  clone.value = 'x';
  clone.setAttribute('rows', '1');
  clone.removeAttribute('placeholder');
  clone.style.cssText = textarea.style.cssText;
  copyMetricStyles(clone, styles);
  const placeholder = textarea.getAttribute('placeholder');
  if (textarea.value === '' && placeholder !== null) {
    copyPlaceholderMeasurementStyles(
      clone,
      getPlaceholderStyles(textarea, view),
    );
  }
  clone.style.position = 'fixed';
  clone.style.left = '-100000px';
  clone.style.top = '-100000px';
  clone.style.visibility = 'hidden';
  clone.style.pointerEvents = 'none';
  clone.style.height = 'auto';
  clone.style.minHeight = '0px';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'hidden';
  clone.style.width = `${getMeasurementWidth(textarea, styles)}px`;
  clone.tabIndex = -1;

  const root = textarea.getRootNode();
  const container = isShadowRoot(root, textarea.ownerDocument)
    ? root
    : textarea.ownerDocument.body;
  if (!container) {
    return fallbackNormalLineHeight(styles);
  }

  container.append(clone);
  try {
    const padding = getVerticalPadding(styles);
    const borders = getVerticalBorders(styles);
    const heightFromScroll = clone.scrollHeight - padding;
    const heightFromLayout = clone.offsetHeight - padding - borders;
    const height = heightFromScroll > 0 ? heightFromScroll : heightFromLayout;
    return Number.isFinite(height) && height > 0
      ? height
      : fallbackNormalLineHeight(styles);
  } finally {
    clone.remove();
  }
}

function copyMetricStyles(
  target: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
): void {
  for (const property of TEXT_METRIC_PROPERTIES) {
    const value = styles.getPropertyValue(property);
    if (value !== '') {
      target.style.setProperty(property, value);
    }
  }
  for (const property of [
    'box-sizing',
    'display',
    'margin',
    'padding',
    'border-style',
    'border-width',
    'width',
  ]) {
    const value = styles.getPropertyValue(property);
    if (value !== '') {
      target.style.setProperty(property, value);
    }
  }
}

function getMeasurementWidth(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
): number {
  const rectWidth = textarea.getBoundingClientRect().width;
  if (rectWidth > 0) {
    return rectWidth;
  }

  const declaredWidth = parsePixels(styles.width);
  return declaredWidth > 0 ? declaredWidth : 1;
}

function fallbackNormalLineHeight(styles: CSSStyleDeclaration): number | null {
  const fontSize = parsePixels(styles.fontSize);
  return fontSize > 0 ? fontSize * 1.2 : null;
}

function captureTextareaInteractionState(
  textarea: HTMLTextAreaElement,
): TextareaInteractionState {
  return {
    value: textarea.value,
    selectionStart: textarea.selectionStart,
    selectionEnd: textarea.selectionEnd,
    selectionDirection: textarea.selectionDirection,
    scrollTop: textarea.scrollTop,
    scrollLeft: textarea.scrollLeft,
  };
}

function restoreTextareaInteractionState(
  textarea: HTMLTextAreaElement,
  state: TextareaInteractionState,
): void {
  try {
    if (textarea.value !== state.value) {
      textarea.value = state.value;
    }
  } finally {
    try {
      if (state.selectionStart !== null && state.selectionEnd !== null) {
        restoreSelection(
          textarea,
          state.selectionStart,
          state.selectionEnd,
          state.selectionDirection,
        );
      }
    } finally {
      textarea.scrollTop = state.scrollTop;
      textarea.scrollLeft = state.scrollLeft;
    }
  }
}

function restoreSelection(
  textarea: HTMLTextAreaElement,
  selectionStart: number,
  selectionEnd: number,
  selectionDirection: 'forward' | 'backward' | 'none' | null,
): void {
  textarea.setSelectionRange(
    selectionStart,
    selectionEnd,
    selectionDirection ?? 'none',
  );
}

function copyPlaceholderMeasurementStyles(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration | null,
): void {
  if (!styles) {
    return;
  }

  for (const property of PLACEHOLDER_METRIC_PROPERTIES) {
    const value = styles.getPropertyValue(property);
    if (value !== '') {
      textarea.style.setProperty(property, value);
    }
  }
}

function getContentBoxWidth(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
): number {
  const horizontalPadding =
    parsePixels(styles.paddingLeft) + parsePixels(styles.paddingRight);
  const horizontalBorders =
    parsePixels(styles.borderLeftWidth) + parsePixels(styles.borderRightWidth);
  const paddingBoxWidth = textarea.clientWidth;
  if (paddingBoxWidth > 0) {
    return Math.max(0, paddingBoxWidth - horizontalPadding);
  }

  const offsetBorderBoxWidth = textarea.offsetWidth;
  if (offsetBorderBoxWidth > 0) {
    return Math.max(
      0,
      offsetBorderBoxWidth - horizontalBorders - horizontalPadding,
    );
  }

  const declaredWidth = parsePixels(styles.width);
  if (declaredWidth > 0) {
    return Math.max(
      0,
      styles.boxSizing === 'border-box'
        ? declaredWidth - horizontalBorders - horizontalPadding
        : declaredWidth,
    );
  }

  return 0;
}

function getVerticalPadding(styles: CSSStyleDeclaration): number {
  return parsePixels(styles.paddingTop) + parsePixels(styles.paddingBottom);
}

function getVerticalBorders(styles: CSSStyleDeclaration): number {
  return (
    parsePixels(styles.borderTopWidth) + parsePixels(styles.borderBottomWidth)
  );
}

function getHorizontalScrollbarGutter(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
): number {
  if (
    textarea.getAttribute('wrap') !== 'off' ||
    getHorizontalOverflowMode(textarea, styles) === 'hidden'
  ) {
    return 0;
  }

  if (
    getHorizontalOverflowMode(textarea, styles) === 'auto' &&
    textarea.scrollWidth <= textarea.clientWidth
  ) {
    return 0;
  }

  return Math.max(
    0,
    textarea.offsetHeight - textarea.clientHeight - getVerticalBorders(styles),
  );
}

function getHorizontalOverflowMode(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
): 'auto' | 'hidden' | 'scroll' {
  if (textarea.getAttribute('wrap') !== 'off') {
    return 'hidden';
  }

  if (styles.overflowX === 'scroll') {
    return 'scroll';
  }

  return styles.overflowX === 'auto' ? 'auto' : 'hidden';
}

function getPlaceholderStyles(
  textarea: HTMLTextAreaElement,
  view: Window,
): CSSStyleDeclaration | null {
  try {
    return view.getComputedStyle(textarea, '::placeholder');
  } catch {
    return null;
  }
}

function eventIsComposing(event: Event): boolean {
  return 'isComposing' in event && event.isComposing === true;
}

function isMetricTransitionEvent(event: Event): boolean {
  const propertyName = (event as Event & { readonly propertyName?: string })
    .propertyName;
  return (
    propertyName === undefined || METRIC_TRANSITION_PROPERTIES.has(propertyName)
  );
}

function getMeasurementSignature(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
  view: Window,
  cssMaxHeight: number,
): string {
  const placeholderStyles =
    textarea.value === '' && textarea.getAttribute('placeholder')
      ? getPlaceholderStyles(textarea, view)
      : null;
  return [
    ...TEXT_METRIC_PROPERTIES.map((property) =>
      styles.getPropertyValue(property),
    ),
    `box-sizing:${styles.boxSizing}`,
    `wrap:${textarea.getAttribute('wrap') ?? ''}`,
    `placeholder:${textarea.getAttribute('placeholder') ?? ''}`,
    ...(placeholderStyles
      ? PLACEHOLDER_METRIC_PROPERTIES.map(
          (property) =>
            `placeholder-${property}:${placeholderStyles.getPropertyValue(property)}`,
        )
      : []),
    `min-height:${styles.minHeight}`,
    `max-height:${styles.maxHeight}`,
    `max-block-size:${styles.getPropertyValue('max-block-size')}`,
    `resolved-max-height:${cssMaxHeight}`,
    `overflow-x:${getHorizontalOverflowMode(textarea, styles)}`,
  ].join('|');
}

function getCssMaxContentHeight(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
  padding: number,
  borders: number,
  horizontalScrollbarGutter: number,
): number {
  const physicalMaxHeight = getCssMaxContentHeightForProperty(
    textarea,
    styles,
    styles.maxHeight,
    'height',
    padding,
    borders,
    horizontalScrollbarGutter,
  );
  const logicalMaxBlockSize = isHorizontalWritingMode(styles)
    ? getCssMaxContentHeightForProperty(
        textarea,
        styles,
        styles.getPropertyValue('max-block-size'),
        'block-size',
        padding,
        borders,
        horizontalScrollbarGutter,
      )
    : Number.POSITIVE_INFINITY;

  return Math.min(physicalMaxHeight, logicalMaxBlockSize);
}

function getCssMaxContentHeightForProperty(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
  value: string,
  sizeProperty: 'height' | 'block-size',
  padding: number,
  borders: number,
  horizontalScrollbarGutter: number,
): number {
  const maxSize = value.trim();
  if (maxSize === '' || maxSize === 'none') {
    return Number.POSITIVE_INFINITY;
  }

  const pixelMaxSize = parsePixelLength(maxSize);
  if (pixelMaxSize === null) {
    const resolvedSize = resolveCssMaxSize(textarea, styles, sizeProperty);
    if (resolvedSize === null) {
      return Number.POSITIVE_INFINITY;
    }

    return Math.max(
      0,
      resolvedSize - padding - borders - horizontalScrollbarGutter,
    );
  }

  return styles.boxSizing === 'border-box'
    ? Math.max(0, pixelMaxSize - padding - borders - horizontalScrollbarGutter)
    : Math.max(0, pixelMaxSize - horizontalScrollbarGutter);
}

function isHorizontalWritingMode(styles: CSSStyleDeclaration): boolean {
  const writingMode = styles.getPropertyValue('writing-mode').trim();
  return writingMode === '' || writingMode === 'horizontal-tb';
}

function resolveCssMaxSize(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
  sizeProperty: 'height' | 'block-size',
): number | null {
  const percentage = parsePercentageLength(
    sizeProperty === 'height'
      ? styles.maxHeight
      : styles.getPropertyValue('max-block-size'),
  );
  if (percentage !== null) {
    const container = findConstraintContainingBlock(textarea, styles);
    const containerHeight = getDefiniteContainingBlockHeight(
      container,
      styles.position,
    );
    if (containerHeight !== null) {
      return containerHeight * percentage;
    }
  }

  const resolutionHeight = '10000000px';
  const previousHeight = captureInlineStyle(textarea.style, 'height');
  const previousBlockSize = captureInlineStyle(textarea.style, 'block-size');
  const previousMaxHeight = captureInlineStyle(textarea.style, 'max-height');
  const previousMaxBlockSize = captureInlineStyle(
    textarea.style,
    'max-block-size',
  );
  const previousOverflowY = captureInlineStyle(textarea.style, 'overflow-y');
  resolvingCssMaxHeight.add(textarea);

  try {
    textarea.style.setProperty(
      'max-height',
      sizeProperty === 'height' ? styles.maxHeight : 'none',
    );
    textarea.style.setProperty(
      'max-block-size',
      sizeProperty === 'block-size'
        ? styles.getPropertyValue('max-block-size')
        : 'none',
    );
    textarea.style.setProperty('height', resolutionHeight);
    textarea.style.setProperty(
      'block-size',
      sizeProperty === 'block-size' ? resolutionHeight : '',
    );
    textarea.style.setProperty('overflow-y', 'hidden');
    const physicalHeight = getUntransformedLayoutHeight(textarea, styles);
    return Number.isFinite(physicalHeight) && physicalHeight < 10000000
      ? physicalHeight
      : null;
  } finally {
    restoreInlineStyle(textarea.style, 'height', previousHeight);
    restoreInlineStyle(textarea.style, 'block-size', previousBlockSize);
    restoreInlineStyle(textarea.style, 'max-height', previousMaxHeight);
    restoreInlineStyle(textarea.style, 'max-block-size', previousMaxBlockSize);
    restoreInlineStyle(textarea.style, 'overflow-y', previousOverflowY);
    scheduleMicrotask(() => resolvingCssMaxHeight.delete(textarea));
  }
}

function getUntransformedLayoutHeight(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
): number {
  if (textarea.offsetHeight > 0) {
    return textarea.offsetHeight;
  }

  return (
    textarea.clientHeight +
    parsePixels(styles.borderTopWidth) +
    parsePixels(styles.borderBottomWidth)
  );
}

const resolvingCssMaxHeight = new WeakSet<HTMLTextAreaElement>();

function captureInlineStyle(
  styles: CSSStyleDeclaration,
  property: string,
): InlineStyleValue {
  let present = false;
  for (let index = 0; index < styles.length; index += 1) {
    if (styles.item(index) === property) {
      present = true;
      break;
    }
  }
  return {
    present,
    value: styles.getPropertyValue(property),
    priority: styles.getPropertyPriority(property),
  };
}

function restoreInlineStyle(
  styles: CSSStyleDeclaration,
  property: string,
  state: InlineStyleValue,
): void {
  if (!state.present) {
    styles.removeProperty(property);
    return;
  }
  styles.setProperty(property, state.value, state.priority);
}

function isResolvingCssMaxHeight(textarea: HTMLTextAreaElement): boolean {
  return resolvingCssMaxHeight.has(textarea);
}

function parsePixelLength(value: string): number | null {
  const match = /^(-?(?:\d+\.?\d*|\.\d+))px$/i.exec(value.trim());
  if (!match) {
    return null;
  }

  const pixels = Number(match[1]);
  return Number.isFinite(pixels) ? pixels : null;
}

function parsePercentageLength(value: string): number | null {
  const match = /^(-?(?:\d+\.?\d*|\.\d+))%$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const percentage = Number(match[1]);
  return Number.isFinite(percentage) ? percentage / 100 : null;
}

function getDefiniteContainingBlockHeight(
  container: Element | null,
  textareaPosition: string,
): number | null {
  if (!container) {
    return null;
  }

  if (!hasDefiniteContainingBlockBlockSize(container)) {
    return null;
  }
  const declaredHeight = getCssPixelBlockSize(container);
  if (declaredHeight === null) {
    return null;
  }

  const view = container.ownerDocument.defaultView;
  if (!view || typeof view.getComputedStyle !== 'function') {
    return null;
  }

  const styles = view.getComputedStyle(container);
  const padding = getVerticalPadding(styles);
  const borders = getVerticalBorders(styles);
  const contentBoxHeight =
    styles.boxSizing === 'border-box'
      ? Math.max(0, declaredHeight - padding - borders)
      : declaredHeight;

  return textareaPosition === 'absolute' || textareaPosition === 'fixed'
    ? contentBoxHeight + padding
    : contentBoxHeight;
}

function scheduleMicrotask(callback: () => void): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
    return;
  }

  void Promise.resolve().then(callback);
}

function normalizeRows(value: number | null): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  const rows = Math.floor(value);
  return rows >= 1 ? rows : null;
}

const TEXT_METRIC_PROPERTIES = [
  'border-bottom-style',
  'border-bottom-width',
  'border-left-style',
  'border-left-width',
  'border-right-style',
  'border-right-width',
  'border-top-style',
  'border-top-width',
  'direction',
  'font-family',
  'font-feature-settings',
  'font-size',
  'font-size-adjust',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-weight',
  'font-variation-settings',
  'hyphens',
  'letter-spacing',
  'line-height',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'tab-size',
  'text-indent',
  'text-rendering',
  'text-transform',
  'white-space',
  'word-break',
  'word-spacing',
  'overflow-wrap',
] as const;

const PLACEHOLDER_METRIC_PROPERTIES = [
  'direction',
  'font-family',
  'font-feature-settings',
  'font-size',
  'font-size-adjust',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-weight',
  'font-variation-settings',
  'hyphens',
  'letter-spacing',
  'line-height',
  'tab-size',
  'text-indent',
  'text-rendering',
  'text-transform',
  'white-space',
  'word-break',
  'word-spacing',
  'overflow-wrap',
] as const;

const PSEUDO_STATE_EVENTS = [
  'focus',
  'blur',
  'pointerenter',
  'pointerleave',
  'pointerdown',
  'pointerup',
  'pointercancel',
] as const;

const POINTER_STATE_EVENTS = [
  'pointerover',
  'pointerout',
  'pointerdown',
  'pointerup',
  'pointercancel',
] as const;

const METRIC_TRANSITION_PROPERTIES = new Set([
  ...TEXT_METRIC_PROPERTIES,
  'border',
  'font',
  'padding',
]);

function isPointerStateEvent(type: string): boolean {
  return type.startsWith('pointer');
}
