import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludCountdown } from 'bulud-ng/countdown';
import { BuludButton } from 'bulud-ng/button';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludCountdown, BuludButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="countdown · شمارش معکوس"
    [code]="source"
    description="شمارش معکوس · Standalone, Angour light/dark, RTL/LTR"
    api="deadline Unix milliseconds or null, label, theme and expired output; wall-clock remaining time, single expiration and lifecycle cleanup."
    entry="bulud-ng/countdown"
    ><bulud-button (click)="deadline.set(DateNow() + 5000)"
      >Start 5 seconds</bulud-button
    ><bulud-countdown
      label="Time remaining"
      [deadline]="deadline()"
      (expired)="ended.set(true)"
    />
    @if (ended()) {
      <p role="status">Expired</p>
    }
  </feature-frame>`,
})
export class PageCountdown {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludCountdown} from \'bulud-ng/countdown\';\nimport {BuludButton} from \'bulud-ng/button\';\n\n@Component({selector:\'example-countdown\',imports:[BuludCountdown,BuludButton],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-button (click)="deadline.set(DateNow()+5000)">Start 5 seconds</bulud-button><bulud-countdown label="Time remaining" [deadline]="deadline()" (expired)="ended.set(true)"/>@if(ended()){<p role="status">Expired</p>}`})\nexport class Example {readonly deadline=signal<number|null>(null);readonly ended=signal(false);readonly DateNow=()=>{this.ended.set(false);return Date.now();};}';
  readonly deadline = signal<number | null>(null);
  readonly ended = signal(false);
  readonly DateNow = () => {
    this.ended.set(false);
    return Date.now();
  };
}
