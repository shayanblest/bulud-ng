import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludAccordion, BuludAccordionItem } from 'bulud-ng/accordion';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludAccordion, BuludAccordionItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="accordion · آکاردئون"
    [code]="source"
    description="آکاردئون · Standalone, Angour light/dark, RTL/LTR"
    api="multiple, collapsible, [(expanded)]; projected trigger/panel. Native buttons with aria-expanded, keyboard activation."
    entry="bulud-ng/accordion"
    ><bulud-accordion multiple
      ><section buludAccordionItem="one">
        <span buludAccordionTrigger>First item</span>
        <p buludAccordionPanel>Expandable content</p>
      </section>
      <section buludAccordionItem="two">
        <span buludAccordionTrigger>Second item</span>
        <p buludAccordionPanel>Another panel</p>
      </section></bulud-accordion
    ></feature-frame
  >`,
})
export class PageAccordion {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludAccordion,BuludAccordionItem} from 'bulud-ng/accordion';\n\n@Component({selector:'example-accordion',imports:[BuludAccordion,BuludAccordionItem],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-accordion multiple><section buludAccordionItem=\"one\"><span buludAccordionTrigger>First item</span><p buludAccordionPanel>Expandable content</p></section><section buludAccordionItem=\"two\"><span buludAccordionTrigger>Second item</span><p buludAccordionPanel>Another panel</p></section></bulud-accordion>`})\nexport class Example {}";
}
