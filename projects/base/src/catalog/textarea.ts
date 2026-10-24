import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludTextarea } from 'bulud-ng/textarea';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="textarea · متن چندخطی"
    [code]="source"
    description="متن چندخطی · Standalone, Angour light/dark, RTL/LTR"
    api="Native textarea[buludTextarea] styling. Use native maxlength/required and Angular form validators. Theme is inherited; accessible label is consumer-owned."
    entry="bulud-ng/textarea"
    ><label for="catalog-textarea">Message</label
    ><textarea
      id="catalog-textarea"
      buludTextarea
      rows="4"
      maxlength="200"
      placeholder="Write a message"
    ></textarea
    ><textarea buludTextarea disabled aria-label="Disabled textarea">
Disabled</textarea>
  </feature-frame>`,
})
export class PageTextarea {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludTextarea} from \'bulud-ng/textarea\';\n\n@Component({selector:\'example-textarea\',imports:[BuludTextarea],changeDetection:ChangeDetectionStrategy.OnPush,template:`<label for="catalog-textarea">Message</label><textarea id="catalog-textarea" buludTextarea rows="4" maxlength="200" placeholder="Write a message"></textarea><textarea buludTextarea disabled aria-label="Disabled textarea">Disabled</textarea>`})\nexport class Example {}';
}
