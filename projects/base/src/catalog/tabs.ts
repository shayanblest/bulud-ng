import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludTabs, BuludTab, BuludTabPanel } from 'bulud-ng/tabs';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludTabs, BuludTab, BuludTabPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="tabs · تب‌ها"
    [code]="source"
    description="تب‌ها · Standalone, Angour light/dark, RTL/LTR"
    api="[(activeId)], orientation, activationMode; project native buludTab buttons and matching buludTabPanel. Arrow/Home/End navigation, inactive panels are hidden."
    entry="bulud-ng/tabs"
    ><bulud-tabs aria-label="Sections"
      ><button buludTab="first">First</button
      ><button buludTab="second">Second</button
      ><button buludTab="disabled" disabled>Disabled</button>
      <div buludTabPanel="first">First content</div>
      <div buludTabPanel="second">Second content</div></bulud-tabs
    ></feature-frame
  >`,
})
export class PageTabs {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludTabs,BuludTab,BuludTabPanel} from \'bulud-ng/tabs\';\n\n@Component({selector:\'example-tabs\',imports:[BuludTabs,BuludTab,BuludTabPanel],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-tabs aria-label="Sections"><button buludTab="first">First</button><button buludTab="second">Second</button><button buludTab="disabled" disabled>Disabled</button><div buludTabPanel="first">First content</div><div buludTabPanel="second">Second content</div></bulud-tabs>`})\nexport class Example {}';
}
