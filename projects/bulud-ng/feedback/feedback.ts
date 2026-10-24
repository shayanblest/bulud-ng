import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  viewChild,
  inject,
  Injectable,
  input,
  output,
  signal,
} from '@angular/core';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
export type BuludNoticeKind =
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'light'
  | 'dark';
export interface BuludNotice {
  readonly id: number;
  readonly message: string;
  readonly kind: BuludNoticeKind;
}
@Injectable({ providedIn: 'root' })
export class BuludNotificationService {
  private nextId = 0;
  private readonly state = signal<readonly BuludNotice[]>([]);
  readonly notices = this.state.asReadonly();
  show(message: string, kind: BuludNoticeKind = 'info'): number {
    const id = ++this.nextId;
    this.state.update((items) => [...items, { id, message, kind }]);
    return id;
  }
  dismiss(id: number): void {
    this.state.update((items) => items.filter((item) => item.id !== id));
  }
  clear(): void {
    this.state.set([]);
  }
}
@Component({
  selector: 'bulud-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './feedback.scss',
  host: { '[style]': 'styles()' },
  template: `<div
    class="surface notice"
    [attr.data-kind]="kind()"
    [attr.role]="announce() ? (kind() === 'danger' ? 'alert' : 'status') : null"
  >
    @if (showIcon()) {
      <svg
        class="notice-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="9" />
        @switch (kind()) {
          @case ('success') {
            <path d="m7 12 3 3 7-7" />
          }
          @case ('danger') {
            <path d="m8 8 8 8m0-8-8 8" />
          }
          @case ('warning') {
            <path d="M12 7v6m0 3v1" />
          }
          @default {
            <path d="M12 11v6m0-10v1" />
          }
        }
      </svg>
    }
    <div class="notice-body">
      @if (title()) {
        <strong>{{ title() }}</strong>
      }
      <div><ng-content /></div>
      <div class="notice-actions">
        <ng-content select="[buludAlertActions]" />
      </div>
    </div>
    @if (dismissible()) {
      <button
        type="button"
        (click)="dismissed.emit()"
        [attr.aria-label]="dismissLabel()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m6 6 12 12M6 18 18 6" />
        </svg>
      </button>
    }
  </div>`,
})
export class BuludAlert {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly kind = input<BuludNoticeKind>('info');
  readonly title = input('');
  readonly showIcon = input(true, { transform: booleanAttribute });
  readonly announce = input(true, { transform: booleanAttribute });
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissLabel = input('Dismiss');
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  readonly dismissed = output<void>();
  protected readonly styles = computed(() =>
    buludSharedUiStyles('feedback', this.config, this.theme()),
  );
}
/** Place one outlet per provided notification store. Notifications persist until explicitly dismissed. */
@Component({
  selector: 'bulud-notifications',
  imports: [BuludAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
    #outlet
    role="group"
    [attr.aria-label]="label()"
    tabindex="-1"
    aria-live="polite"
    aria-relevant="additions text"
  >
    @for (notice of service.notices(); track notice.id) {
      <bulud-alert
        [kind]="notice.kind"
        [announce]="false"
        [attr.data-notice-id]="notice.id"
        [theme]="theme()"
        [dismissible]="true"
        [dismissLabel]="dismissLabel()"
        (dismissed)="dismiss(notice.id)"
        >{{ notice.message }}</bulud-alert
      >
    }
  </div>`,
})
export class BuludNotifications {
  private readonly outlet = viewChild<ElementRef<HTMLElement>>('outlet');
  readonly label = input('Notifications');
  protected dismiss(id: number): void {
    const outlet = this.outlet()?.nativeElement;
    const notice = outlet?.querySelector(`[data-notice-id="${id}"]`);
    const hadFocus = !!notice?.contains(
      outlet?.ownerDocument.activeElement ?? null,
    );
    this.service.dismiss(id);
    if (hadFocus) outlet?.focus();
  }
  protected readonly service = inject(BuludNotificationService);
  readonly dismissLabel = input('Dismiss');
  readonly theme = input<Partial<BuludSharedUiTheme>>();
}
