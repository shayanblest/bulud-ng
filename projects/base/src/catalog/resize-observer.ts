import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludResizeObserver } from 'bulud-ng/resize-observer';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludResizeObserver],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="resize-observer · مشاهده اندازه"
    [code]="source"
    description="مشاهده اندازه · Standalone, Angour light/dark, RTL/LTR"
    api="[buludResizeObserver], enabled, (sizeChange): BuludElementSize; listener cleanup and no change-detection polling."
    entry="bulud-ng/resize-observer"
    ><div
      buludResizeObserver
      (sizeChange)="width.set($event.width)"
      style="resize:horizontal;overflow:auto;max-width:100%;padding:24px;border:1px solid var(--bulud-color-border)"
    >
      Resize me · {{ width() }}px
    </div></feature-frame
  >`,
})
export class PageResizeObserver {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludResizeObserver} from 'bulud-ng/resize-observer';\n\n@Component({selector:'example-resize-observer',imports:[BuludResizeObserver],changeDetection:ChangeDetectionStrategy.OnPush,template:`<div buludResizeObserver (sizeChange)=\"width.set($event.width)\" style=\"resize:horizontal;overflow:auto;max-width:100%;padding:24px;border:1px solid var(--bulud-color-border)\">Resize me · {{width()}}px</div>`})\nexport class Example {readonly width=signal(0);}";
  readonly width = signal(0);
}
