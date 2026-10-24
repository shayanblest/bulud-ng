import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { BuludQueryService } from 'bulud-ng/query';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="query · سرویس URL و کوئری"
    [code]="source"
    description="سرویس URL و کوئری · Standalone, Angour light/dark, RTL/LTR"
    api="BuludQueryService and pure read/parse/update helpers translate URL state into typed list request/HTTP params; unknown filters are bounded and consumer API policy stays external."
    entry="bulud-ng/query"
    ><label for="catalog-url">URL</label
    ><input
      class="bulud-input"
      id="catalog-url"
      [value]="url()"
      (input)="edit($event)"
    />
    <pre dir="ltr">{{ request() }}</pre>
  </feature-frame>`,
})
export class PageQuery {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludQueryService} from \'bulud-ng/query\';\n\n@Component({selector:\'example-query\',imports:[],changeDetection:ChangeDetectionStrategy.OnPush,template:`<label for="catalog-url">URL</label><input class="bulud-input" id="catalog-url" [value]="url()" (input)="edit($event)"/><pre dir="ltr">{{request()}}</pre>`})\nexport class Example {readonly service=inject(BuludQueryService);readonly url=signal(\'/items?page=2&size=10&sort=-id\');readonly request=computed(()=>JSON.stringify(this.service.toRequest(this.url()),null,2));edit(e:Event):void{this.url.set((e.target as HTMLInputElement).value);}}';
  readonly service = inject(BuludQueryService);
  readonly url = signal('/items?page=2&size=10&sort=-id');
  readonly request = computed(() =>
    JSON.stringify(this.service.toRequest(this.url()), null, 2),
  );
  edit(e: Event): void {
    this.url.set((e.target as HTMLInputElement).value);
  }
}
