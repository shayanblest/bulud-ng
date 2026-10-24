import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludRadio, BuludRadioGroup } from 'bulud-ng/radio';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludRadio, BuludRadioGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="radio · رادیو"
    [code]="source"
    description="رادیو · Standalone, Angour light/dark, RTL/LTR"
    api="Group [(value)], required, disabled; item value and disabled. Native arrow/Space keyboard behavior, inherited group label."
    entry="bulud-ng/radio"
    ><bulud-radio-group aria-label="Plan" [(value)]="value"
      ><bulud-radio value="basic">Basic</bulud-radio
      ><bulud-radio value="pro">Pro</bulud-radio
      ><bulud-radio value="enterprise" disabled
        >Disabled</bulud-radio
      ></bulud-radio-group
    >
    <p>Plan: {{ value() }}</p></feature-frame
  >`,
})
export class PageRadio {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludRadio,BuludRadioGroup} from \'bulud-ng/radio\';\n\n@Component({selector:\'example-radio\',imports:[BuludRadio,BuludRadioGroup],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-radio-group aria-label="Plan" [(value)]="value"><bulud-radio value="basic">Basic</bulud-radio><bulud-radio value="pro">Pro</bulud-radio><bulud-radio value="enterprise" disabled>Disabled</bulud-radio></bulud-radio-group><p>Plan: {{value()}}</p>`})\nexport class Example {readonly value=signal<string|null>(null);}';
  readonly value = signal<string | null>(null);
}
