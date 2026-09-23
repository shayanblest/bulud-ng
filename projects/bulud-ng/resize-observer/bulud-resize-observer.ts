import { DOCUMENT } from '@angular/common';
import {
  booleanAttribute,
  Directive,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';

/** Content-box dimensions reported by {@link BuludResizeObserver}. */
export interface BuludElementSize {
  readonly width: number;
  readonly height: number;
}

interface ContentBoxSize {
  readonly inlineSize: number;
  readonly blockSize: number;
}

type ResizeObserverEntryWithContentBoxSize = Omit<
  ResizeObserverEntry,
  'contentBoxSize'
> & {
  readonly contentBoxSize?: ContentBoxSize | readonly ContentBoxSize[];
};

type ResizeObserverConstructor = new (
  callback: ResizeObserverCallback,
) => ResizeObserver;

/**
 * Emits when the host element's content-box dimensions change.
 *
 * The first notification is the browser's initial ResizeObserver delivery
 * after observation starts. Identical consecutive dimensions are suppressed.
 * A reconnect emits only when its first measurement differs from the last
 * emitted measurement, including changes that occurred while disabled.
 */
@Directive({
  selector: '[buludResizeObserver]',
  standalone: true,
})
export class BuludResizeObserver {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private lastSize: BuludElementSize | null = null;
  private destroyed = false;

  /** Enables or disables observation. Defaults to `true`. */
  readonly enabled = input(true, { transform: booleanAttribute });

  /** Emits the host content-box width and height after a real size change. */
  readonly sizeChange = output<BuludElementSize>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.lastSize = null;
    });

    effect((onCleanup) => {
      if (this.destroyed || !this.enabled()) {
        return;
      }

      const ResizeObserver = getResizeObserverConstructor(this.document);
      if (!ResizeObserver) {
        return;
      }

      const host = this.element.nativeElement;
      let active = true;

      const observer = new ResizeObserver((entries) => {
        if (!active || this.destroyed) {
          return;
        }

        for (const entry of entries) {
          if (entry.target !== host) {
            continue;
          }

          const size = readContentBoxSize(entry);
          if (
            this.lastSize?.width === size.width &&
            this.lastSize.height === size.height
          ) {
            continue;
          }

          this.lastSize = size;
          this.sizeChange.emit(size);
        }
      });

      observer.observe(host);
      onCleanup(() => {
        active = false;
        observer.disconnect();
      });
    });
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

function readContentBoxSize(entry: ResizeObserverEntry): BuludElementSize {
  const entryWithSize = entry as ResizeObserverEntryWithContentBoxSize;
  const contentBoxSize = entryWithSize.contentBoxSize;
  const size = Array.isArray(contentBoxSize)
    ? contentBoxSize[0]
    : contentBoxSize;

  if (
    size &&
    Number.isFinite(size.inlineSize) &&
    Number.isFinite(size.blockSize)
  ) {
    return { width: size.inlineSize, height: size.blockSize };
  }

  return {
    width: entry.contentRect.width,
    height: entry.contentRect.height,
  };
}
