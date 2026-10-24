import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludChart } from 'bulud-ng/charts';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="line-chart · نمودار خطی"
    [code]="source"
    description="نمودار خطی · Standalone, Angour light/dark, RTL/LTR"
    api="Dependency-free SVG chart; type line/candlestick, points and labels, loading/empty/invalid/disabled states; accessible text data table. Times must be strictly increasing, OHLC finite and consistent."
    entry="bulud-ng/charts"
    ><bulud-chart caption="Example line chart" type="line" [line]="data"
  /></feature-frame>`,
})
export class PageLineChart {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludChart} from 'bulud-ng/charts';\n\n@Component({selector:'example-line-chart',imports:[BuludChart],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-chart caption=\"Example line chart\" type=\"line\" [line]=\"data\"/>`})\nexport class Example {readonly data=[{x:'Jan',y:10},{x:'Feb',y:16},{x:'Mar',y:12}];}";
  readonly data = [
    { x: 'Jan', y: 10 },
    { x: 'Feb', y: 16 },
    { x: 'Mar', y: 12 },
  ];
}
