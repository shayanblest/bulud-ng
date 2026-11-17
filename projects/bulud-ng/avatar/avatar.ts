import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
@Component({
  selector: 'bulud-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()||name()||"Avatar"',
    '[style]': 'styles()',
  },
  template: `@if (src() && failed() !== src()) {
      <img [src]="src()" alt="" (error)="failed.set(src())" />
    } @else {
      <span aria-hidden="true">{{ initials() }}</span>
    }
    <ng-content />`,
  styleUrl: './avatar.css',
})
export class BuludAvatar {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly name = input('');
  readonly src = input<string>();
  readonly label = input<string>();
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly failed = signal<string | undefined>(undefined);
  protected readonly initials = computed(
    () =>
      this.name()
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => Array.from(s)[0] ?? '')
        .join('')
        .toLocaleUpperCase() || '?',
  );
  protected readonly styles = computed(() =>
    buludSharedUiStyles('avatar', this.config, this.theme()),
  );
}
