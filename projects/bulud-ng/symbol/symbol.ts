import {
  ChangeDetectionStrategy,
  Component,
  input,
  inject,
} from '@angular/core';
import { BULUD_SHARED_UI_CONFIG } from 'bulud-ng';
export type BuludSymbolName =
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-up'
  | 'chevron-down'
  | 'calendar'
  | 'x-close'
  | 'copy'
  | 'csv'
  | 'add-image'
  | 'language';
const paths: Readonly<Record<BuludSymbolName, string>> = {
  'chevron-right': 'm9 6 6 6-6 6',
  'chevron-left': 'm15 6-6 6 6 6',
  'chevron-up': 'm6 15 6-6 6 6',
  'chevron-down': 'm6 9 6 6 6-6',
  calendar: 'M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2ZM7 2v5m10-5v5M3 10h18',
  'x-close': 'm6 6 12 12M6 18 18 6',
  copy: 'M9 9h12v12H9zM15 9V3H3v12h6',
  csv: 'M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8m-8 4h8m-8 3h5',
  'add-image': 'M3 3h18v18H3zM3 17l6-6 5 5 3-3 4 4M16 6v4m-2-2h4',
  language:
    'M2 5h12M8 2v3m3 0c0 6-4 10-8 12m1-9c1 3 4 6 8 8m1 6 5-12 5 12m-8-4h6',
};

@Component({
  selector: 'bulud-symbol',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './symbol.css',
  host: { 'aria-hidden': 'true' },
  template: `@if (legacyClass() && legacy()) {
      <i [class]="legacyClass()" aria-hidden="true"></i>
    } @else {
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="bulud-symbol-svg"
      >
        <path [attr.d]="path()" />
      </svg>
    }`,
})
export class BuludSymbol {
  readonly name = input<BuludSymbolName>('language');
  readonly legacyClass = input('');
  readonly legacy = input(
    inject(BULUD_SHARED_UI_CONFIG).legacyIcons ?? false,
  );
  protected readonly path = () => paths[this.name()];
}
