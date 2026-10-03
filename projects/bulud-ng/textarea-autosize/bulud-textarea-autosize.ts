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

interface HistoryInvalidationManager {
  add(listener: () => void): void;
  remove(listener: () => void): void;
}

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
  private observedElements = new Set<Element>();
  private queryContainers = new Set<Element>();
  private mutationObserver: MutationObserver | null = null;
  private stylesheetLoadListeners = new Map<HTMLLinkElement, EventListener>();
  private formMutationObserver: MutationObserver | null = null;
  private formMutationRoot: Node | null = null;
  private restoreBaselineObserver: MutationObserver | null = null;
  private metricAncestors: Element[] = [];
  private viewportResizeListener: EventListener | null = null;
  private hashChangeListener: EventListener | null = null;
  private historyInvalidationManager: HistoryInvalidationManager | null = null;
  private historyInvalidationListener: (() => void) | null = null;
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
  private deferredRemeasurementScheduled = false;
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
      this.connectHashChangeListener();
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
        this.disconnectHashChangeListener();
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
    this.disconnectHashChangeListener();
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
    this.setOwnedStyle('overflow-y', 'hidden');
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
    this.ownedHeightPriority = 'important';
    this.ownedOverflowY = nextOverflowY;
    this.ownedOverflowYPriority = 'important';
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

      const previousConstraintContainer = this.constraintContainer;
      const previousQueryContainers = new Set(this.queryContainers);
      this.updateConstraintObservation();
      this.updateQueryContainerObservation();

      let shouldResize = false;
      let measurementSignatureChanged: boolean | undefined;
      const signatureChanged = (): boolean =>
        (measurementSignatureChanged ??= this.hasMeasurementSignatureChanged());
      for (const entry of entries) {
        if (
          entry.target === this.constraintContainer ||
          entry.target === previousConstraintContainer ||
          this.queryContainers.has(entry.target) ||
          previousQueryContainers.has(entry.target)
        ) {
          shouldResize = shouldResize || signatureChanged();
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

        shouldResize = shouldResize || signatureChanged();

        if (this.hasExternalOwnedSizingChange()) {
          shouldResize = true;
        }
      }

      if (shouldResize) {
        this.resize();
      }
    });
    this.updateConstraintObservation();
    this.updateQueryContainerObservation();
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
        const ancestorChainMoved = metricObservationWasMoved(
          records,
          this.element.nativeElement,
        );
        const stylesheetMutation = stylesheetMutationMayAffectMeasurement(
          records,
          this.document,
          this.element.nativeElement,
        );
        if (stylesheetMutation) {
          this.syncStylesheetLoadListeners();
        }
        const measurementMayBeAffected =
          mutationMayAffectMeasurement(
            records,
            this.element.nativeElement,
            ancestorChainMoved,
          ) || stylesheetMutation;
        if (ancestorChainMoved) {
          this.reconnectMetricAncestors();
          this.connectFormResetListener();
          this.connectFormMutationObserver();
        }
        if (measurementMayBeAffected) {
          this.updateConstraintObservation();
          this.updateQueryContainerObservation();
        }
        if (measurementMayBeAffected) {
          if (
            isResolvingCssMaxHeight(this.element.nativeElement) &&
            mutationIncludesExternalMeasurementChange(
              records,
              this.element.nativeElement,
            )
          ) {
            this.scheduleDeferredRemeasurement();
          } else if (!isResolvingCssMaxHeight(this.element.nativeElement)) {
            this.remeasureIfNeeded();
          }
        }
      }
    });
    this.mutationObserver.observe(this.element.nativeElement, {
      attributes: true,
      attributeOldValue: true,
    });
    this.mutationObserver.observe(this.document.head, {
      attributes: true,
      attributeFilter: ['disabled', 'href', 'media', 'rel'],
      childList: true,
      subtree: true,
    });
    this.metricAncestors = getMetricAncestors(this.element.nativeElement);
    for (const ancestor of this.metricAncestors) {
      const observeChildList = ancestor !== this.document.documentElement;
      this.mutationObserver.observe(ancestor, {
        attributes: true,
        ...(observeChildList
          ? {
              childList: true,
              ...(ancestor !== this.document.body ? { subtree: true } : {}),
            }
          : {}),
      });
    }
    for (const ancestor of getShadowHostReparentObservers(
      this.element.nativeElement,
    )) {
      this.mutationObserver.observe(ancestor, {
        childList: true,
        ...(isShadowRoot(ancestor, this.document)
          ? {
              attributes: true,
              attributeFilter: ['disabled', 'href', 'media', 'rel'],
              subtree: true,
            }
          : {}),
      });
    }
    this.connectPseudoStateListeners();

    this.connectFormMutationObserver();
    this.updateQueryContainerObservation();
    this.syncStylesheetLoadListeners();
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
    this.observedElements.clear();
    this.lastObservedWidth = null;
    this.constraintContainer = null;
    this.queryContainers.clear();
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
    this.disconnectStylesheetLoadListeners();
    this.disconnectPseudoStateListeners();
  }

  private syncStylesheetLoadListeners(): void {
    if (this.destroyed || !this.hasBrowserView()) {
      return;
    }

    const links = new Set<HTMLLinkElement>();
    const roots: (Element | ShadowRoot)[] = [
      this.document.head,
      ...getContainingShadowRoots(this.element.nativeElement),
    ];
    for (const root of roots) {
      for (const link of root.querySelectorAll<HTMLLinkElement>(
        'link[rel~="stylesheet"]',
      )) {
        links.add(link);
      }
    }

    for (const [link, listener] of this.stylesheetLoadListeners) {
      if (!links.has(link)) {
        link.removeEventListener('load', listener);
        this.stylesheetLoadListeners.delete(link);
      }
    }

    for (const link of links) {
      if (this.stylesheetLoadListeners.has(link)) {
        continue;
      }

      const listener: EventListener = () => {
        if (!this.destroyed && this.enabled()) {
          this.scheduleInvalidationRemeasurement();
        }
      };
      link.addEventListener('load', listener);
      this.stylesheetLoadListeners.set(link, listener);
    }
  }

  private disconnectStylesheetLoadListeners(): void {
    for (const [link, listener] of this.stylesheetLoadListeners) {
      link.removeEventListener('load', listener);
    }
    this.stylesheetLoadListeners.clear();
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

  private connectHashChangeListener(): void {
    if (this.hashChangeListener || this.destroyed) {
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
    view.addEventListener('hashchange', listener);
    this.hashChangeListener = listener;
    const historyListener = (): void => {
      if (!this.destroyed && this.enabled()) {
        this.remeasureIfNeeded();
      }
    };
    const historyInvalidationManager = connectHistoryInvalidation(view);
    historyInvalidationManager.add(historyListener);
    this.historyInvalidationManager = historyInvalidationManager;
    this.historyInvalidationListener = historyListener;
  }

  private disconnectHashChangeListener(): void {
    const view = this.document.defaultView;
    if (view && this.hashChangeListener) {
      view.removeEventListener('hashchange', this.hashChangeListener);
    }
    this.hashChangeListener = null;
    if (this.historyInvalidationManager && this.historyInvalidationListener) {
      this.historyInvalidationManager.remove(this.historyInvalidationListener);
    }
    this.historyInvalidationManager = null;
    this.historyInvalidationListener = null;
  }

  private reconnectMetricAncestors(): void {
    if (!this.mutationObserver) {
      return;
    }

    this.mutationObserver.disconnect();
    this.mutationObserver.observe(this.element.nativeElement, {
      attributes: true,
      attributeOldValue: true,
    });
    this.mutationObserver.observe(this.document.head, {
      attributes: true,
      attributeFilter: ['disabled', 'href', 'media', 'rel'],
      childList: true,
      subtree: true,
    });
    this.metricAncestors = getMetricAncestors(this.element.nativeElement);
    for (const ancestor of this.metricAncestors) {
      const observeChildList = ancestor !== this.document.documentElement;
      this.mutationObserver.observe(ancestor, {
        attributes: true,
        ...(observeChildList
          ? {
              childList: true,
              ...(ancestor !== this.document.body ? { subtree: true } : {}),
            }
          : {}),
      });
    }
    for (const ancestor of getShadowHostReparentObservers(
      this.element.nativeElement,
    )) {
      this.mutationObserver.observe(ancestor, {
        childList: true,
        ...(isShadowRoot(ancestor, this.document)
          ? {
              attributes: true,
              attributeFilter: ['disabled', 'href', 'media', 'rel'],
              subtree: true,
            }
          : {}),
      });
    }
    this.connectPseudoStateListeners();
    this.syncStylesheetLoadListeners();
    this.updateQueryContainerObservation();
    this.updateConstraintObservation();
  }

  private connectPseudoStateListeners(): void {
    this.disconnectPseudoStateListeners();

    const listener: EventListener = () => {
      this.remeasureIfNeeded();
    };
    const formStateListener: EventListener = () => {
      this.scheduleInvalidationRemeasurement();
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
      this.addPseudoStateListener(ancestor, 'input', formStateListener);
      this.addPseudoStateListener(ancestor, 'change', formStateListener);
      for (const type of POINTER_STATE_EVENTS) {
        this.addPseudoStateListener(ancestor, type, pointerListener, true);
      }
    }

    const root = textarea.getRootNode();
    if (isShadowRoot(root, textarea.ownerDocument)) {
      this.addPseudoStateListener(root, 'focusin', listener);
      this.addPseudoStateListener(root, 'focusout', listener);
      this.addPseudoStateListener(root, 'input', formStateListener);
      this.addPseudoStateListener(root, 'change', formStateListener);
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
    this.deferredRemeasurementScheduled = false;
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
        if (isResolvingCssMaxHeight(this.element.nativeElement)) {
          this.scheduleDeferredRemeasurement();
        } else {
          this.remeasureIfNeeded();
        }
      }
    });
  }

  private scheduleDeferredRemeasurement(): void {
    if (this.deferredRemeasurementScheduled) {
      return;
    }

    this.deferredRemeasurementScheduled = true;
    const generation = this.pointerInvalidationGeneration;
    scheduleMicrotask(() => {
      this.deferredRemeasurementScheduled = false;
      if (generation !== this.pointerInvalidationGeneration) {
        return;
      }

      if (!this.destroyed && this.enabled()) {
        if (isResolvingCssMaxHeight(this.element.nativeElement)) {
          this.scheduleDeferredRemeasurement();
        } else {
          this.remeasureIfNeeded();
        }
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
    this.constraintContainer = nextContainer;
    this.reconcileObservationRoles();
  }

  private updateQueryContainerObservation(): void {
    if (!this.observer || this.destroyed || !this.hasBrowserView()) {
      return;
    }

    const view = this.document.defaultView;
    if (!view || typeof view.getComputedStyle !== 'function') {
      return;
    }

    const nextContainers = new Set(
      this.metricAncestors.filter((ancestor) =>
        isSizeQueryContainer(view.getComputedStyle(ancestor)),
      ),
    );
    this.queryContainers = nextContainers;
    this.reconcileObservationRoles();
  }

  private reconcileObservationRoles(): void {
    if (!this.observer || this.destroyed || !this.hasBrowserView()) {
      return;
    }

    const desiredElements = new Set<Element>([this.element.nativeElement]);
    if (this.constraintContainer) {
      desiredElements.add(this.constraintContainer);
    }
    for (const container of this.queryContainers) {
      desiredElements.add(container);
    }

    for (const element of this.observedElements) {
      if (!desiredElements.has(element)) {
        this.observer.unobserve(element);
        this.observedElements.delete(element);
      }
    }
    for (const element of desiredElements) {
      if (!this.observedElements.has(element)) {
        this.observer.observe(element);
        this.observedElements.add(element);
      }
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
    textarea.style.setProperty(property, value, 'important');
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

const historyInvalidationManagers = new WeakMap<
  Window,
  HistoryInvalidationManager
>();

function connectHistoryInvalidation(view: Window): HistoryInvalidationManager {
  const existing = historyInvalidationManagers.get(view);
  if (existing) {
    return existing;
  }

  const history = view.history;
  const listeners = new Set<() => void>();
  const pushState = history.pushState;
  const replaceState = history.replaceState;
  const notifyFragmentChange = (previousHash: string): void => {
    if (view.location.hash !== previousHash) {
      for (const callback of [...listeners]) {
        callback();
      }
    }
  };
  const wrappedPushState: History['pushState'] = function (
    this: History,
    ...args: Parameters<History['pushState']>
  ): ReturnType<History['pushState']> {
    const previousHash = view.location.hash;
    const result = pushState.apply(this, args);
    notifyFragmentChange(previousHash);
    return result;
  };
  const wrappedReplaceState: History['replaceState'] = function (
    this: History,
    ...args: Parameters<History['replaceState']>
  ): ReturnType<History['replaceState']> {
    const previousHash = view.location.hash;
    const result = replaceState.apply(this, args);
    notifyFragmentChange(previousHash);
    return result;
  };
  history.pushState = wrappedPushState;
  history.replaceState = wrappedReplaceState;

  const manager: HistoryInvalidationManager = {
    add(callback: () => void): void {
      listeners.add(callback);
    },
    remove(callback: () => void): void {
      listeners.delete(callback);
      if (listeners.size > 0) {
        return;
      }

      if (history.pushState === wrappedPushState) {
        history.pushState = pushState;
      }
      if (history.replaceState === wrappedReplaceState) {
        history.replaceState = replaceState;
      }
      historyInvalidationManagers.delete(view);
    },
  };
  historyInvalidationManagers.set(view, manager);
  return manager;
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
  const movedElements = [
    textarea,
    ...getMetricAncestors(textarea),
    ...getShadowHostChain(textarea),
  ];
  return records.some((record) => {
    if (record.type !== 'childList') {
      return false;
    }

    return movedElements.some((element) => recordTouchesNode(record, element));
  });
}

function mutationMayAffectMeasurement(
  records: readonly MutationRecord[],
  textarea: HTMLTextAreaElement,
  ancestorChainMoved: boolean,
): boolean {
  if (ancestorChainMoved) {
    return true;
  }

  const body = textarea.ownerDocument.body;
  return records.some(
    (record) =>
      record.type !== 'childList' ||
      record.target === body ||
      getMetricAncestors(textarea).some(
        (ancestor) =>
          record.target === ancestor || ancestor.contains(record.target),
      ),
  );
}

function stylesheetMutationMayAffectMeasurement(
  records: readonly MutationRecord[],
  document: Document,
  textarea: HTMLTextAreaElement,
): boolean {
  const roots: (Element | ShadowRoot)[] = [
    document.head,
    ...getContainingShadowRoots(textarea),
  ];
  return records.some((record) => {
    if (
      !roots.some(
        (root) => root === record.target || root.contains(record.target),
      )
    ) {
      return false;
    }

    if (record.type === 'attributes') {
      return isStylesheetElement(record.target) || isLinkElement(record.target);
    }

    return (
      record.type === 'childList' &&
      (isStylesheetElement(record.target) ||
        [...record.addedNodes, ...record.removedNodes].some((node) =>
          containsStylesheetElement(node),
        ))
    );
  });
}

function getContainingShadowRoots(textarea: HTMLTextAreaElement): ShadowRoot[] {
  const roots: ShadowRoot[] = [];
  let current: Element = textarea;
  while (true) {
    const root = current.getRootNode();
    if (!isShadowRoot(root, textarea.ownerDocument)) {
      return roots;
    }

    roots.push(root);
    current = root.host;
  }
}

function containsStylesheetElement(node: Node): boolean {
  return (
    isStylesheetElement(node) ||
    (isElementNode(node) &&
      node.querySelector('style,link[rel~="stylesheet"]') !== null)
  );
}

function isStylesheetElement(node: Node | null): boolean {
  return (
    isElementNode(node) &&
    (node.localName === 'style' ||
      (isLinkElement(node) && node.relList.contains('stylesheet')))
  );
}

function isLinkElement(node: Node | null): node is HTMLLinkElement {
  return isElementNode(node) && node.localName === 'link';
}

function isElementNode(node: Node | null): node is Element {
  return node?.nodeType === 1;
}

function mutationIncludesExternalMeasurementChange(
  records: readonly MutationRecord[],
  textarea: HTMLTextAreaElement,
): boolean {
  return records.some(
    (record) =>
      record.target !== textarea ||
      record.type !== 'attributes' ||
      record.attributeName !== 'style' ||
      inlineMeasurementStyleChanged(record, textarea),
  );
}

function inlineMeasurementStyleChanged(
  record: MutationRecord,
  textarea: HTMLTextAreaElement,
): boolean {
  if (record.oldValue === null) {
    return true;
  }

  const previousStyle = textarea.ownerDocument.createElement('textarea').style;
  previousStyle.cssText = record.oldValue;
  return (
    getInlineMeasurementSignature(previousStyle) !==
    getInlineMeasurementSignature(textarea.style)
  );
}

function getInlineMeasurementSignature(styles: CSSStyleDeclaration): string {
  return INLINE_MEASUREMENT_PROPERTIES.map(
    (property) =>
      `${property}:${styles.getPropertyValue(property)}:${styles.getPropertyPriority(property)}`,
  ).join('|');
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
  const root = textarea.getRootNode();
  const seen = new Set<Node>();
  if (isShadowRoot(root, textarea.ownerDocument)) {
    seen.add(root);
    observers.push(root);
  }
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
  textarea: Element,
  styles: CSSStyleDeclaration,
): Element | null {
  if (styles.position !== 'absolute' && styles.position !== 'fixed') {
    const view = textarea.ownerDocument.defaultView;
    if (!view || typeof view.getComputedStyle !== 'function') {
      return textarea.parentElement;
    }

    let current = getContainingBlockTraversalParent(textarea);
    while (current) {
      const currentStyles = view.getComputedStyle(current);
      if (establishesInFlowContainingBlock(currentStyles)) {
        return current;
      }
      current = getContainingBlockTraversalParent(current);
    }

    return null;
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

function establishesInFlowContainingBlock(
  styles: CSSStyleDeclaration,
): boolean {
  const display = styles.display.trim();
  return (
    display !== 'contents' &&
    display !== 'inline' &&
    !display.startsWith('ruby') &&
    ![
      'table-row',
      'table-row-group',
      'table-header-group',
      'table-footer-group',
      'table-column',
      'table-column-group',
    ].includes(display)
  );
}

/** CSS properties that establish the containing block used by positioned descendants. */
function establishesConstraintContainingBlock(
  styles: CSSStyleDeclaration,
  positionedDescendantUsesPosition: boolean,
): boolean {
  if (
    (positionedDescendantUsesPosition && styles.position !== 'static') ||
    styles.transform !== 'none' ||
    getStyleValue(styles, 'scale') !== 'none' ||
    getStyleValue(styles, 'rotate') !== 'none' ||
    getStyleValue(styles, 'translate') !== 'none' ||
    styles.perspective !== 'none' ||
    styles.filter !== 'none' ||
    getStyleValue(styles, 'backdrop-filter') !== 'none' ||
    getStyleValue(styles, 'content-visibility') === 'auto' ||
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
        'scale',
        'rotate',
        'translate',
        'perspective',
        'filter',
        'backdrop-filter',
        'contain',
        'content-visibility',
      ].includes(property),
    );
}

function getStyleValue(styles: CSSStyleDeclaration, property: string): string {
  return styles.getPropertyValue(property).trim();
}

function isSizeQueryContainer(styles: CSSStyleDeclaration): boolean {
  const containerType = getStyleValue(styles, 'container-type');
  return containerType === 'inline-size' || containerType === 'size';
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

function shouldObserveContainingBlock(container: Element): boolean {
  if (isLayoutDefiniteAutoHeight(container)) {
    return true;
  }
  if (isIndefiniteFlexGridItem(container)) {
    return false;
  }
  return getResolvedCssPixelBlockSize(container) !== null;
}

function isLayoutDefiniteAutoHeight(container: Element): boolean {
  const parent = container.parentElement;
  const view = container.ownerDocument.defaultView;
  if (!parent || !view || typeof view.getComputedStyle !== 'function') {
    return false;
  }

  const parentStyles = view.getComputedStyle(parent);
  const containerStyles = view.getComputedStyle(container);
  if (!isStretchFlexGridItem(parentStyles, containerStyles)) {
    return false;
  }

  const display = parentStyles.display;
  const isFlex = display === 'flex' || display === 'inline-flex';
  const isGrid = display === 'grid' || display === 'inline-grid';

  const alignment =
    containerStyles.alignSelf === 'auto'
      ? parentStyles.alignItems
      : containerStyles.alignSelf;
  const stretches =
    alignment === 'stretch' || (isGrid && alignment === 'normal');
  if (!stretches) {
    return false;
  }

  if (isFlex) {
    const direction = parentStyles.flexDirection;
    if (direction === 'column' || direction === 'column-reverse') {
      return false;
    }
    return getResolvedCssPixelBlockSize(parent) !== null;
  }

  return (
    getResolvedCssPixelBlockSize(parent) !== null &&
    hasDefiniteGridRows(parentStyles)
  );
}

function isIndefiniteFlexGridItem(container: Element): boolean {
  const parent = container.parentElement;
  const view = container.ownerDocument.defaultView;
  if (!parent || !view || typeof view.getComputedStyle !== 'function') {
    return false;
  }

  const parentStyles = view.getComputedStyle(parent);
  const containerStyles = view.getComputedStyle(container);
  return (
    isStretchFlexGridItem(parentStyles, containerStyles) &&
    !isLayoutDefiniteAutoHeight(container)
  );
}

function isStretchFlexGridItem(
  parentStyles: CSSStyleDeclaration,
  containerStyles: CSSStyleDeclaration,
): boolean {
  const display = parentStyles.display;
  const isFlex = display === 'flex' || display === 'inline-flex';
  const isGrid = display === 'grid' || display === 'inline-grid';
  if (!isFlex && !isGrid) {
    return false;
  }

  const alignment =
    containerStyles.alignSelf === 'auto'
      ? parentStyles.alignItems
      : containerStyles.alignSelf;
  return alignment === 'stretch' || (isGrid && alignment === 'normal');
}

function hasDefiniteGridRows(styles: CSSStyleDeclaration): boolean {
  const rows = styles.gridTemplateRows.trim();
  return (
    rows !== '' &&
    rows !== 'none' &&
    rows !== 'subgrid' &&
    !/(?:^|\s|\()auto(?:\s|\)|$)/.test(rows) &&
    !/(?:min-content|max-content)/.test(rows)
  );
}

function getUsedBlockSize(element: Element): number {
  const rect = element.getBoundingClientRect();
  return Number.isFinite(rect.height) ? rect.height : 0;
}

function getResolvedCssPixelBlockSize(container: Element): number | null {
  const elementWithStyleMap = container as Element & {
    computedStyleMap?: () => StylePropertyMapReadOnly;
  };
  const hasTypedStyleMap =
    typeof elementWithStyleMap.computedStyleMap === 'function';
  const view = container.ownerDocument.defaultView;
  if (!view || typeof view.getComputedStyle !== 'function') {
    return null;
  }

  if (!hasTypedStyleMap) {
    return parsePixelLength(
      (container as HTMLElement).style.getPropertyValue('height'),
    );
  }

  const styles = view.getComputedStyle(container);
  const typedHeight = elementWithStyleMap.computedStyleMap!().get('height');
  if (isCssKeywordValue(typedHeight) && typedHeight.value === 'auto') {
    return null;
  }
  if (isCssPixelValue(typedHeight)) {
    return typedHeight.value;
  }

  const containingBlock = findConstraintContainingBlock(container, styles);
  if (
    !containingBlock ||
    containingBlock === container ||
    !shouldObserveContainingBlock(containingBlock)
  ) {
    return null;
  }

  return parsePixelLength(styles.height);
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
    !isWrapOff(textarea) ||
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
  if (!isWrapOff(textarea)) {
    return 'hidden';
  }

  if (styles.overflowX === 'scroll') {
    return 'scroll';
  }

  return styles.overflowX === 'auto' ? 'auto' : 'hidden';
}

function isWrapOff(textarea: HTMLTextAreaElement): boolean {
  return (textarea.getAttribute('wrap') ?? '').toLowerCase() === 'off';
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

    return getUsableContentHeightFromCssSize(
      resolvedSize,
      styles,
      padding,
      borders,
      horizontalScrollbarGutter,
    );
  }

  return getUsableContentHeightFromCssSize(
    pixelMaxSize,
    styles,
    padding,
    borders,
    horizontalScrollbarGutter,
  );
}

function getUsableContentHeightFromCssSize(
  cssSize: number,
  styles: CSSStyleDeclaration,
  padding: number,
  borders: number,
  horizontalScrollbarGutter: number,
): number {
  const boxEdges = styles.boxSizing === 'border-box' ? padding + borders : 0;
  return Math.max(0, cssSize - boxEdges - horizontalScrollbarGutter);
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
      'important',
    );
    textarea.style.setProperty(
      'max-block-size',
      sizeProperty === 'block-size'
        ? styles.getPropertyValue('max-block-size')
        : 'none',
      'important',
    );
    textarea.style.setProperty('height', resolutionHeight, 'important');
    textarea.style.setProperty(
      'block-size',
      sizeProperty === 'block-size' ? resolutionHeight : '',
      'important',
    );
    textarea.style.setProperty('overflow-y', 'hidden', 'important');
    const resolvedCssHeight = parsePixelLength(
      getComputedStyle(textarea).height,
    );
    if (resolvedCssHeight !== null) {
      return resolvedCssHeight;
    }
    const physicalHeight = getUntransformedLayoutHeight(textarea, styles);
    if (!Number.isFinite(physicalHeight) || physicalHeight >= 10000000) {
      return null;
    }

    return styles.boxSizing === 'content-box'
      ? Math.max(
          0,
          physicalHeight -
            getVerticalPadding(styles) -
            getVerticalBorders(styles),
        )
      : physicalHeight;
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

  const view = container.ownerDocument.defaultView;
  if (!view || typeof view.getComputedStyle !== 'function') {
    return null;
  }

  const styles = view.getComputedStyle(container);
  const padding = getVerticalPadding(styles);
  const borders = getVerticalBorders(styles);
  const layoutDefiniteAutoHeight = isLayoutDefiniteAutoHeight(container);
  const declaredHeight = isIndefiniteFlexGridItem(container)
    ? null
    : getResolvedCssPixelBlockSize(container);
  const contentBoxHeight =
    declaredHeight !== null
      ? styles.boxSizing === 'border-box'
        ? Math.max(0, declaredHeight - padding - borders)
        : declaredHeight
      : layoutDefiniteAutoHeight
        ? Math.max(0, getUsedBlockSize(container) - padding - borders)
        : null;

  if (contentBoxHeight === null) {
    return null;
  }

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
  'font-kerning',
  'font-size',
  'font-size-adjust',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-weight',
  'font-variation-settings',
  'hyphens',
  'letter-spacing',
  'line-break',
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

const INLINE_MEASUREMENT_PROPERTIES = [
  ...TEXT_METRIC_PROPERTIES,
  'box-sizing',
  'min-height',
  'max-height',
  'max-block-size',
  'overflow-x',
  'width',
] as const;

const PLACEHOLDER_METRIC_PROPERTIES = [
  'direction',
  'font-family',
  'font-feature-settings',
  'font-kerning',
  'font-size',
  'font-size-adjust',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-weight',
  'font-variation-settings',
  'hyphens',
  'letter-spacing',
  'line-break',
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
  'max-height',
  'max-block-size',
  'padding',
]);

function isPointerStateEvent(type: string): boolean {
  return type.startsWith('pointer');
}
