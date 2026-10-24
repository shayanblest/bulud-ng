import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { BULUD_DEFAULT_LOCALE, BULUD_LOCALE } from 'bulud-ng';

export type BuludBadgeVariant =
  'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export type BuludBadgeSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'bulud-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bulud-badge-host',
    '[class.bulud-badge-host--dot]': 'dot()',
    '[class.bulud-badge-host--dismissible]': 'dismissible()',
  },
  templateUrl: './bulud-badge.html',
  styleUrl: './bulud-badge.scss',
})
export class BuludBadge {
  private readonly locale = inject(BULUD_LOCALE);
  readonly variant = input<BuludBadgeVariant>('neutral');
  readonly size = input<BuludBadgeSize>('medium');
  readonly dot = input(false, { transform: booleanAttribute });
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissLabel = input<string | undefined>(undefined);
  /** Emits once per activation; consumers own removal and subsequent focus. */
  readonly dismissed = output<void>();

  protected readonly accessibleDismissLabel = computed(
    () =>
      this.dismissLabel()?.trim() ||
      this.locale.badge?.dismissLabel ||
      BULUD_DEFAULT_LOCALE.badge!.dismissLabel,
  );

  protected dismiss(event: Event): void {
    event.stopPropagation();
    this.dismissed.emit();
  }
}
