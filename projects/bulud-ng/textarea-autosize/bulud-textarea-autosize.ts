import { DOCUMENT } from '@angular/common';
import {
  booleanAttribute,
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
  private destroyed = false;
  private readonly viewInitialized = signal(false);

  /** Enables autosizing. Defaults to `true`. */
  readonly enabled = input(true, { transform: booleanAttribute });

  /** Minimum number of text rows. Invalid or non-positive values are ignored. */
  readonly minRows = input<number | null>(null);

  /** Maximum number of text rows. Invalid or non-positive values are ignored. */
  readonly maxRows = input<number | null>(null);

  constructor() {
    effect((onCleanup) => {
      const enabled = this.enabled();
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

    const styles = getComputedStyle.call(view, textarea);
    const padding =
      parsePixels(styles.paddingTop) + parsePixels(styles.paddingBottom);
    const borders =
      parsePixels(styles.borderTopWidth) +
      parsePixels(styles.borderBottomWidth);
    const lineHeight = getLineHeight(textarea, styles);
    const minRows = normalizeRows(this.minRows());
    const maxRows = normalizeRows(this.maxRows());
    const effectiveMaxRows =
      maxRows === null ? null : Math.max(maxRows, minRows ?? 0);
    const boxSizing = styles.boxSizing;
    this.syncMeasurementProbe();
    textarea.style.overflowY = 'hidden';
    textarea.style.height = '0px';
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
    const parent = textarea.parentElement;
    if (!parent) {
      return;
    }

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
    probe.style.boxSizing = 'border-box';
    parent.appendChild(probe);
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
    const view = this.document.defaultView;
    if (view && typeof view.getComputedStyle === 'function') {
      const styles = view.getComputedStyle(textarea);
      for (const property of TEXT_METRIC_PROPERTIES) {
        probe.style.setProperty(property, styles.getPropertyValue(property));
      }
    }
    const width =
      textarea.clientWidth || textarea.getBoundingClientRect().width;
    if (width > 0) {
      probe.style.width = `${width}px`;
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
    this.lastObservedWidth = textarea.getBoundingClientRect().width;
    this.observer = new ResizeObserver((entries) => {
      if (this.destroyed || !this.enabled()) {
        return;
      }

      for (const entry of entries) {
        if (entry.target === this.measurementProbe) {
          this.resize();
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
        this.syncMeasurementProbe();
      }
    });
    this.mutationObserver.observe(this.element.nativeElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
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
    this.measurementProbe = null;
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
  const document = textarea.ownerDocument;
  const view = document.defaultView;
  const body = document.body;
  if (!view || !body || typeof view.getComputedStyle !== 'function') {
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
  for (const property of [
    'font-family',
    'font-size',
    'font-stretch',
    'font-style',
    'font-variant',
    'font-weight',
    'letter-spacing',
    'line-height',
    'word-spacing',
    'white-space',
  ]) {
    probe.style.setProperty(property, styles.getPropertyValue(property));
  }
  const width = textarea.getBoundingClientRect().width;
  if (width > 0) {
    probe.style.width = `${width}px`;
  }

  body.appendChild(probe);
  try {
    const styles = view.getComputedStyle(probe);
    const padding =
      parsePixels(styles.paddingTop) + parsePixels(styles.paddingBottom);
    const borders =
      parsePixels(styles.borderTopWidth) +
      parsePixels(styles.borderBottomWidth);
    const preciseHeight =
      probe.getBoundingClientRect().height - padding - borders;
    const height =
      preciseHeight > 0 ? preciseHeight : probe.scrollHeight - padding;
    return Number.isFinite(height) && height > 0 ? height : null;
  } finally {
    probe.remove();
  }
}

function normalizeRows(value: number | null): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  const rows = Math.floor(value);
  return rows >= 1 ? rows : null;
}

const TEXT_METRIC_PROPERTIES = [
  'box-sizing',
  'font-family',
  'font-size',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-weight',
  'letter-spacing',
  'line-height',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'white-space',
  'word-spacing',
] as const;
