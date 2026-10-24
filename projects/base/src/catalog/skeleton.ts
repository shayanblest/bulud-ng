import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { BuludSkeleton } from 'bulud-ng/skeleton';
import { BuludSwitch } from 'bulud-ng/switch';
import { BasePreferences } from '../preferences';
import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludSkeleton, BuludSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    [title]="p.text('اسکلتون', 'Skeleton')"
    [description]="
      p.text(
        'پیش‌نمایش بارگذاری محتوا با طراحی انگور',
        'Angour content loading placeholders'
      )
    "
    [code]="source"
    entry="bulud-ng/skeleton"
    api="shape: line | circle | thumbnail | card; lines: 1–12; animated, announce, label, theme. Set aria-busy on the actual content region. Respects reduced motion."
  >
    <bulud-switch
      [checked]="animated()"
      (checkedChange)="animated.set($event)"
      >{{ p.text('انیمیشن', 'Animation') }}</bulud-switch
    >
    <div class="samples">
      <div>
        <h3>{{ p.text('متن', 'Text') }}</h3>
        <bulud-skeleton
          [animated]="animated()"
          announce
          [label]="p.text('در حال بارگذاری…', 'Loading…')"
        />
      </div>
      <div class="row">
        <bulud-skeleton shape="circle" [animated]="animated()" /><bulud-skeleton
          shape="thumbnail"
          [animated]="animated()"
        />
      </div>
      <div>
        <h3>{{ p.text('کارت', 'Card') }}</h3>
        <bulud-skeleton shape="card" [animated]="animated()" />
      </div></div
  ></feature-frame>`,
  styles:
    '.samples{display:grid;gap:24px;margin-block:24px;max-inline-size:560px}.row{display:flex;gap:24px;align-items:center}h3{font-size:inherit}',
})
export class PageSkeleton {
  readonly p = inject(BasePreferences);
  readonly animated = signal(true);
  readonly source = `import {Component} from '@angular/core';
import {BuludSkeleton} from 'bulud-ng/skeleton';
@Component({imports:[BuludSkeleton],template:\`<section aria-busy="true"><bulud-skeleton shape="card" [lines]="3" announce label="Loading content"/></section>\`})
export class Example {}`;
}
