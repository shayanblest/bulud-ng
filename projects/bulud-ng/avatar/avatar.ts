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
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      overflow: hidden;
      flex: none;
      vertical-align: middle;
      inline-size: var(--bulud-avatar-size, 48px);
      block-size: var(--bulud-avatar-size, 48px);
      border-radius: var(--bulud-avatar-radius, 50%);
      background: var(--bulud-avatar-background, var(--bulud-color-primary));
      color: var(--bulud-avatar-foreground, var(--bulud-color-on-primary));
      font-weight: 600;
    }
    img {
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
    }
    span {
      font: inherit;
    }
  `,
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
