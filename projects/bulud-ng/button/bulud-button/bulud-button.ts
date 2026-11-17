import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  Renderer2,
  inject,
  input,
} from '@angular/core';
import { BULUD_DEFAULT_LOCALE, BULUD_LOCALE } from 'bulud-ng';

/**
 * Visual treatments supported by {@link BuludButton}.
 */
export type BuludButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * Sizes supported by {@link BuludButton}.
 */
export type BuludButtonSize = 'small' | 'medium' | 'large';

/**
 * Native button types supported by {@link BuludButton}.
 */
export type BuludButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'bulud-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bulud-button-host',
    '[class.bulud-button-host--full-width]': 'fullWidth()',
  },
  templateUrl: './bulud-button.html',
  styleUrl: './bulud-button.css',
})
export class BuludButton {
  private readonly locale = inject(BULUD_LOCALE);
  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const renderer = inject(Renderer2);
    // Static `id="..."` also becomes a host attribute in Angular. Transfer it
    // to the native control, while retaining a distinct [attr.id] wrapper hook.
    effect(() => {
      const id = this.id();
      if (id !== null && host.getAttribute('id') === id) {
        renderer.removeAttribute(host, 'id');
      }
    });
  }

  /** Exact project-owned ID on the native button, updated reactively. */
  readonly id = input<string | null>(null);
  /**
   * Native type applied to the internal button. Defaults to `button` to avoid
   * accidental form submission.
   */
  readonly type = input<BuludButtonType>('button');

  /** Angour outline keeps the variant color on the text and border. */
  readonly appearance = input<'solid' | 'outline' | 'link'>('solid');

  /** Visual color treatment. */
  readonly variant = input<BuludButtonVariant>('primary');

  /** Button size. */
  readonly size = input<BuludButtonSize>('medium');

  /** Prevents interaction with the button. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Displays progress and prevents repeated interaction while an operation is
   * pending.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Makes the button fill the inline size of its container. */
  readonly fullWidth = input(false, { transform: booleanAttribute });

  /**
   * Accessible name forwarded to the native button. Projected text remains the
   * accessible name when this value is omitted.
   */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Assistive text announced when `loading` becomes true. */
  readonly loadingLabel = input<string | undefined>(undefined);

  protected readonly resolvedLoadingLabel = computed(
    () =>
      this.loadingLabel() ??
      this.locale.button?.loadingLabel ??
      BULUD_DEFAULT_LOCALE.button!.loadingLabel,
  );
}
