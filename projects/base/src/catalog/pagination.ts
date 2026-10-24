import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BuludPagination } from 'bulud-ng/pagination';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludPagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="pagination · صفحه‌بندی"
    [code]="source"
    description="صفحه‌بندی · Standalone, Angour light/dark, RTL/LTR"
    api="Controlled [currentPage]/(pageChange), pageCount, disabled and localized labels; >5 pages show ellipses; bounded rendering for safe integer counts. Centered and responsive."
    entry="bulud-ng/pagination"
    ><label for="catalog-pages">Total pages</label
    ><input
      class="bulud-input"
      id="catalog-pages"
      type="number"
      min="1"
      max="9007199254740991"
      step="1"
      [value]="count()"
      (change)="setCount($event)" /><bulud-pagination
      [pageCount]="count()"
      [currentPage]="page()"
      (pageChange)="page.set($event)"
  /></feature-frame>`,
})
export class PagePagination {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludPagination} from \'bulud-ng/pagination\';\n\n@Component({selector:\'example-pagination\',imports:[BuludPagination],changeDetection:ChangeDetectionStrategy.OnPush,template:`<label for="catalog-pages">Total pages</label><input class="bulud-input" id="catalog-pages" type="number" min="1" max="9007199254740991" step="1" [value]="count()" (change)="setCount($event)"/><bulud-pagination [pageCount]="count()" [currentPage]="page()" (pageChange)="page.set($event)"/>`})\nexport class Example {readonly page=signal(1);readonly count=signal(40);setCount(event:Event):void{const input=event.target as HTMLInputElement;const n=input.valueAsNumber;this.count.set(Number.isSafeInteger(n)&&n>0?n:1);input.value=String(this.count());this.page.set(Math.min(this.page(),this.count()));}}';
  readonly page = signal(1);
  readonly count = signal(40);
  setCount(event: Event): void {
    const input = event.target as HTMLInputElement;
    const n = input.valueAsNumber;
    this.count.set(Number.isSafeInteger(n) && n > 0 ? n : 1);
    input.value = String(this.count());
    this.page.set(Math.min(this.page(), this.count()));
  }
}
