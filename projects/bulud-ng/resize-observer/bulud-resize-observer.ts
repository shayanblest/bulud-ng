import {
  booleanAttribute,
  Directive,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Content-box dimensions reported by {@link BuludResizeObserver}. */
export interface BuludElementSize {
  readonly width: number;
  readonly height: number;
}

/**
 * Emits when the host element's content-box dimensions change.
 *
 * The browser delivers the initial dimensions asynchronously through
 * ResizeObserver. Repeated identical dimensions are suppressed.
 */
@Directive({
  selector: '[buludResizeObserver]',
  standalone: true,
})
export class BuludResizeObserver {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private lastSize: BuludElementSize | null = null;

  /** Enables or disables observation. Defaults to `true`. */
  readonly enabled = input(true, { transform: booleanAttribute });

  /** Emits the host content-box width and height after a real size change. */
  readonly sizeChange = output<BuludElementSize>();

  constructor() {
    effect((onCleanup) => {
      if (!isPlatformBrowser(this.platformId) || !this.enabled()) {
        return;
      }

      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      let observing = true;

      const observer = new ResizeObserver((entries) => {
        if (!observing || this.destroyRef.destroyed) {
          return;
        }

        const entry = entries[0];
        if (!entry) {
          return;
        }

        const size = {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        };

        if (
          this.lastSize?.width === size.width &&
          this.lastSize.height === size.height
        ) {
          return;
        }

        this.lastSize = size;
        this.sizeChange.emit(size);
      });

      observer.observe(this.element.nativeElement);
      onCleanup(() => {
        observing = false;
        observer.disconnect();
      });
    });
  }
}
