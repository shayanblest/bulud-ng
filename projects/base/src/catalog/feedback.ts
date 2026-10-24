import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  BuludAlert,
  BuludNotifications,
  BuludNotificationService,
} from 'bulud-ng/feedback';
import { BuludButton } from 'bulud-ng/button';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludAlert, BuludNotifications, BuludButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="feedback · پیام و اعلان"
    [code]="source"
    description="پیام و اعلان · Standalone, Angour light/dark, RTL/LTR"
    api="BuludAlert kind, announce, dismissible/dismissed, theme. BuludNotificationService holds app-local safe text notices; mount a single outlet per app/page."
    entry="bulud-ng/feedback"
    ><bulud-alert kind="info" dismissible>Informational message</bulud-alert
    ><bulud-alert kind="success">Saved successfully</bulud-alert
    ><bulud-alert kind="danger">Example error</bulud-alert
    ><bulud-button (click)="notify()">Show notification</bulud-button
    ><bulud-notifications
  /></feature-frame>`,
})
export class PageFeedback {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludAlert,BuludNotifications,BuludNotificationService} from 'bulud-ng/feedback';\nimport {BuludButton} from 'bulud-ng/button';\n\n@Component({selector:'example-feedback',imports:[BuludAlert,BuludNotifications,BuludButton],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-alert kind=\"info\" dismissible>Informational message</bulud-alert><bulud-alert kind=\"success\">Saved successfully</bulud-alert><bulud-alert kind=\"danger\">Example error</bulud-alert><bulud-button (click)=\"notify()\">Show notification</bulud-button><bulud-notifications/>`})\nexport class Example {readonly notices=inject(BuludNotificationService);notify():void{this.notices.show('Example notification','success');}}";
  readonly notices = inject(BuludNotificationService);
  notify(): void {
    this.notices.show('Example notification', 'success');
  }
}
