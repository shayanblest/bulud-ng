import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludTooltip } from 'bulud-ng/tooltip';
import { BuludButton } from 'bulud-ng/button';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludTooltip, BuludButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="tooltip · راهنمای ابزار"
    [code]="source"
    description="راهنمای ابزار · Standalone, Angour light/dark, RTL/LTR"
    api="text required, theme. Project a focusable trigger. Hover/focus opens, Escape closes; noninteractive descriptive content only."
    entry="bulud-ng/tooltip"
    ><bulud-tooltip text="This action saves changes"
      ><bulud-button>Focus or hover</bulud-button></bulud-tooltip
    ></feature-frame
  >`,
})
export class PageTooltip {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludTooltip} from 'bulud-ng/tooltip';\nimport {BuludButton} from 'bulud-ng/button';\n\n@Component({selector:'example-tooltip',imports:[BuludTooltip,BuludButton],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-tooltip text=\"This action saves changes\"><bulud-button>Focus or hover</bulud-button></bulud-tooltip>`})\nexport class Example {}";
}
