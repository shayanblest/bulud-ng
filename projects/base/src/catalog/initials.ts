import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludInitialsPipe } from 'bulud-ng/initials';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludInitialsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="initials · حروف اول نام"
    [code]="source"
    description="حروف اول نام · Standalone, Angour light/dark, RTL/LTR"
    api="Pure buludInitials transforms display names. Use avatar for an accessible image/initials component."
    entry="bulud-ng/initials"
    ><p>{{ 'Example User' | buludInitials }}</p>
    <p>{{ 'کاربر نمونه' | buludInitials }}</p></feature-frame
  >`,
})
export class PageInitials {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludInitialsPipe} from 'bulud-ng/initials';\n\n@Component({selector:'example-initials',imports:[BuludInitialsPipe],changeDetection:ChangeDetectionStrategy.OnPush,template:`<p>{{'Example User'|buludInitials}}</p><p>{{'کاربر نمونه'|buludInitials}}</p>`})\nexport class Example {}";
}
