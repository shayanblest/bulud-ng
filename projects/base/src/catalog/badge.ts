import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludBadge } from 'bulud-ng/badge';
import { BuludButton } from 'bulud-ng/button';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludBadge, BuludButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="badge · نشان"
    [code]="source"
    description="نشان · Standalone, Angour light/dark, RTL/LTR"
    api="variant: neutral | primary | success | warning | danger; size: small | medium | large; dot, dismissible, dismissLabel; (dismissed). Badge is informational, not a button; only dismissal is interactive."
    entry="bulud-ng/badge"
    ><div class="toolbar">
      @for (kind of variants; track kind) {
        <bulud-badge [variant]="kind" [dot]="true">{{ kind }}</bulud-badge>
      }
    </div>
    <div class="toolbar">
      <bulud-badge size="small">Small</bulud-badge
      ><bulud-badge size="large">Large</bulud-badge>
      @if (visible()) {
        <bulud-badge
          variant="primary"
          dismissible
          (dismissed)="visible.set(false)"
          >Dismissible</bulud-badge
        >
      }
      <bulud-button variant="ghost" (click)="visible.set(true)"
        >Reset badge</bulud-button
      >
    </div></feature-frame
  >`,
})
export class PageBadge {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludBadge} from \'bulud-ng/badge\';\nimport {BuludButton} from \'bulud-ng/button\';\n\n@Component({selector:\'example-badge\',imports:[BuludBadge,BuludButton],changeDetection:ChangeDetectionStrategy.OnPush,template:`<div class="toolbar">@for(kind of variants;track kind){<bulud-badge [variant]="kind" [dot]="true">{{kind}}</bulud-badge>}</div><div class="toolbar"><bulud-badge size="small">Small</bulud-badge><bulud-badge size="large">Large</bulud-badge>@if(visible()){<bulud-badge variant="primary" dismissible (dismissed)="visible.set(false)">Dismissible</bulud-badge>}<bulud-button variant="ghost" (click)="visible.set(true)">Reset badge</bulud-button></div>`})\nexport class Example {readonly variants=[\'neutral\',\'primary\',\'success\',\'warning\',\'danger\'] as const;readonly visible=signal(true);}';
  readonly variants = [
    'neutral',
    'primary',
    'success',
    'warning',
    'danger',
  ] as const;
  readonly visible = signal(true);
}
