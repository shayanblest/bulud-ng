import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludDialog } from 'bulud-ng/dialog';
import { BuludButton } from 'bulud-ng/button';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludDialog, BuludButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="dialog · دیالوگ"
    [code]="source"
    description="دیالوگ · Standalone, Angour light/dark, RTL/LTR"
    api="open/openChange, closeOnEscape/backdrop policy and geometry tokens. Modal top layer, focus trap and restoration. Provide a dialog accessible name."
    entry="bulud-ng/dialog"
    ><bulud-button (click)="open.set(true)">Open dialog</bulud-button
    ><bulud-dialog
      [open]="open()"
      (openChange)="open.set($event)"
      aria-label="Example dialog"
      ><h3>Example dialog</h3>
      <p>Escape closes, focus returns to trigger.</p>
      <bulud-button (click)="open.set(false)">Close</bulud-button></bulud-dialog
    ></feature-frame
  >`,
})
export class PageDialog {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludDialog} from \'bulud-ng/dialog\';\nimport {BuludButton} from \'bulud-ng/button\';\n\n@Component({selector:\'example-dialog\',imports:[BuludDialog,BuludButton],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-button (click)="open.set(true)">Open dialog</bulud-button><bulud-dialog [open]="open()" (openChange)="open.set($event)" aria-label="Example dialog"><h3>Example dialog</h3><p>Escape closes, focus returns to trigger.</p><bulud-button (click)="open.set(false)">Close</bulud-button></bulud-dialog>`})\nexport class Example {readonly open=signal(false);}';
  readonly open = signal(false);
}
