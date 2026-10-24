import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludDonutChart } from 'bulud-ng/charts';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludDonutChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="donut-chart · نمودار دونات"
    [code]="source"
    description="نمودار دونات · Standalone, Angour light/dark, RTL/LTR"
    api="caption, segments ≤64 with finite nonnegative values, loading, empty/error labels, theme. SVG plus text legend; zero total is empty."
    entry="bulud-ng/charts"
    ><bulud-donut-chart
      caption="Distribution"
      [segments]="segments" /><bulud-donut-chart
      caption="Empty" /><bulud-donut-chart caption="Loading" loading
  /></feature-frame>`,
})
export class PageDonutChart {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludDonutChart} from 'bulud-ng/charts';\n\n@Component({selector:'example-donut-chart',imports:[BuludDonutChart],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-donut-chart caption=\"Distribution\" [segments]=\"segments\"/><bulud-donut-chart caption=\"Empty\"/><bulud-donut-chart caption=\"Loading\" loading/>`})\nexport class Example {readonly segments=[{label:'First',value:45},{label:'Second',value:35},{label:'Third',value:20}];}";
  readonly segments = [
    { label: 'First', value: 45 },
    { label: 'Second', value: 35 },
    { label: 'Third', value: 20 },
  ];
}
