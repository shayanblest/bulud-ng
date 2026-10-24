import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BuludDatepicker } from 'bulud-ng/datepicker';
import { BasePreferences } from '../preferences';
import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludDatepicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    [title]="p.text('انتخاب تاریخ', 'Date picker')"
    [code]="source"
    [description]="
      p.text(
        'تقویم شمسی و میلادی با انتخاب تاریخ یا بازه',
        'Persian and Gregorian calendars with single or range selection'
      )
    "
    [api]="
      p.text(
        'تقویم شمسی و میلادی، انتخاب تاریخ یا بازه، محدودیت تاریخ و اعتبارسنجی الزامی پشتیبانی می‌شوند. با کلیدهای جهت بین روزها حرکت کنید و با Escape تقویم را ببندید.',
        'calendar: persian | gregory; language: fa | en; mode: single | range; min/max ISO dates; required/disabled; Arrow keys navigate; Escape closes.'
      )
    "
    entry="bulud-ng/datepicker"
  >
    <div class="field">
      <span id="single-date-label">{{ p.text('تاریخ', 'Date') }}</span>
      <bulud-datepicker
        aria-labelledby="single-date-label"
        [language]="p.language()"
      />
    </div>
    <div class="field">
      <span id="range-date-label">{{
        p.text('بازهٔ تاریخ', 'Date range')
      }}</span>
      <bulud-datepicker
        aria-labelledby="range-date-label"
        [language]="p.language()"
        mode="range"
      />
    </div>
    <bulud-datepicker
      [aria-label]="p.text('تاریخ غیرفعال', 'Disabled date')"
      [language]="p.language()"
      disabled
    />
  </feature-frame>`,
})
export class PageDatepicker {
  readonly p = inject(BasePreferences);
  readonly source = `import {Component,ChangeDetectionStrategy,input} from '@angular/core';
import {BuludDatepicker} from 'bulud-ng/datepicker';
@Component({selector:'example-date',imports:[BuludDatepicker],changeDetection:ChangeDetectionStrategy.OnPush,template:\`
<bulud-datepicker aria-label="Date" [language]="language()"/>
<bulud-datepicker aria-label="Date range" [language]="language()" mode="range"/>\`})
export class ExampleDate {readonly language=input<'fa'|'en'>('fa');}`;
}
