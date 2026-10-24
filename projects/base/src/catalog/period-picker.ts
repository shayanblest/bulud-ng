import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludPeriodPicker } from 'bulud-ng/period-picker';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludPeriodPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="period-picker · انتخاب ماه و سال"
    [code]="source"
    description="انتخاب ماه و سال · Standalone, Angour light/dark, RTL/LTR"
    api="Calendar-qualified value {calendar,year,month?}; mode month | year; min/max ISO dates; required/disabled/invalid; buludPeriodRange converts to inclusive ISO boundaries. CVA supported."
    entry="bulud-ng/period-picker"
    ><div class="form-grid">
      <bulud-period-picker
        label="Month / ماه"
        language="fa"
        required
      /><bulud-period-picker label="Year / سال" mode="year" /></div
  ></feature-frame>`,
})
export class PagePeriodPicker {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludPeriodPicker} from \'bulud-ng/period-picker\';\n\n@Component({selector:\'example-period-picker\',imports:[BuludPeriodPicker],changeDetection:ChangeDetectionStrategy.OnPush,template:`<div class="form-grid"><bulud-period-picker label="Month / ماه" language="fa" required/><bulud-period-picker label="Year / سال" mode="year"/></div>`})\nexport class Example {}';
}
