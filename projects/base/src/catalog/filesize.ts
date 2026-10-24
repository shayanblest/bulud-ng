import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludFileSizePipe } from 'bulud-ng/filesize';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludFileSizePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="filesize · اندازه فایل"
    [code]="source"
    description="اندازه فایل · Standalone, Angour light/dark, RTL/LTR"
    api="Pure buludFileSize formats bytes for display. File upload validates actual selected File metadata separately."
    entry="bulud-ng/filesize"
    ><p>{{ 1024 | buludFileSize }}</p>
    <p>{{ 1048576 | buludFileSize }}</p></feature-frame
  >`,
})
export class PageFilesize {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludFileSizePipe} from 'bulud-ng/filesize';\n\n@Component({selector:'example-filesize',imports:[BuludFileSizePipe],changeDetection:ChangeDetectionStrategy.OnPush,template:`<p>{{1024|buludFileSize}}</p><p>{{1048576|buludFileSize}}</p>`})\nexport class Example {}";
}
