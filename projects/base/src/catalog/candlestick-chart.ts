import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludChart } from 'bulud-ng/charts';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="candlestick-chart · نمودار کندلی"
    [code]="source"
    description="نمودار کندلی · Standalone, Angour light/dark, RTL/LTR"
    api="Dependency-free SVG chart; type line/candlestick, points and labels, loading/empty/invalid/disabled states; accessible text data table. Times must be strictly increasing, OHLC finite and consistent."
    entry="bulud-ng/charts"
    ><bulud-chart
      caption="Example candlestick chart"
      type="candlestick"
      [candles]="data"
  /></feature-frame>`,
})
export class PageCandlestickChart {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludChart} from 'bulud-ng/charts';\n\n@Component({selector:'example-candlestick-chart',imports:[BuludChart],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-chart caption=\"Example candlestick chart\" type=\"candlestick\" [candles]=\"data\"/>`})\nexport class Example {readonly data=[{x:'Jan',open:10,high:16,low:9,close:14},{x:'Feb',open:14,high:18,low:11,close:12},{x:'Mar',open:12,high:17,low:10,close:16}];}";
  readonly data = [
    { x: 'Jan', open: 10, high: 16, low: 9, close: 14 },
    { x: 'Feb', open: 14, high: 18, low: 11, close: 12 },
    { x: 'Mar', open: 12, high: 17, low: 10, close: 16 },
  ];
}
