import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BuludButton } from 'bulud-ng/button';
import { BuludSwitch } from 'bulud-ng/switch';
import { BasePreferences } from './preferences';
@Component({
  selector: 'base-toolbar',
  imports: [BuludButton, BuludSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <bulud-button
        variant="ghost"
        [aria-label]="
          p.text('Toggle language: English', 'Toggle language: فارسی')
        "
        (click)="p.language.set(p.language() === 'fa' ? 'en' : 'fa')"
        >{{ p.text('English', 'فارسی') }}</bulud-button
      ><bulud-switch
        appearance="theme"
        [attr.title]="
          p.text('تغییر حالت روشن و تاریک', 'Switch light/dark mode')
        "
        aria-label="Toggle theme"
        [checked]="p.dark()"
        (checkedChange)="p.dark.set($event)"
      />
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 180px;
      min-block-size: 44px;
    }
  `,
})
export class BaseToolbar {
  readonly p = inject(BasePreferences);
}
