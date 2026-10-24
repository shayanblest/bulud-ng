import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludCheckbox } from 'bulud-ng/checkbox';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="checkbox · چک‌باکس"
    [code]="source"
    description="چک‌باکس · Standalone, Angour light/dark, RTL/LTR"
    api="[(checked)], indeterminate, required, disabled, invalid, id and ARIA inputs. Reactive Forms/CVA supported; label is projected."
    entry="bulud-ng/checkbox"
    ><bulud-checkbox [(checked)]="checked">Accept terms</bulud-checkbox
    ><bulud-checkbox [indeterminate]="true">Mixed state</bulud-checkbox
    ><bulud-checkbox disabled>Disabled</bulud-checkbox>
    <p>Checked: {{ checked() }}</p></feature-frame
  >`,
})
export class PageCheckbox {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludCheckbox} from 'bulud-ng/checkbox';\n\n@Component({selector:'example-checkbox',imports:[BuludCheckbox],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-checkbox [(checked)]=\"checked\">Accept terms</bulud-checkbox><bulud-checkbox [indeterminate]=\"true\">Mixed state</bulud-checkbox><bulud-checkbox disabled>Disabled</bulud-checkbox><p>Checked: {{checked()}}</p>`})\nexport class Example {readonly checked=signal(false);}";
  readonly checked = signal(false);
}
