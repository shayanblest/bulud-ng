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

      this.resize();
      this.connectWidthObserver();
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
    const lineHeight = getLineHeight(styles);
    const minRows = normalizeRows(this.minRows());
    const maxRows = normalizeRows(this.maxRows());
    const effectiveMaxRows =
      maxRows === null ? null : Math.max(maxRows, minRows ?? 0);
    const boxSizing = styles.boxSizing;
    textarea.style.overflowY = 'hidden';
    textarea.style.height = '0px';
    const contentHeight = Math.max(0, textarea.scrollHeight - padding);
    const minHeight = minRows === null ? 0 : minRows * lineHeight;
    const maxHeight =
      effectiveMaxRows === null
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
    const nextHeight = `${Math.ceil(targetHeight)}px`;
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
  }

  private disconnectWidthObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.lastObservedWidth = null;
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

function parsePixels(value: string): number {
  const pixels = Number.parseFloat(value);
  return Number.isFinite(pixels) ? pixels : 0;
}

function getLineHeight(styles: CSSStyleDeclaration): number {
  const lineHeight = parsePixels(styles.lineHeight);
  if (lineHeight > 0) {
    return lineHeight;
  }

  const fontSize = parsePixels(styles.fontSize);
  return fontSize > 0 ? fontSize * 1.2 : 16 * 1.2;
}

function normalizeRows(value: number | null): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  const rows = Math.floor(value);
  return rows >= 1 ? rows : null;
}
