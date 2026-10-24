import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludTextareaAutosize } from 'bulud-ng/textarea-autosize';
import { BuludTextarea } from 'bulud-ng/textarea';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludTextareaAutosize, BuludTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="textarea-autosize · متن با ارتفاع خودکار"
    [code]="source"
    description="متن با ارتفاع خودکار · Standalone, Angour light/dark, RTL/LTR"
    api="textarea[buludTextareaAutosize], enabled, minRows/maxRows and typed config; respects wrapping, container resize and lifecycle cleanup."
    entry="bulud-ng/textarea-autosize"
    ><label for="catalog-autosize">Message</label
    ><textarea
      id="catalog-autosize"
      buludTextarea
      buludTextareaAutosize
      [minRows]="2"
      [maxRows]="6"
      placeholder="Write multiple lines"
    ></textarea>
  </feature-frame>`,
})
export class PageTextareaAutosize {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludTextareaAutosize} from \'bulud-ng/textarea-autosize\';\nimport {BuludTextarea} from \'bulud-ng/textarea\';\n\n@Component({selector:\'example-textarea-autosize\',imports:[BuludTextareaAutosize,BuludTextarea],changeDetection:ChangeDetectionStrategy.OnPush,template:`<label for="catalog-autosize">Message</label><textarea id="catalog-autosize" buludTextarea buludTextareaAutosize [minRows]="2" [maxRows]="6" placeholder="Write multiple lines"></textarea>`})\nexport class Example {}';
}
