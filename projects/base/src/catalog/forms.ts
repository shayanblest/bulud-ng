import { Component, ChangeDetectionStrategy } from '@angular/core';

import { BaseForms } from '../forms';
import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BaseForms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="forms · فرم و اعتبارسنجی"
    [code]="source"
    description="فرم و اعتبارسنجی · Standalone, Angour light/dark, RTL/LTR"
    api="Full reactive-form example: sync/async validation, matching fields, dates, selection limits, reset and submit. Required labels are derived from control validators."
    entry="@angular/forms + bulud-ng/validators"
    ><base-forms
  /></feature-frame>`,
})
export class PageForms {
  readonly source = `import {Component} from '@angular/core';
import {ReactiveFormsModule,FormControl,Validators} from '@angular/forms';
import {BuludFieldLabel} from 'bulud-ng/field-label';
import {BuludButton} from 'bulud-ng/button';
@Component({imports:[ReactiveFormsModule,BuludFieldLabel,BuludButton],
 template:\`<form (submit)="submit($event)">
 <label buludFieldLabel [control]="name" for="name">Name</label>
 <input class="bulud-input" id="name" [formControl]="name" required />
 @if(name.touched && name.invalid){<p role="alert">Name is required.</p>}
 <bulud-button type="submit">Save</bulud-button>
 </form>\`})
export class Example {
 readonly name=new FormControl('',{nonNullable:true,validators:[Validators.required]});
 submit(event:Event):void {event.preventDefault();this.name.markAsTouched();if(this.name.invalid)return; /* Your application action */}
}`;
}
