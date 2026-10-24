import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludFieldLabel } from 'bulud-ng/field-label';
import { BuludCheckbox } from 'bulud-ng/checkbox';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludFieldLabel, BuludCheckbox, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="field-label · برچسب الزامی خودکار"
    [code]="source"
    description="برچسب الزامی خودکار · Standalone, Angour light/dark, RTL/LTR"
    api="[control]: AbstractControl; [required]?: boolean explicit override for opaque custom validators; auto-detects required, requiredTrue and buludRequiredText; listens to control events, no DOM scanning. Call updateValueAndValidity after validator changes."
    entry="bulud-ng/field-label"
    ><bulud-checkbox [checked]="required()" (checkedChange)="toggle($event)"
      >Required</bulud-checkbox
    ><label buludFieldLabel [control]="control" for="required-example"
      >Name</label
    ><input
      class="bulud-input"
      id="required-example"
      [formControl]="control"
      [required]="required()"
    />
    <p>The star stays visible for a filled required value.</p></feature-frame
  >`,
})
export class PageFieldLabel {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludFieldLabel} from \'bulud-ng/field-label\';\nimport {BuludCheckbox} from \'bulud-ng/checkbox\';\nimport {FormControl,ReactiveFormsModule,Validators} from \'@angular/forms\';\n@Component({selector:\'example-field-label\',imports:[BuludFieldLabel,BuludCheckbox,ReactiveFormsModule],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-checkbox [checked]="required()" (checkedChange)="toggle($event)">Required</bulud-checkbox><label buludFieldLabel [control]="control" for="required-example">Name</label><input class="bulud-input" id="required-example" [formControl]="control" [required]="required()"/><p>The star stays visible for a filled required value.</p>`})\nexport class Example {readonly required=signal(true);readonly control=new FormControl(\'\',Validators.required);toggle(value:boolean):void{this.required.set(value);this.control.setValidators(value?Validators.required:null);this.control.updateValueAndValidity();}}';
  readonly required = signal(true);
  readonly control = new FormControl('', Validators.required);
  toggle(value: boolean): void {
    this.required.set(value);
    this.control.setValidators(value ? Validators.required : null);
    this.control.updateValueAndValidity();
  }
}
