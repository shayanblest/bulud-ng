import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludSwitch } from 'bulud-ng/switch';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="switch · سوییچ"
    [code]="source"
    description="سوییچ · Standalone, Angour light/dark, RTL/LTR"
    api="[checked] and (checkedChange), required, disabled, invalid; CVA supported. Space toggles the native switch; provide projected label or aria-label. appearance: default | theme; checked means dark in theme appearance."
    entry="bulud-ng/switch"
    ><bulud-switch [checked]="checked()" (checkedChange)="checked.set($event)"
      >Notifications</bulud-switch
    ><bulud-switch disabled>Disabled</bulud-switch>
    <p>Enabled: {{ checked() }}</p>
    <bulud-switch
      appearance="theme"
      aria-label="Theme switch example"
      [checked]="themeChecked()"
      (checkedChange)="themeChecked.set($event)"
  /></feature-frame>`,
})
export class PageSwitch {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludSwitch} from \'bulud-ng/switch\';\n\n@Component({selector:\'example-switch\',imports:[BuludSwitch],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-switch [checked]="checked()" (checkedChange)="checked.set($event)">Notifications</bulud-switch><bulud-switch disabled>Disabled</bulud-switch><p>Enabled: {{checked()}}</p><bulud-switch appearance="theme" aria-label="Theme switch example" [checked]="themeChecked()" (checkedChange)="themeChecked.set($event)"/>`})\nexport class Example {readonly checked=signal(false);readonly themeChecked=signal(false);}';
  readonly themeChecked = signal(false);
  readonly checked = signal(false);
}
