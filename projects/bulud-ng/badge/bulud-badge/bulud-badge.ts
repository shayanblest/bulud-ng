import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

export type BuludBadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';

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
  readonly variant = input<BuludBadgeVariant>('neutral');
  readonly size = input<BuludBadgeSize>('medium');
  readonly dot = input(false, { transform: booleanAttribute });
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissLabel = input('Remove badge');
  readonly dismissed = output<void>();

  protected dismiss(event: Event): void {
    event.stopPropagation();
    this.dismissed.emit();
  }
}
