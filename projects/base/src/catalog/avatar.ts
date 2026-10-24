import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludAvatar } from 'bulud-ng/avatar';

import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="avatar · آواتار"
    [code]="source"
    description="آواتار · Standalone, Angour light/dark, RTL/LTR"
    api="name, src, label, theme; accessible image name, initials fallback on failed images, different src retries. No profile/auth dependencies."
    entry="bulud-ng/avatar"
    ><div class="toolbar">
      <bulud-avatar name="Bulud Library" /><bulud-avatar
        name="کاربر نمونه"
      /><bulud-avatar
        name="Broken image"
        src="/missing-avatar.png"
      /><bulud-avatar
        label="Custom avatar"
        name="Custom"
        [theme]="{ background: '#8040c0', foreground: '#fff' }"
      /></div
  ></feature-frame>`,
})
export class PageAvatar {
  readonly source =
    'import {Component,ChangeDetectionStrategy,signal,computed,inject} from \'@angular/core\';\nimport {BuludAvatar} from \'bulud-ng/avatar\';\n\n@Component({selector:\'example-avatar\',imports:[BuludAvatar],changeDetection:ChangeDetectionStrategy.OnPush,template:`<div class="toolbar"><bulud-avatar name="Bulud Library"/><bulud-avatar name="کاربر نمونه"/><bulud-avatar name="Broken image" src="/missing-avatar.png"/><bulud-avatar label="Custom avatar" name="Custom" [theme]="{background:\'#8040c0\',foreground:\'#fff\'}"/></div>`})\nexport class Example {}';
}
