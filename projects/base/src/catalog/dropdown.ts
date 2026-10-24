import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludDropdown } from 'bulud-ng/dropdown';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludDropdown],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="dropdown · فهرست انتخاب"
    [code]="source"
    description="فهرست انتخاب · Standalone, Angour light/dark, RTL/LTR"
    api="options, [(value)], multiple, searchable, clearable, required, disabled and selection limits; keyboard navigation, Escape and focus restoration. Use immutable options."
    entry="bulud-ng/dropdown"
    ><label for="catalog-choice">Framework</label
    ><bulud-dropdown
      id="catalog-choice"
      aria-label="Framework"
      [options]="options"
      [(value)]="value" />
    <p>Selected: {{ value() }}</p>
    <bulud-dropdown aria-label="Disabled dropdown" [options]="options" disabled
  /></feature-frame>`,
})
export class PageDropdown {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludDropdown} from \'bulud-ng/dropdown\';\n\n@Component({selector:\'example-dropdown\',imports:[BuludDropdown],changeDetection:ChangeDetectionStrategy.OnPush,template:`<label for="catalog-choice">Framework</label><bulud-dropdown id="catalog-choice" aria-label="Framework" [options]="options" [(value)]="value"/><p>Selected: {{value()}}</p><bulud-dropdown aria-label="Disabled dropdown" [options]="options" disabled/>`})\nexport class Example {readonly options=[\'Angular\',\'React\',\'Vue\'];readonly value=signal<string|readonly string[]|null>(null);}';
  readonly options = ['Angular', 'React', 'Vue'];
  readonly value = signal<string | readonly string[] | null>(null);
}
