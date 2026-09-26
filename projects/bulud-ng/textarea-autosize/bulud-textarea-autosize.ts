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

interface OriginalStyles {
  readonly height: string;
  readonly overflowY: string;
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
  private observer: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private measurementProbe: HTMLTextAreaElement | null = null;
  private measurementHost: HTMLDivElement | null = null;
  private measurementRoot: ShadowRoot | null = null;
  private lastMeasurementSignature: string | null = null;
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

      this.createMeasurementProbe();
      this.resize();
      this.connectWidthObserver();
      this.connectMutationObserver();
      const textarea = this.element.nativeElement;
      const inputListener = (): void => {
        if (textarea.value !== this.lastValue) {
          this.resize();
        }
      };
      textarea.addEventListener('input', inputListener);
      onCleanup(() => {
        textarea.removeEventListener('input', inputListener);
        this.disconnectWidthObserver();
        this.disconnectMutationObserver();
        this.restoreOriginalStyles();
      });
    });
  }

  ngAfterViewInit(): void {
    const textarea = this.element.nativeElement;
    this.originalStyles = {
      height: textarea.style.height,
      overflowY: textarea.style.overflowY,
    };
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
      this.resize();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.disconnectWidthObserver();
    this.disconnectMutationObserver();
    this.restoreOriginalStyles();
  }

  private resize(): void {
    if (this.destroyed || !this.hasBrowserView()) {
      return;
    }

    const textarea = this.element.nativeElement;
    const view = this.document.defaultView;
    const getComputedStyle = view?.getComputedStyle;
    if (typeof getComputedStyle !== 'function') {
      return;
    }

    textarea.style.overflowY = 'hidden';
    textarea.style.height = '0px';
    const styles = getComputedStyle.call(view, textarea);
    this.lastMeasurementSignature = getMeasurementSignature(textarea, styles);
    const padding = getVerticalPadding(styles);
    const borders = getVerticalBorders(styles);
    const lineHeight = getLineHeight(textarea, styles, this.measurementRoot);
    const minRows = this.normalizedMinRows();
    const maxRows = this.normalizedMaxRows();
    const effectiveMaxRows =
      maxRows === null ? null : Math.max(maxRows, minRows ?? 0);
    const boxSizing = styles.boxSizing;
    this.syncMeasurementProbe();
    const contentHeight = this.measureContentHeight(textarea, padding);
    const minHeight =
      minRows === null || lineHeight === null ? 0 : minRows * lineHeight;
    const maxHeight =
      effectiveMaxRows === null || lineHeight === null
        ? Number.POSITIVE_INFINITY
        : effectiveMaxRows * lineHeight;
    const targetContentHeight = Math.min(
      maxHeight,
      Math.max(minHeight, contentHeight),
    );
    const targetHeight =
      boxSizing === 'border-box'
        ? targetContentHeight + padding + borders
        : targetContentHeight;
    const nextHeight = `${targetHeight}px`;
    const shouldScroll = contentHeight > maxHeight;

    if (textarea.style.height !== nextHeight) {
      textarea.style.height = nextHeight;
    }
    const nextOverflowY = shouldScroll ? 'auto' : 'hidden';
    if (textarea.style.overflowY !== nextOverflowY) {
      textarea.style.overflowY = nextOverflowY;
    }

    this.lastValue = textarea.value;
  }

  private measureContentHeight(
    textarea: HTMLTextAreaElement,
    padding: number,
  ): number {
    const probe = this.measurementProbe;
    if (probe) {
      const probeStyles = getComputedStyle(probe);
      const probePadding =
        parsePixels(probeStyles.paddingTop) +
        parsePixels(probeStyles.paddingBottom);
      const intrinsicHeight = probe.scrollHeight - probePadding;
      if (Number.isFinite(intrinsicHeight) && intrinsicHeight > 0) {
        return intrinsicHeight;
      }
    }

    return Math.max(0, textarea.scrollHeight - padding);
  }

  private createMeasurementProbe(): void {
    if (this.measurementProbe || this.destroyed || !this.hasBrowserView()) {
      return;
    }

    const textarea = this.element.nativeElement;
    const body = textarea.ownerDocument.body;
    if (!body || typeof body.attachShadow !== 'function') {
      return;
    }

    const host = textarea.ownerDocument.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.position = 'fixed';
    host.style.inset = '0 auto auto -100000px';
    host.style.width = '0px';
    host.style.height = '0px';
    host.style.overflow = 'visible';
    host.style.visibility = 'hidden';
    host.style.pointerEvents = 'none';
    const root = host.attachShadow({ mode: 'open' });
    body.appendChild(host);

    const probe = textarea.cloneNode(false) as HTMLTextAreaElement;
    probe.removeAttribute('id');
    probe.removeAttribute('name');
    probe.removeAttribute('form');
    probe.setAttribute('aria-hidden', 'true');
    probe.tabIndex = -1;
    probe.rows = 1;
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.inset = '-9999px auto auto -9999px';
    probe.style.height = 'auto';
    probe.style.minHeight = '0px';
    probe.style.maxHeight = 'none';
    probe.style.overflow = 'hidden';
    root.appendChild(probe);
    this.measurementHost = host;
    this.measurementRoot = root;
    this.measurementProbe = probe;
    this.syncMeasurementProbe();
  }

  private syncMeasurementProbe(): void {
    const probe = this.measurementProbe;
    if (!probe) {
      return;
    }

    const textarea = this.element.nativeElement;
    probe.value = textarea.value;
    const wrap = textarea.getAttribute('wrap');
    if (wrap === null) {
      probe.removeAttribute('wrap');
    } else {
      probe.setAttribute('wrap', wrap);
    }
    const view = this.document.defaultView;
    if (view && typeof view.getComputedStyle === 'function') {
      const styles = view.getComputedStyle(textarea);
      copyMeasurementStyles(probe, styles);
      probe.style.width = `${getContentBoxWidth(textarea, styles)}px`;
    }
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

      let shouldResize = false;
      for (const entry of entries) {
        if (entry.target === this.measurementProbe) {
          shouldResize = true;
          continue;
        }

        if (entry.target !== textarea) {
          continue;
        }

        const width = entry.contentRect.width;
        if (!Number.isFinite(width) || width === this.lastObservedWidth) {
          continue;
        }

        this.lastObservedWidth = width;
        shouldResize = true;
      }

      if (shouldResize) {
        this.resize();
      }
    });
    this.observer.observe(textarea);
    if (this.measurementProbe) {
      this.observer.observe(this.measurementProbe);
    }
  }

  private connectMutationObserver(): void {
    if (this.mutationObserver || this.destroyed || !this.hasBrowserView()) {
      return;
    }

    const MutationObserver = getMutationObserverConstructor(this.document);
    if (!MutationObserver) {
      return;
    }

    this.mutationObserver = new MutationObserver(() => {
      if (!this.destroyed && this.enabled()) {
        const view = this.document.defaultView;
        const styles = view?.getComputedStyle(this.element.nativeElement);
        const signature = styles
          ? getMeasurementSignature(this.element.nativeElement, styles)
          : this.lastMeasurementSignature;
        this.syncMeasurementProbe();
        if (signature !== this.lastMeasurementSignature) {
          this.resize();
        }
      }
    });
    this.mutationObserver.observe(this.element.nativeElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'wrap'],
    });
  }

  private disconnectWidthObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.lastObservedWidth = null;
    this.disconnectMeasurementProbe();
  }

  private disconnectMutationObserver(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
  }

  private disconnectMeasurementProbe(): void {
    this.measurementProbe?.remove();
    this.measurementHost?.remove();
    this.measurementHost = null;
    this.measurementRoot = null;
    this.measurementProbe = null;
    this.lastMeasurementSignature = null;
  }

  private restoreOriginalStyles(): void {
    if (!this.originalStyles) {
      return;
    }

    const textarea = this.element.nativeElement;
    textarea.style.height = this.originalStyles.height;
    textarea.style.overflowY = this.originalStyles.overflowY;
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

function parsePixels(value: string): number {
  const pixels = Number.parseFloat(value);
  return Number.isFinite(pixels) ? pixels : 0;
}

function getLineHeight(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
  measurementRoot: ShadowRoot | null,
): number | null {
  const lineHeight = parsePixels(styles.lineHeight);
  if (lineHeight > 0) {
    return lineHeight;
  }

  return measureSingleRowHeight(textarea, styles, measurementRoot);
}

function measureSingleRowHeight(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
  measurementRoot: ShadowRoot | null,
): number | null {
  const view = textarea.ownerDocument.defaultView;
  if (
    !view ||
    !measurementRoot ||
    typeof view.getComputedStyle !== 'function'
  ) {
    return null;
  }

  const probe = textarea.cloneNode(false) as HTMLTextAreaElement;
  probe.value = 'x';
  probe.rows = 1;
  probe.setAttribute('aria-hidden', 'true');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.inset = '-9999px auto auto -9999px';
  probe.style.height = 'auto';
  probe.style.minHeight = '0px';
  probe.style.maxHeight = 'none';
  probe.style.overflow = 'hidden';
  copyMeasurementStyles(probe, styles);
  probe.style.width = `${getContentBoxWidth(textarea, styles)}px`;

  measurementRoot.appendChild(probe);
  try {
    const styles = view.getComputedStyle(probe);
    const padding = getVerticalPadding(styles);
    const borders = getVerticalBorders(styles);
    const preciseHeight =
      probe.getBoundingClientRect().height - padding - borders;
    const height =
      preciseHeight > 0 ? preciseHeight : probe.scrollHeight - padding;
    return Number.isFinite(height) && height > 0 ? height : null;
  } finally {
    probe.remove();
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

function copyMeasurementStyles(
  probe: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
): void {
  for (const property of TEXT_METRIC_PROPERTIES) {
    probe.style.setProperty(property, styles.getPropertyValue(property));
  }
  probe.style.boxSizing = 'content-box';
}

function getMeasurementSignature(
  textarea: HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
): string {
  return [
    ...TEXT_METRIC_PROPERTIES.map((property) =>
      styles.getPropertyValue(property),
    ),
    `box-sizing:${styles.boxSizing}`,
    `wrap:${textarea.getAttribute('wrap') ?? ''}`,
  ].join('|');
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
