import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { BuludLoadingService } from 'bulud-ng/loading-bar';
import { BuludButton } from 'bulud-ng/button';

import { DestroyRef } from '@angular/core';
import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="loading-bar · لودینگ صفحه"
    [code]="source"
    description="لودینگ صفحه · Standalone, Angour light/dark, RTL/LTR"
    api="BuludLoadingService start/setProgress/finish handles concurrent tasks. Root already mounts BuludLoadingBar, do not mount a duplicate. No fake timer progress."
    entry="bulud-ng/loading-bar"
    ><div class="toolbar">
      <bulud-button (click)="start()">Start loading</bulud-button
      ><bulud-button (click)="progress()" [disabled]="task() === null"
        >70%</bulud-button
      ><bulud-button (click)="finish()" [disabled]="task() === null"
        >Finish</bulud-button
      >
    </div>
    <p>Progress appears at the top of the page.</p></feature-frame
  >`,
})
export class PageLoadingBar {
  constructor() {
    inject(DestroyRef).onDestroy(() => this.finish());
  }
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludLoadingService} from \'bulud-ng/loading-bar\';\nimport {BuludButton} from \'bulud-ng/button\';\n\n@Component({selector:\'example-loading-bar\',imports:[BuludButton],changeDetection:ChangeDetectionStrategy.OnPush,template:`<div class="toolbar"><bulud-button (click)="start()">Start loading</bulud-button><bulud-button (click)="progress()" [disabled]="task()===null">70%</bulud-button><bulud-button (click)="finish()" [disabled]="task()===null">Finish</bulud-button></div><p>Progress appears at the top of the page.</p>`})\nexport class Example {readonly service=inject(BuludLoadingService);readonly task=signal<number|null>(null);start():void{if(this.task()===null)this.task.set(this.service.start());}progress():void{const id=this.task();if(id!==null)this.service.update(id,70);}finish():void{const id=this.task();if(id!==null){this.service.finish(id);this.task.set(null);}}}';
  readonly service = inject(BuludLoadingService);
  readonly task = signal<number | null>(null);
  start(): void {
    if (this.task() === null) this.task.set(this.service.start());
  }
  progress(): void {
    const id = this.task();
    if (id !== null) this.service.update(id, 70);
  }
  finish(): void {
    const id = this.task();
    if (id !== null) {
      this.service.finish(id);
      this.task.set(null);
    }
  }
}
