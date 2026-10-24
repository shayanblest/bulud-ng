import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludClickOutside } from 'bulud-ng/clickoutside';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludClickOutside],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="clickoutside · کلیک بیرون"
    [code]="source"
    description="کلیک بیرون · Standalone, Angour light/dark, RTL/LTR"
    api="[buludClickOutside], enabled, triggers pointerdown/focusin; (outside) is typed and duplicate pointer/focus notification is suppressed."
    entry="bulud-ng/clickoutside"
    ><div
      buludClickOutside
      (outside)="count.set(count() + 1)"
      style="padding:24px;background:var(--bulud-body-bg)"
    >
      Inside area
    </div>
    <button type="button">Outside target</button>
    <p>Outside notifications: {{ count() }}</p></feature-frame
  >`,
})
export class PageClickoutside {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludClickOutside} from \'bulud-ng/clickoutside\';\n\n@Component({selector:\'example-clickoutside\',imports:[BuludClickOutside],changeDetection:ChangeDetectionStrategy.OnPush,template:`<div buludClickOutside (outside)="count.set(count()+1)" style="padding:24px;background:var(--bulud-body-bg)">Inside area</div><button type="button">Outside target</button><p>Outside notifications: {{count()}}</p>`})\nexport class Example {readonly count=signal(0);}';
  readonly count = signal(0);
}
