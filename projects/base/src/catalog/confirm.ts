import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { BuludConfirm, BuludConfirmKind } from 'bulud-ng/confirm';
import { BuludButton } from 'bulud-ng/button';
import { BuludSwitch } from 'bulud-ng/switch';
import { BasePreferences } from '../preferences';
import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludConfirm, BuludButton, BuludSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    [title]="p.text('پیام تأیید', 'Confirmation')"
    [description]="
      p.text(
        'ایجاد، تأیید و رد با طراحی انگور',
        'Creation, confirmation and rejection with Angour design'
      )
    "
    [code]="source"
    entry="bulud-ng/confirm"
    api="open/openChange, title, message, kind, processing, labels, theme; confirmed/cancelled outputs. Consumer closes after confirmed or async completion. Busy blocks repeated actions and Escape."
  >
    <div class="toolbar">
      @for (item of kinds; track item) {
        <bulud-button
          [variant]="item === 'rejection' ? 'danger' : 'primary'"
          (click)="show(item)"
          >{{ caption(item) }}</bulud-button
        >
      }
    </div>
    <bulud-switch
      [checked]="processing()"
      (checkedChange)="processing.set($event)"
      >{{ p.text('حالت در حال پردازش', 'Processing state') }}</bulud-switch
    >
    <p role="status">{{ result() }}</p>
    <bulud-confirm
      [open]="open()"
      (openChange)="open.set($event)"
      [kind]="kind()"
      [title]="caption(kind())"
      [message]="
        p.text(
          'آیا از انجام این کار مطمئن هستید؟',
          'Are you sure you want to continue?'
        )
      "
      [confirmLabel]="p.text('تأیید', 'Confirm')"
      [cancelLabel]="p.text('انصراف', 'Cancel')"
      [processingLabel]="p.text('در حال پردازش…', 'Processing…')"
      [processing]="processing()"
      (confirmed)="finish()"
      (cancelled)="result.set(p.text('لغو شد', 'Cancelled'))"
    >
      @if (processing()) {
        <bulud-button variant="ghost" (click)="processing.set(false)">{{
          p.text('پایان پردازش نمونه', 'Finish demo processing')
        }}</bulud-button>
      }
    </bulud-confirm>
  </feature-frame>`,
})
export class PageConfirm {
  readonly p = inject(BasePreferences);
  readonly open = signal(false);
  readonly kind = signal<BuludConfirmKind>('confirmation');
  readonly processing = signal(false);
  readonly result = signal('');
  readonly kinds = ['creation', 'confirmation', 'rejection'] as const;
  caption(kind: BuludConfirmKind): string {
    return kind === 'creation'
      ? this.p.text('ایجاد', 'Create')
      : kind === 'rejection'
        ? this.p.text('رد درخواست', 'Reject')
        : this.p.text('تأیید عملیات', 'Confirm action');
  }
  show(kind: BuludConfirmKind): void {
    this.kind.set(kind);
    this.open.set(true);
  }
  finish(): void {
    this.result.set(this.p.text('تأیید شد', 'Confirmed'));
    this.open.set(false);
  }
  readonly source = `import {Component,signal} from '@angular/core';
import {BuludConfirm} from 'bulud-ng/confirm';
import {BuludButton} from 'bulud-ng/button';
@Component({imports:[BuludConfirm,BuludButton],template:\`<bulud-button (click)="open.set(true)">Open</bulud-button><bulud-confirm [open]="open()" (openChange)="open.set($event)" title="Confirm action" message="Continue?" (confirmed)="open.set(false)"/>\`})
export class Example {readonly open=signal(false);}`;
}
