import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { BuludDialog } from 'bulud-ng/dialog';
import { BuludButton } from 'bulud-ng/button';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
export type BuludConfirmKind = 'creation' | 'confirmation' | 'rejection';
/** Controlled confirmation. The consumer closes after confirmed or after its async action succeeds. */
@Component({
  selector: 'bulud-confirm',
  imports: [BuludDialog, BuludButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style]': 'styles()' },
  template: `<bulud-dialog
    [open]="open()"
    [aria-label]="title()"
    [closeOnEscape]="!processing()"
    [closeOnBackdrop]="false"
    (openChange)="onDialogChange($event)"
  >
    <section [attr.data-kind]="kind()">
      <svg
        class="icon"
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="24" cy="24" r="20" />
        @switch (kind()) {
          @case ('creation') {
            <path d="m14 24 7 7 14-15" />
          }
          @case ('rejection') {
            <path d="m17 17 14 14m0-14L17 31" />
          }
          @default {
            <path d="M18 17a6 6 0 1 1 9 5c-3 2-3 3-3 6m0 5v1" />
          }
        }
      </svg>
      <h2>{{ title() }}</h2>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <ng-content />
      <div class="actions">
        <bulud-button
          variant="secondary"
          [disabled]="processing()"
          (click)="cancel()"
          >{{ cancelLabel() }}</bulud-button
        ><bulud-button
          [variant]="kind() === 'rejection' ? 'danger' : 'primary'"
          [loading]="processing()"
          [loadingLabel]="processingLabel()"
          (click)="confirm()"
          >{{ confirmLabel() }}</bulud-button
        >
      </div>
    </section></bulud-dialog
  >`,
  styleUrl: './confirm.scss',
})
export class BuludConfirm {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly open = input(false, { transform: booleanAttribute });
  readonly openChange = output<boolean>();
  readonly title = input.required<string>();
  readonly message = input('');
  readonly kind = input<BuludConfirmKind>('confirmation');
  readonly processing = input(false, { transform: booleanAttribute });
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly processingLabel = input('Processing…');
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  protected readonly styles = computed(() =>
    buludSharedUiStyles('confirm', this.config, this.theme()),
  );
  protected onDialogChange(open: boolean): void {
    if (!open) this.cancel();
  }
  protected confirm(): void {
    if (this.open() && !this.processing()) this.confirmed.emit();
  }
  protected cancel(): void {
    if (!this.open() || this.processing()) return;
    this.cancelled.emit();
    this.openChange.emit(false);
  }
}
