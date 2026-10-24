import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludCarousel, BuludSlide } from 'bulud-ng/carousel';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludCarousel, BuludSlide],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="carousel · اسلایدر"
    [code]="source"
    description="اسلایدر · Standalone, Angour light/dark, RTL/LTR"
    api="label, [(active)], disabled, previousLabel/nextLabel, theme; projected slides. No autoplay or interval; native controls and announced index."
    entry="bulud-ng/carousel"
    ><bulud-carousel label="Slides"
      ><ng-template buludSlide="First"><h3>First slide</h3></ng-template
      ><ng-template buludSlide="Second"
        ><h3>Second slide</h3></ng-template
      ></bulud-carousel
    ></feature-frame
  >`,
})
export class PageCarousel {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludCarousel,BuludSlide} from \'bulud-ng/carousel\';\n\n@Component({selector:\'example-carousel\',imports:[BuludCarousel,BuludSlide],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-carousel label="Slides"><ng-template buludSlide="First"><h3>First slide</h3></ng-template><ng-template buludSlide="Second"><h3>Second slide</h3></ng-template></bulud-carousel>`})\nexport class Example {}';
}
