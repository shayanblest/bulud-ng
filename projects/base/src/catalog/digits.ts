import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  BuludPersianDigitsPipe,
  BuludEnglishDigitsPipe,
} from 'bulud-ng/digits';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludPersianDigitsPipe, BuludEnglishDigitsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="digits · ارقام فارسی و لاتین"
    [code]="source"
    description="ارقام فارسی و لاتین · Standalone, Angour light/dark, RTL/LTR"
    api="Pure buludPersianDigits and buludEnglishDigits; formatting only, does not mutate form values."
    entry="bulud-ng/digits"
    ><p>{{ 1234567890 | buludPersianDigits }}</p>
    <p>{{ '۱۲۳۴۵۶۷۸۹۰' | buludEnglishDigits }}</p></feature-frame
  >`,
})
export class PageDigits {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludPersianDigitsPipe,BuludEnglishDigitsPipe} from 'bulud-ng/digits';\n\n@Component({selector:'example-digits',imports:[BuludPersianDigitsPipe,BuludEnglishDigitsPipe],changeDetection:ChangeDetectionStrategy.OnPush,template:`<p>{{1234567890|buludPersianDigits}}</p><p>{{'۱۲۳۴۵۶۷۸۹۰'|buludEnglishDigits}}</p>`})\nexport class Example {}";
}
