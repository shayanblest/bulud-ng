import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludOtp } from 'bulud-ng/otp';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludOtp, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="otp · کد یک‌بارمصرف"
    [code]="source"
    description="کد یک‌بارمصرف · Standalone, Angour light/dark, RTL/LTR"
    api="label required; length=6, numeric input/paste normalization, required/disabled; CVA/Validator. Single accessible input supports autofill."
    entry="bulud-ng/otp"
    ><bulud-otp label="Verification code" required [formControl]="control" />
    <p>Code: {{ control.value }} · Invalid: {{ control.invalid }}</p>
    <bulud-otp label="Disabled code" disabled
  /></feature-frame>`,
})
export class PageOtp {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludOtp} from 'bulud-ng/otp';\nimport {FormControl,ReactiveFormsModule} from '@angular/forms';\n@Component({selector:'example-otp',imports:[BuludOtp,ReactiveFormsModule],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-otp label=\"Verification code\" required [formControl]=\"control\"/><p>Code: {{control.value}} · Invalid: {{control.invalid}}</p><bulud-otp label=\"Disabled code\" disabled/>`})\nexport class Example {readonly control=new FormControl('',{nonNullable:true});}";
  readonly control = new FormControl('', { nonNullable: true });
}
