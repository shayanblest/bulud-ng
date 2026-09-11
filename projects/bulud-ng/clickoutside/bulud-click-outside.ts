import {
  booleanAttribute,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type BuludClickOutsideTrigger = 'pointerdown' | 'focusin';

export interface BuludClickOutsideEvent {
  readonly trigger: BuludClickOutsideTrigger;
}

const DEFAULT_TRIGGERS: readonly BuludClickOutsideTrigger[] = [
  'pointerdown',
  'focusin',
];

/** Emits when pointer or focus interaction moves outside the host element. */
@Directive({
  selector: '[buludClickOutside]',
  standalone: true,
})
export class BuludClickOutside {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private lastPointerDownTarget: EventTarget | null = null;

  /** Enables or disables outside detection. Defaults to `true`. */
  readonly enabled = input(true, { transform: booleanAttribute });

  /** Selects the document events that trigger outside notifications. */
  readonly triggers =
    input<readonly BuludClickOutsideTrigger[]>(DEFAULT_TRIGGERS);

  /** Emits a typed notification after interaction occurs outside the host. */
  readonly outside = output<BuludClickOutsideEvent>();

  constructor() {
    effect((onCleanup) => {
      if (!isPlatformBrowser(this.platformId) || !this.enabled()) {
        return;
      }

      const document = this.element.nativeElement.ownerDocument;
      const triggers = [...new Set(this.triggers())];
      const listeners = triggers.map((trigger) => {
        const listener = (event: Event): void => {
          const target = event.target;
          if (
            !(target instanceof Node) ||
            this.element.nativeElement.contains(target)
          ) {
            return;
          }

          if (trigger === 'pointerdown') {
            this.lastPointerDownTarget = target;
          } else {
            const followsPointerDown = this.lastPointerDownTarget === target;
            this.lastPointerDownTarget = null;
            if (followsPointerDown) {
              return;
            }
          }

          this.outside.emit({ trigger });
        };

        document.addEventListener(trigger, listener);
        return { trigger, listener };
      });

      onCleanup(() => {
        this.lastPointerDownTarget = null;
        for (const { trigger, listener } of listeners) {
          document.removeEventListener(trigger, listener);
        }
      });
    });
  }
}
