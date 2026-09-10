import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

/**
 * Visual treatments supported by {@link BuludButton}.
 */
export type BuludButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost';

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
  styleUrl: './bulud-button.scss',
})
export class BuludButton {
  /**
   * Native type applied to the internal button. Defaults to `button` to avoid
   * accidental form submission.
   */
  readonly type = input<BuludButtonType>('button');

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
  readonly loadingLabel = input('Loading');
}
