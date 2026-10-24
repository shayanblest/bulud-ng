import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludRating } from 'bulud-ng/rating';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludRating, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="rating · امتیازدهی"
    [code]="source"
    description="امتیازدهی · Standalone, Angour light/dark, RTL/LTR"
    api="label, required/disabled/invalid, theme; CVA integer values 0–5. Native radio arrow/Space behavior; selected stars inherit primary color."
    entry="bulud-ng/rating"
    ><bulud-rating label="Rating" required [formControl]="control" />
    <p>Value: {{ control.value }}</p>
    <bulud-rating label="Disabled rating" disabled
  /></feature-frame>`,
})
export class PageRating {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludRating} from 'bulud-ng/rating';\nimport {FormControl,ReactiveFormsModule} from '@angular/forms';\n@Component({selector:'example-rating',imports:[BuludRating,ReactiveFormsModule],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-rating label=\"Rating\" required [formControl]=\"control\"/><p>Value: {{control.value}}</p><bulud-rating label=\"Disabled rating\" disabled/>`})\nexport class Example {readonly control=new FormControl(3,{nonNullable:true});}";
  readonly control = new FormControl(3, { nonNullable: true });
}
