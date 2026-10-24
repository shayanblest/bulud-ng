import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludEmptyState } from 'bulud-ng/empty-state';
import { BuludButton } from 'bulud-ng/button';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludEmptyState, BuludButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="empty-state · حالت خالی"
    [code]="source"
    description="حالت خالی · Standalone, Angour light/dark, RTL/LTR"
    api="title required, description, theme; projected actions and optional decorative buludEmptyIcon. Generic empty/not-found presentation, no forced route."
    entry="bulud-ng/empty-state"
    ><bulud-empty-state
      title="No results / نتیجه‌ای پیدا نشد"
      description="Change filters and try again."
      ><bulud-button (click)="clicked.set(true)"
        >Try again</bulud-button
      ></bulud-empty-state
    >
    @if (clicked()) {
      <p role="status">Retry requested</p>
    }
  </feature-frame>`,
})
export class PageEmptyState {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludEmptyState} from \'bulud-ng/empty-state\';\nimport {BuludButton} from \'bulud-ng/button\';\n\n@Component({selector:\'example-empty-state\',imports:[BuludEmptyState,BuludButton],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-empty-state title="No results / نتیجه‌ای پیدا نشد" description="Change filters and try again."><bulud-button (click)="clicked.set(true)">Try again</bulud-button></bulud-empty-state>@if(clicked()){<p role="status">Retry requested</p>}`})\nexport class Example {readonly clicked=signal(false);}';
  readonly clicked = signal(false);
}
