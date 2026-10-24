import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludStepper, BuludStep } from 'bulud-ng/stepper';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludStepper, BuludStep],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="stepper · مراحل"
    [code]="source"
    description="مراحل · Standalone, Angour light/dark, RTL/LTR"
    api="label, [(active)], disabled, theme. ng-template[buludStep] has label/disabled; consumer owns completion validation and navigation rules."
    entry="bulud-ng/stepper"
    ><bulud-stepper label="Workflow"
      ><ng-template buludStep="Information">First step</ng-template
      ><ng-template buludStep="Review">Review details</ng-template
      ><ng-template buludStep="Disabled" disabled
        >Unavailable</ng-template
      ></bulud-stepper
    ></feature-frame
  >`,
})
export class PageStepper {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludStepper,BuludStep} from \'bulud-ng/stepper\';\n\n@Component({selector:\'example-stepper\',imports:[BuludStepper,BuludStep],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-stepper label="Workflow"><ng-template buludStep="Information">First step</ng-template><ng-template buludStep="Review">Review details</ng-template><ng-template buludStep="Disabled" disabled>Unavailable</ng-template></bulud-stepper>`})\nexport class Example {}';
}
