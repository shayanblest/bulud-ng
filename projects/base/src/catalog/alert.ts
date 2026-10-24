import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { BuludAlert, BuludNoticeKind } from 'bulud-ng/feedback';
import { BuludButton } from 'bulud-ng/button';
import { BasePreferences } from '../preferences';
import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludAlert, BuludButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    [title]="p.text('انواع آلرت', 'Alert variants')"
    [description]="
      p.text(
        'پیام‌های عمومی با رنگ و طراحی انگور',
        'General messages with Angour semantic colors'
      )
    "
    [code]="source"
    entry="bulud-ng/feedback"
    api="BuludAlert: kind, title, showIcon, announce, dismissible, dismissLabel, theme; dismissed output. Project content and optional [buludAlertActions]. No HTML string injection."
  >
    @for (item of kinds; track item.kind) {
      <bulud-alert
        [kind]="item.kind"
        [title]="p.text(item.fa, item.en)"
        [announce]="false"
        >{{
          p.text(
            'این یک پیام نمونه برای نمایش وضعیت است.',
            'This is an example status message.'
          )
        }}</bulud-alert
      >
    }
    @if (visible()) {
      <bulud-alert
        kind="info"
        [title]="p.text('پیام قابل بستن', 'Dismissible message')"
        dismissible
        [dismissLabel]="p.text('بستن پیام', 'Dismiss message')"
        (dismissed)="visible.set(false)"
        >{{
          p.text(
            'این پیام را می‌توانید با کیبورد یا ماوس ببندید.',
            'Dismiss this message using the keyboard or pointer.'
          )
        }}</bulud-alert
      >
    }
    <bulud-button variant="ghost" (click)="visible.set(true)">{{
      p.text('نمایش دوباره', 'Show again')
    }}</bulud-button>
  </feature-frame>`,
})
export class PageAlert {
  readonly p = inject(BasePreferences);
  readonly visible = signal(true);
  readonly kinds: readonly { kind: BuludNoticeKind; fa: string; en: string }[] =
    [
      { kind: 'info', fa: 'اطلاع‌رسانی', en: 'Information' },
      { kind: 'success', fa: 'موفقیت', en: 'Success' },
      { kind: 'warning', fa: 'هشدار', en: 'Warning' },
      { kind: 'danger', fa: 'خطا', en: 'Error' },
      { kind: 'primary', fa: 'اصلی', en: 'Primary' },
      { kind: 'secondary', fa: 'ثانویه', en: 'Secondary' },
      { kind: 'neutral', fa: 'خنثی', en: 'Neutral' },
      { kind: 'light', fa: 'روشن', en: 'Light' },
      { kind: 'dark', fa: 'تیره', en: 'Dark' },
    ];
  readonly source = `import {Component,signal} from '@angular/core';
import {BuludAlert} from 'bulud-ng/feedback';
@Component({imports:[BuludAlert],template:\`@if(visible()){<bulud-alert kind="success" title="Saved" dismissible dismissLabel="Dismiss message" (dismissed)="visible.set(false)">Changes saved successfully.</bulud-alert>}\`})
export class Example {readonly visible=signal(true);}`;
}
