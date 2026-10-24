import { Component, ChangeDetectionStrategy } from '@angular/core';
import { buludHttpUrl } from 'bulud-ng/validators';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="validators · اعتبارسنجی‌های عمومی"
    [code]="source"
    description="اعتبارسنجی‌های عمومی · Standalone, Angour light/dark, RTL/LTR"
    api="buludRequiredText, buludFiniteNumber, buludHttpUrl, buludIsoDate, buludMatchFields. Combine optional rules with Validators.required. Server validation is consumer-owned."
    entry="bulud-ng/validators"
    ><label for="catalog-validation">Website</label
    ><input
      class="bulud-input"
      id="catalog-validation"
      [formControl]="control"
    />
    <p role="status">
      {{ control.invalid ? 'Invalid HTTP(S) URL' : 'Valid URL or empty' }}
    </p></feature-frame
  >`,
})
export class PageValidators {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {buludHttpUrl} from 'bulud-ng/validators';\nimport {FormControl,ReactiveFormsModule} from '@angular/forms';\n@Component({selector:'example-validators',imports:[ReactiveFormsModule],changeDetection:ChangeDetectionStrategy.OnPush,template:`<label for=\"catalog-validation\">Website</label><input class=\"bulud-input\" id=\"catalog-validation\" [formControl]=\"control\"/><p role=\"status\">{{control.invalid?'Invalid HTTP(S) URL':'Valid URL or empty'}}</p>`})\nexport class Example {readonly control=new FormControl('',buludHttpUrl);}";
  readonly control = new FormControl('', buludHttpUrl);
}
