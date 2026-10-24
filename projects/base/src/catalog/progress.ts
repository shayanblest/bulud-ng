import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludProgress } from 'bulud-ng/charts';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludProgress],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="progress · پیشرفت خطی و حلقه‌ای"
    [code]="source"
    description="پیشرفت خطی و حلقه‌ای · Standalone, Angour light/dark, RTL/LTR"
    api="label, value, max=100, variant bar|ring, loading, theme; finite values in [0,max]. Loading omits aria-valuenow; invalid values show status."
    entry="bulud-ng/charts"
    ><label for="catalog-progress">Value</label
    ><input
      id="catalog-progress"
      type="range"
      min="0"
      max="100"
      [value]="value()"
      (input)="setValue($event)" /><bulud-progress
      label="Progress"
      [value]="value()" /><bulud-progress
      label="Ring progress"
      variant="ring"
      [value]="value()" /><bulud-progress label="Loading" loading
  /></feature-frame>`,
})
export class PageProgress {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludProgress} from \'bulud-ng/charts\';\n\n@Component({selector:\'example-progress\',imports:[BuludProgress],changeDetection:ChangeDetectionStrategy.OnPush,template:`<label for="catalog-progress">Value</label><input id="catalog-progress" type="range" min="0" max="100" [value]="value()" (input)="setValue($event)"/><bulud-progress label="Progress" [value]="value()"/><bulud-progress label="Ring progress" variant="ring" [value]="value()"/><bulud-progress label="Loading" loading/>`})\nexport class Example {readonly value=signal(65);setValue(e:Event):void{this.value.set((e.target as HTMLInputElement).valueAsNumber);}}';
  readonly value = signal(65);
  setValue(e: Event): void {
    this.value.set((e.target as HTMLInputElement).valueAsNumber);
  }
}
