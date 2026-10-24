import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludButton } from 'bulud-ng/button';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="button · دکمه"
    [code]="source"
    description="دکمه · Standalone, Angour light/dark, RTL/LTR"
    api="variant: primary | secondary | danger | ghost; size: small | medium | large; type: button | submit | reset; disabled, loading, fullWidth. Use a descriptive accessible label for icon-only actions."
    entry="bulud-ng/button"
    ><div class="toolbar">
      <bulud-button>Primary</bulud-button
      ><bulud-button variant="secondary">Secondary</bulud-button
      ><bulud-button variant="danger">Danger</bulud-button
      ><bulud-button variant="ghost">Ghost</bulud-button>
    </div>
    <div class="toolbar">
      <bulud-button size="small">Small</bulud-button
      ><bulud-button size="large">Large</bulud-button
      ><bulud-button disabled>Disabled</bulud-button
      ><bulud-button loading>Loading</bulud-button>
    </div></feature-frame
  >`,
})
export class PageButton {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludButton} from \'bulud-ng/button\';\n\n@Component({selector:\'example-button\',imports:[BuludButton],changeDetection:ChangeDetectionStrategy.OnPush,template:`<div class="toolbar"><bulud-button>Primary</bulud-button><bulud-button variant="secondary">Secondary</bulud-button><bulud-button variant="danger">Danger</bulud-button><bulud-button variant="ghost">Ghost</bulud-button></div><div class="toolbar"><bulud-button size="small">Small</bulud-button><bulud-button size="large">Large</bulud-button><bulud-button disabled>Disabled</bulud-button><bulud-button loading>Loading</bulud-button></div>`})\nexport class Example {}';
}
